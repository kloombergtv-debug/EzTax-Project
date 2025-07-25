import type { Express } from "express";
import { createServer, type Server } from "http";
import { DbStorage } from "./storage";
import { insertTaxReturnSchema } from "@shared/schema";
import { z } from "zod";
import nodemailer from "nodemailer";
import path from "path";

// Configure email transporter for Gmail with better error handling
const createEmailTransporter = () => {
  // Force use eztax88@gmail.com and the correct app password
  const emailUser = 'eztax88@gmail.com';
  const emailPass = 'fetlnvjnmkjetfov';
    
  if (!emailUser || !emailPass) {
    console.log('Email credentials not configured - emails will be logged only');
    return null;
  }

  console.log(`Configuring email for: ${emailUser}`);
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    },
    debug: false,
    logger: false
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Create storage instance
  const storage = new DbStorage();
  
  app.get("/api/ping", (req, res) => {
    res.json({ ok: true });
  });

  // Serve admin setup page
  app.get("/setup-admin", (req, res) => {
    res.sendFile(path.resolve(process.cwd(), "setup-admin.html"));
  });

  // Temporary admin setup endpoint for deployment
  app.post("/api/setup-admin", async (req, res) => {
    try {
      const crypto = await import('crypto');
      const { promisify } = await import('util');
      const scryptAsync = promisify(crypto.scrypt);
      
      // Check if admin already exists
      const existingUsers = await storage.getAllUsers();
      const adminExists = existingUsers.some((user: any) => user.username === 'admin');
      
      if (adminExists) {
        return res.json({ 
          message: "Admin already exists", 
          success: true,
          userCount: existingUsers.length,
          existingAdmin: existingUsers.find((user: any) => user.username === 'admin')?.id
        });
      }

      // Hash the password properly
      const salt = crypto.randomBytes(16).toString('hex');
      const buf = (await scryptAsync('admin', salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString('hex')}.${salt}`;

      // Create admin user with hashed password
      const adminUser = await storage.createUser({
        username: 'admin',
        password: hashedPassword,
        email: null,
        googleId: null,
        displayName: null
      });

      res.json({ 
        message: "Admin user created successfully with proper password hashing", 
        username: adminUser.username,
        userId: adminUser.id,
        userCount: existingUsers.length + 1,
        success: true 
      });
    } catch (error: any) {
      console.error('Admin setup error:', error);
      res.status(500).json({ 
        message: error.message || "Admin setup failed",
        error: error.stack,
        success: false
      });
    }
  });

  // Test login endpoint for debugging
  app.post("/api/test-login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.json({ 
          message: "User not found",
          success: false,
          allUsers: (await storage.getAllUsers()).map((u: any) => ({ id: u.id, username: u.username }))
        });
      }

      res.json({
        message: "User found",
        success: true,
        userId: user.id,
        username: user.username,
        hasPassword: !!user.password,
        passwordLength: user.password?.length || 0
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: error.message,
        success: false
      });
    }
  });

  // Admin endpoints
  app.get("/api/admin/users", async (req, res) => {
    try {
      // Enhanced admin check - only allow specific admin users
      if (!req.user) {
        return res.status(401).json({ message: "인증이 필요합니다" });
      }

      // Check if user has admin privileges - only 'admin' allowed
      if ((req.user as any).username !== 'admin') {
        return res.status(403).json({ message: "관리자 권한이 필요합니다" });
      }

      const users = await storage.getAllUsers();
      const taxReturns = await storage.getAllTaxReturns();
      
      // Create admin user data with tax return counts
      const adminUsers = users.map(user => {
        const userTaxReturns = taxReturns.filter(tr => tr.userId === user.id);
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          googleId: user.googleId,
          createdAt: user.createdAt,
          lastLogin: user.updatedAt, // Using updatedAt as proxy for last login
          taxReturnsCount: userTaxReturns.length,
          status: 'active' as const
        };
      });

      res.json(adminUsers);
    } catch (error) {
      console.error("Admin users fetch error:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다" });
    }
  });
  
  // Get current tax return (always gets the most recent one)
  app.get("/api/tax-return", async (req, res) => {
    try {
      // Only authenticated users can access tax returns
      if (!req.user) {
        // Return empty initial data for non-authenticated users
        const emptyTaxReturn = {
          id: 0,
          userId: 0,
          taxYear: 2025,
          status: "in_progress",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          personalInfo: null,
          income: null,
          deductions: null,
          taxCredits: null,
          retirementContributions: null,
          additionalTax: null,
          calculatedResults: null
        };
        return res.json(emptyTaxReturn);
      }
      
      const userId = (req.user as any).id;
      console.log(`GET /api/tax-return - 인증된 사용자 ID: ${userId} 데이터 요청`);
      
      const taxReturn = await storage.getTaxReturnByUserId(userId);
      console.log(`사용자 ${userId} 세금 데이터 조회 결과:`, taxReturn ? `발견됨 (ID: ${taxReturn.id})` : '없음');
      
      if (!taxReturn) {
        console.log(`사용자 ID ${userId}의 세금 신고서 없음 - 새 빈 신고서 생성`);
        
        // Create a new empty tax return for this user
        const newTaxReturn = await storage.createTaxReturn({
          userId: userId,
          taxYear: 2025,
          status: "in_progress",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        console.log(`사용자 ID ${userId}에게 새 세금 신고서 생성됨 (ID: ${newTaxReturn.id})`);
        res.json(newTaxReturn);
      } else {
        // CRITICAL SECURITY CHECK: Verify the tax return belongs to the requesting user
        if (taxReturn.userId !== userId) {
          console.error(`보안 위반: 세금 신고서 ${taxReturn.id}는 사용자 ${taxReturn.userId}에게 속하지만 사용자 ${userId}가 요청함`);
          
          // Create a new tax return for the requesting user instead
          const newTaxReturn = await storage.createTaxReturn({
            userId: userId,
            taxYear: 2025,
            status: "in_progress"
          });
          
          console.log(`보안 위반으로 인해 사용자 ID ${userId}에게 새 세금 신고서 생성됨`);
          res.json(newTaxReturn);
        } else {
          console.log(`사용자 ID ${userId}의 기존 세금 신고서 반환 (ID: ${taxReturn.id})`);
          res.json(taxReturn);
        }
      }
    } catch (error) {
      console.error("Error fetching tax return:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get tax return by user ID (debugging endpoint - temporarily bypasses auth)
  app.get("/api/tax-return/user/:userId", async (req, res) => {
    try {
      const requestedUserId = parseInt(req.params.userId);
      
      console.log(`사용자 ID ${requestedUserId} 데이터 직접 요청 (디버깅용)`);
      
      // Verify the user exists in database
      const userExists = await storage.getUserById(requestedUserId);
      if (!userExists) {
        console.log(`사용자 ID ${requestedUserId} 데이터베이스에서 찾을 수 없음`);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`사용자 ${userExists.username} (ID: ${requestedUserId}) 확인됨`);
      
      const taxReturn = await storage.getTaxReturnByUserId(requestedUserId);
      
      if (!taxReturn) {
        console.log(`사용자 ID ${requestedUserId}의 세금 데이터 없음`);
        return res.status(404).json({ message: "No tax data found" });
      } else {
        console.log(`사용자 ID ${requestedUserId}의 기존 데이터 반환 (ID: ${taxReturn.id})`);
        console.log('데이터 요약:', {
          personalInfo: !!taxReturn.personalInfo,
          income: !!taxReturn.income,
          deductions: !!taxReturn.deductions,
          taxCredits: !!taxReturn.taxCredits
        });
        res.json(taxReturn);
      }
    } catch (error) {
      console.error("Error fetching tax return by user ID:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create or update tax return
  app.post("/api/tax-return", async (req, res) => {
    try {
      // Only authenticated users can create tax returns
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = (req.user as any).id;
      const dataWithUserId = { ...req.body, userId };
      
      const validationResult = insertTaxReturnSchema.safeParse(dataWithUserId);
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: validationResult.error.issues
        });
      }

      const taxReturn = await storage.createTaxReturn(validationResult.data);
      res.status(201).json(taxReturn);
    } catch (error) {
      console.error("Error creating tax return:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update existing tax return
  app.put("/api/tax-return/:id", async (req, res) => {
    try {
      // Only authenticated users can update tax returns
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
      // Verify that the tax return belongs to the authenticated user
      const existingReturn = await storage.getTaxReturn(id);
      if (!existingReturn || existingReturn.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      console.log(`사용자 ${userId} 세금 데이터 업데이트 요청 (ID: ${id})`);
      console.log('업데이트 필드:', Object.keys(req.body).join(', '));
      
      // Deep merge function to preserve all existing data
      const deepMerge = (target: any, source: any) => {
        if (!source) return target;
        if (!target) return source;
        
        const result = { ...target };
        
        for (const key in source) {
          if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
          } else {
            result[key] = source[key];
          }
        }
        
        return result;
      };

      // Deep merge all data to preserve existing information
      const mergedData = {
        ...existingReturn,
        ...req.body,
        updatedAt: new Date().toISOString(),
        personalInfo: req.body.personalInfo ? deepMerge(existingReturn.personalInfo, req.body.personalInfo) : existingReturn.personalInfo,
        income: req.body.income ? deepMerge(existingReturn.income, req.body.income) : existingReturn.income,
        deductions: req.body.deductions ? deepMerge(existingReturn.deductions, req.body.deductions) : existingReturn.deductions,
        taxCredits: req.body.taxCredits ? deepMerge(existingReturn.taxCredits, req.body.taxCredits) : existingReturn.taxCredits,
        retirementContributions: req.body.retirementContributions ? deepMerge(existingReturn.retirementContributions, req.body.retirementContributions) : existingReturn.retirementContributions,
        additionalTax: req.body.additionalTax ? deepMerge(existingReturn.additionalTax, req.body.additionalTax) : existingReturn.additionalTax,
        calculatedResults: req.body.calculatedResults || existingReturn.calculatedResults
      };
      
      console.log('데이터 업데이트 완료 - 시간:', mergedData.updatedAt);
      
      const updatedTaxReturn = await storage.updateTaxReturn(id, mergedData);
      console.log(`사용자 ${userId} 데이터 저장 성공 - 다음 로그인 시 복원됨`);
      res.json(updatedTaxReturn);
    } catch (error) {
      console.error("Error updating tax return:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send application email
  app.post("/api/send-application", async (req, res) => {
    try {
      const { name, phone, email, selectedPlan, additionalRequests } = req.body;
      
      // Validate required fields
      if (!name || !phone || !email || !selectedPlan) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Map plan codes to readable names
      const planNames = {
        'basic': '기본 검토 ($99) - 개인 기본 세금 신고 검토',
        'advanced': '고급 검토 ($199) - 복잡한 세무 상황 검토',
        'premium': '프리미엄 검토 ($299) - 종합 세무 자문 및 최적화'
      };

      const planName = planNames[selectedPlan as keyof typeof planNames] || selectedPlan;
      
      // Create email content
      const emailContent = `
새로운 유료검토 서비스 신청이 접수되었습니다.

신청자 정보:
- 이름: ${name}
- 전화번호: ${phone}
- 이메일: ${email}
- 선택한 플랜: ${planName}

추가 요청사항:
${additionalRequests || '없음'}

신청 시간: ${new Date().toLocaleString('ko-KR')}
      `.trim();

      // Try to send actual email if credentials are available
      const transporter = createEmailTransporter();
      
      if (transporter) {
        try {
          // Test connection first
          await transporter.verify();
          console.log('Gmail SMTP connection verified successfully');
          
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'eztax88@gmail.com',
            subject: '[EzTax] 새로운 유료검토 서비스 신청',
            text: emailContent,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0055AA;">새로운 유료검토 서비스 신청</h2>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
                  <h3>신청자 정보:</h3>
                  <ul style="list-style: none; padding: 0;">
                    <li><strong>이름:</strong> ${name}</li>
                    <li><strong>전화번호:</strong> ${phone}</li>
                    <li><strong>이메일:</strong> ${email}</li>
                    <li><strong>선택한 플랜:</strong> ${planName}</li>
                  </ul>
                  
                  <h3>추가 요청사항:</h3>
                  <p style="background-color: white; padding: 15px; border-radius: 3px;">
                    ${additionalRequests || '없음'}
                  </p>
                  
                  <p style="margin-top: 20px; color: #666;">
                    <strong>신청 시간:</strong> ${new Date().toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            `
          };

          const info = await transporter.sendMail(mailOptions);
          console.log('✅ Email sent successfully to eztax88@gmail.com');
          console.log('Message ID:', info.messageId);
          console.log('Response:', info.response);
        } catch (emailError) {
          console.error('❌ Failed to send email:', emailError);
          console.log('📧 Application Email Content (logged as backup):');
          console.log('To: eztax88@gmail.com');
          console.log('Subject: [EzTax] 새로운 유료검토 서비스 신청');
          console.log('Content:', emailContent);
        }
      } else {
        console.log('📧 Email credentials not configured - logging application:');
        console.log('To: eztax88@gmail.com');
        console.log('Subject: [EzTax] 새로운 유료검토 서비스 신청');
        console.log('Content:', emailContent);
      }
      
      res.json({ 
        success: true, 
        message: "Application submitted successfully" 
      });
    } catch (error) {
      console.error("Error sending application email:", error);
      res.status(500).json({ message: "Failed to send application" });
    }
  });

  // Admin API - Delete User
  app.delete('/api/admin/users/:id', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).username !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const userId = parseInt(req.params.id);
      
      // Prevent deletion of admin user
      if (userId === 3) {
        return res.status(400).json({ message: '관리자 계정은 삭제할 수 없습니다' });
      }

      // Delete user's tax returns first (cascade delete)
      await storage.deleteUserTaxReturns(userId);
      
      // Delete user
      await storage.deleteUser(userId);
      
      res.json({ success: true, message: '사용자가 성공적으로 삭제되었습니다' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Admin API - Update User
  app.put('/api/admin/users/:id', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).username !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const userId = parseInt(req.params.id);
      const { username, email, displayName } = req.body;
      
      // Prevent modification of admin username
      if (userId === 3 && username !== 'admin') {
        return res.status(400).json({ message: '관리자 계정의 아이디는 변경할 수 없습니다' });
      }

      const updatedUser = await storage.updateUser(userId, {
        username,
        email,
        displayName
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Admin API - Reset User Password
  app.post('/api/admin/users/:id/reset-password', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).username !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      await storage.updateUserPassword(userId, newPassword);
      
      res.json({ success: true, message: '비밀번호가 성공적으로 재설정되었습니다' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // Admin API - Delete User Tax Returns
  app.delete('/api/admin/users/:id/tax-returns', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).username !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const userId = parseInt(req.params.id);
      
      await storage.deleteUserTaxReturns(userId);
      
      res.json({ success: true, message: '사용자의 모든 세금 신고서가 삭제되었습니다' });
    } catch (error) {
      console.error('Error deleting tax returns:', error);
      res.status(500).json({ message: 'Failed to delete tax returns' });
    }
  });

  // Send expert consultation email
  app.post("/api/send-consultation-email", async (req, res) => {
    try {
      const { name, phone, email, message } = req.body;
      
      // Validate required fields
      if (!name || !phone || !email) {
        return res.status(400).json({ message: "필수 정보가 누락되었습니다" });
      }

      // Create email content
      const emailContent = `
새로운 전문가 상담 요청이 접수되었습니다.

상담자 정보:
- 이름: ${name}
- 전화번호: ${phone}
- 이메일: ${email}

상담 내용:
${message || '상담 요청'}

요청 시간: ${new Date().toLocaleString('ko-KR')}
      `.trim();

      // Try to send actual email if credentials are available
      const transporter = createEmailTransporter();
      
      if (transporter) {
        try {
          // Test connection first
          await transporter.verify();
          console.log('Gmail SMTP connection verified successfully');
          
          // Configure recipient emails
          const recipients = ['eztax88@gmail.com'];
          
          // Add additional recipient email if provided in environment variable
          const additionalEmail = process.env.ADDITIONAL_EMAIL;
          if (additionalEmail) {
            recipients.push(additionalEmail);
          }

          const mailOptions = {
            from: 'eztax88@gmail.com',
            to: recipients,
            subject: '[EzTax] 새로운 전문가 상담 요청',
            text: emailContent,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0055AA;">새로운 전문가 상담 요청</h2>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
                  <h3>상담자 정보:</h3>
                  <ul style="list-style: none; padding: 0;">
                    <li><strong>이름:</strong> ${name}</li>
                    <li><strong>전화번호:</strong> ${phone}</li>
                    <li><strong>이메일:</strong> ${email}</li>
                  </ul>
                  
                  <h3>상담 내용:</h3>
                  <p style="background-color: white; padding: 15px; border-radius: 3px;">
                    ${message || '상담 요청'}
                  </p>
                  
                  <p style="margin-top: 20px; color: #666;">
                    <strong>요청 시간:</strong> ${new Date().toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            `
          };

          const info = await transporter.sendMail(mailOptions);
          console.log('✅ Consultation email sent successfully to eztax88@gmail.com');
          console.log('Message ID:', info.messageId);
        } catch (emailError) {
          console.error('❌ Failed to send consultation email:', emailError);
          console.log('📧 Consultation Email Content (logged as backup):');
          console.log('To: eztax88@gmail.com');
          console.log('Subject: [EzTax] 새로운 전문가 상담 요청');
          console.log('Content:', emailContent);
        }
      } else {
        console.log('📧 Email credentials not configured - logging consultation request:');
        console.log('To: eztax88@gmail.com');
        console.log('Subject: [EzTax] 새로운 전문가 상담 요청');
        console.log('Content:', emailContent);
      }
      
      res.json({ 
        success: true, 
        message: "상담 요청이 성공적으로 전송되었습니다" 
      });
    } catch (error) {
      console.error("Error sending consultation email:", error);
      res.status(500).json({ message: "상담 요청 전송에 실패했습니다" });
    }
  });

  // Admin API - Get User Tax Data
  app.get('/api/admin/users/:id/tax-data', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).username !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const userId = parseInt(req.params.id);
      console.log(`Admin requesting tax data for user ID: ${userId}`);
      
      const taxData = await storage.getTaxReturnByUserId(userId);
      console.log(`Retrieved tax data for user ${userId}:`, taxData ? 'Found' : 'Not found');
      
      if (taxData) {
        console.log(`Tax data ID: ${taxData.id}, User ID: ${taxData.userId}`);
        console.log(`Personal info exists: ${!!taxData.personalInfo}`);
        console.log(`Income exists: ${!!taxData.income}`);
        console.log(`Deductions exists: ${!!taxData.deductions}`);
        console.log(`Tax credits exists: ${!!taxData.taxCredits}`);
      }
      
      res.json(taxData || null);
    } catch (error) {
      console.error('Error getting user tax data:', error);
      res.status(500).json({ message: 'Failed to get tax data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}