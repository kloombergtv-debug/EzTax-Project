import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { DbStorage } from "./storage";
import { insertTaxReturnSchema, insertRetirementAssessmentSchema, retirementAssessmentDataSchema, insertBoardPostSchema, insertBoardReplySchema } from "@shared/schema";
import { z } from "zod";
import nodemailer from "nodemailer";
import path from "path";
import { getChatResponse } from "./openai";
import multer from "multer";
import { randomUUID } from "crypto";
import fs from "fs/promises";

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
    debug: true,
    logger: true
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Create storage instance
  const storage = new DbStorage();
  
  // Configure multer for image uploads
  const uploadsDir = path.join(process.cwd(), 'server', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});

  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${randomUUID()}${ext}`;
        cb(null, filename);
      }
    }),
    fileFilter: (req, file, cb) => {
      // Only allow image files
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files (JPG, PNG, GIF, WebP) are allowed'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
      files: 1 // Only one file at a time
    }
  });

  // Serve uploaded images  
  app.use('/uploads', express.static(uploadsDir));
  
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
      console.log(`사용자 ID ${userId}의 세금 신고서 조회 결과:`, taxReturn ? `ID ${taxReturn.id} 발견` : '없음');
      
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

  // Create or update tax return
  app.post("/api/tax-return", async (req, res) => {
    try {
      console.log(`POST /api/tax-return - 요청 받음`);
      
      // Only authenticated users can create tax returns
      if (!req.user) {
        console.log('인증되지 않은 사용자의 세금 신고서 생성 요청 거부');
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = (req.user as any).id;
      console.log(`사용자 ID ${userId}의 세금 신고서 생성/업데이트 요청`);
      
      const dataWithUserId = { ...req.body, userId };
      console.log('받은 데이터 크기:', JSON.stringify(req.body).length, '바이트');
      
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
      
      console.log('기존 데이터:', JSON.stringify(existingReturn.deductions, null, 2));
      console.log('새 데이터:', JSON.stringify(req.body.deductions, null, 2));
      
      // Deep merge existing data with new data to preserve all fields
      const mergedData = { ...req.body };
      
      // Specifically handle deductions merge
      if (existingReturn.deductions && req.body.deductions) {
        mergedData.deductions = {
          ...existingReturn.deductions,
          ...req.body.deductions
        };
        
        // Handle itemizedDeductions specifically to preserve medical expenses
        if (existingReturn.deductions.itemizedDeductions && req.body.deductions.itemizedDeductions) {
          mergedData.deductions.itemizedDeductions = {
            ...existingReturn.deductions.itemizedDeductions,
            ...req.body.deductions.itemizedDeductions
          };
        }
      } else if (existingReturn.deductions && !req.body.deductions) {
        // If req.body doesn't have deductions but existing data does, preserve existing
        mergedData.deductions = existingReturn.deductions;
      }
      
      console.log('병합된 데이터:', JSON.stringify(mergedData.deductions, null, 2));
      
      const updatedTaxReturn = await storage.updateTaxReturn(id, mergedData);
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

  // User API - Change Password (for logged in users)
  app.post('/api/change-password', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: '로그인이 필요합니다(Login required)' });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req.user as any).id;
      
      // Verify current password
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다(User not found)' });
      }
      
      // Check current password
      const crypto = await import('crypto');
      const { promisify } = await import('util');
      const scryptAsync = promisify(crypto.scrypt);
      
      if (user.password) {
        const [hash, salt] = user.password.split('.');
        const buf = (await scryptAsync(currentPassword, salt, 64)) as Buffer;
        const currentPasswordHash = buf.toString('hex');
        
        if (currentPasswordHash !== hash) {
          return res.status(400).json({ message: '현재 비밀번호가 올바르지 않습니다(Current password is incorrect)' });
        }
      }
      
      // Update to new password
      await storage.updateUserPassword(userId, newPassword);
      
      res.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다(Password changed successfully)' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: '비밀번호 변경 중 오류가 발생했습니다(Error changing password)' });
    }
  });

  // Password Reset Request (no login required)
  app.post('/api/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: '이메일을 입력해주세요(Email is required)' });
      }
      
      // Find user by email
      const users = await storage.getAllUsers();
      const user = users.find((u: any) => u.email === email);
      
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ 
          success: true, 
          message: '이메일이 존재하는 경우 비밀번호 재설정 링크를 발송했습니다(If email exists, password reset link has been sent)' 
        });
      }
      
      // Generate reset token
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
      
      // Store reset token (you might need to add this to your user schema)
      await storage.updateUser(user.id, { 
        resetToken,
        resetExpiry 
      });
      
      // Create email transporter (using existing Gmail setup)
      const transporter = createEmailTransporter();
      
      if (transporter) {
        // Use proper domain for Replit deployment
        const host = req.get('host');
        const isLocalhost = host.includes('localhost');
        const domain = isLocalhost ? 'https://3e18f96e-0fbf-4af6-b766-cfbae9f2437b-00-17nnd6cbvtwuy.janeway.replit.dev' : `${req.protocol}://${host}`;
        const resetUrl = `${domain}/reset-password?token=${resetToken}`;
        
        const mailOptions = {
          from: 'eztax88@gmail.com',
          to: email,
          subject: '비밀번호 재설정 요청 (Password Reset Request)',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">EzTax 비밀번호 재설정</h2>
              <p>안녕하세요,</p>
              <p>비밀번호 재설정을 요청하셨습니다. 아래 링크를 클릭하여 새 비밀번호를 설정하세요:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  비밀번호 재설정
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                이 링크는 1시간 후 만료됩니다.<br>
                만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시하세요.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #888; font-size: 12px;">
                Hello,<br>
                You have requested a password reset. Click the link above to set a new password.<br>
                This link expires in 1 hour. If you didn't request this, please ignore this email.
              </p>
            </div>
          `
        };
        
        try {
          console.log(`Attempting to send email to: ${email}`);
          console.log(`Reset URL: ${resetUrl}`); // Log the reset URL for debugging
          const info = await transporter.sendMail(mailOptions);
          console.log(`Password reset email sent successfully to: ${email}`, info.response);
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          console.log(`If email fails, use this reset URL directly: ${resetUrl}`);
          // Log more details about the error
          if (emailError.code) {
            console.error('Error code:', emailError.code);
          }
          if (emailError.response) {
            console.error('Error response:', emailError.response);
          }
        }
      } else {
        console.log(`Password reset requested for: ${email}, but email transporter not configured`);
      }
      
      res.json({ 
        success: true, 
        message: '이메일이 존재하는 경우 비밀번호 재설정 링크를 발송했습니다(If email exists, password reset link has been sent)' 
      });
      
    } catch (error) {
      console.error('Error in forgot password:', error);
      res.status(500).json({ message: '비밀번호 재설정 요청 중 오류가 발생했습니다(Error processing password reset request)' });
    }
  });

  // Reset Password with Token (no login required)
  app.post('/api/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: '토큰과 새 비밀번호가 필요합니다(Token and new password are required)' });
      }
      
      // Find user with valid reset token
      const users = await storage.getAllUsers();
      const user = users.find((u: any) => u.resetToken === token);
      
      if (!user) {
        return res.status(400).json({ message: '유효하지 않은 재설정 토큰입니다(Invalid reset token)' });
      }
      
      // Check if token is expired
      if (!user.resetExpiry || new Date(user.resetExpiry) < new Date()) {
        return res.status(400).json({ message: '재설정 토큰이 만료되었습니다(Reset token has expired)' });
      }
      
      // Update password and clear reset token
      await storage.updateUserPassword(user.id, newPassword);
      await storage.updateUser(user.id, { 
        resetToken: null,
        resetExpiry: null 
      });
      
      res.json({ 
        success: true, 
        message: '비밀번호가 성공적으로 재설정되었습니다(Password has been reset successfully)' 
      });
      
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: '비밀번호 재설정 중 오류가 발생했습니다(Error resetting password)' });
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

  // Retirement Assessment Routes
  
  // Get user's retirement assessments
  app.get("/api/retirement-assessments", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = (req.user as any).id;
      const assessments = await storage.getRetirementAssessmentsByUserId(userId);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching retirement assessments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get latest retirement assessment
  app.get("/api/retirement-assessment/latest", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = (req.user as any).id;
      const assessment = await storage.getLatestRetirementAssessment(userId);
      res.json(assessment || null);
    } catch (error) {
      console.error("Error fetching latest retirement assessment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create retirement assessment
  app.post("/api/retirement-assessment", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = (req.user as any).id;
      
      console.log("Retirement assessment request body:", req.body);
      console.log("Adding userId:", userId);
      
      const validationResult = insertRetirementAssessmentSchema.safeParse({
        ...req.body,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      if (!validationResult.success) {
        console.error("Retirement assessment validation error:", validationResult.error.issues);
        return res.status(400).json({
          message: "Validation error",
          errors: validationResult.error.issues
        });
      }

      const assessment = await storage.createRetirementAssessment(validationResult.data);
      res.status(201).json(assessment);
    } catch (error) {
      console.error("Error creating retirement assessment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update retirement assessment
  app.put("/api/retirement-assessment/:id", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = (req.user as any).id;
      const assessmentId = parseInt(req.params.id);
      
      // Check if assessment belongs to user
      const existingAssessment = await storage.getRetirementAssessment(assessmentId);
      if (!existingAssessment || existingAssessment.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedAssessment = await storage.updateRetirementAssessment(assessmentId, req.body);
      res.json(updatedAssessment);
    } catch (error) {
      console.error("Error updating retirement assessment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin API - Get all retirement assessments
  app.get('/api/admin/retirement-assessments', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).username !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const assessments = await storage.getAllRetirementAssessments();
      res.json(assessments);
    } catch (error) {
      console.error('Error getting retirement assessments:', error);
      res.status(500).json({ message: 'Failed to get retirement assessments' });
    }
  });

  // Admin API - Get user retirement assessments
  app.get('/api/admin/users/:id/retirement-assessments', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).username !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const userId = parseInt(req.params.id);
      const assessments = await storage.getRetirementAssessmentsByUserId(userId);
      res.json(assessments);
    } catch (error) {
      console.error('Error getting user retirement assessments:', error);
      res.status(500).json({ message: 'Failed to get user retirement assessments' });
    }
  });

  // Admin API - Delete user retirement assessments
  app.delete('/api/admin/users/:id/retirement-assessments', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).username !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const userId = parseInt(req.params.id);
      await storage.deleteUserRetirementAssessments(userId);
      res.json({ success: true, message: '사용자의 모든 은퇴 평가 데이터가 삭제되었습니다' });
    } catch (error) {
      console.error('Error deleting user retirement assessments:', error);
      res.status(500).json({ message: 'Failed to delete retirement assessments' });
    }
  });

  // Board Posts API
  // Image upload endpoint - Authentication required
  app.post('/api/uploads/images', (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  }, upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file uploaded' });
      }

      // Return the URL that can be used in markdown
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ 
        success: true, 
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Image upload failed' });
    }
  });

  // Get all board posts or by category
  app.get('/api/board/posts', async (req, res) => {
    try {
      const category = req.query.category as string;
      let posts;
      
      if (category && category !== 'all') {
        posts = await storage.getBoardPostsByCategory(category);
      } else {
        posts = await storage.getAllBoardPosts();
      }
      
      res.json(posts);
    } catch (error) {
      console.error('Error getting board posts:', error);
      res.status(500).json({ message: 'Failed to get board posts' });
    }
  });

  // Get single board post
  app.get('/api/board/posts/:id', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      const post = await storage.getBoardPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Increment view count
      await storage.incrementBoardPostViews(postId);
      
      res.json(post);
    } catch (error) {
      console.error('Error getting board post:', error);
      res.status(500).json({ message: 'Failed to get board post' });
    }
  });

  // Create new board post - Authentication required
  app.post('/api/board/posts', (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  }, async (req: any, res) => {
    try {
      // User must be authenticated to create posts
      const user = req.user as any;
      const userId = user.id;
      const authorName = user.displayName || user.username || '사용자';

      const postData = insertBoardPostSchema.parse({
        ...req.body,
        userId,
        authorId: userId.toString(), // Set authorId as string ID
        authorName
      });

      const newPost = await storage.createBoardPost(postData);
      res.status(201).json(newPost);
    } catch (error) {
      console.error('Error creating board post:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid post data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create board post' });
    }
  });

  // Update board post
  app.put('/api/board/posts/:id', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getBoardPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if user is the author or admin
      if (req.isAuthenticated && req.isAuthenticated()) {
        const user = req.user as any;
        if (post.userId !== user.id && user.username !== 'admin') {
          return res.status(403).json({ message: 'Unauthorized to edit this post' });
        }
      } else {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const updatedPost = await storage.updateBoardPost(postId, req.body);
      res.json(updatedPost);
    } catch (error) {
      console.error('Error updating board post:', error);
      res.status(500).json({ message: 'Failed to update board post' });
    }
  });

  // Delete board post
  app.delete('/api/board/posts/:id', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getBoardPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if user is the author or admin
      if (req.isAuthenticated && req.isAuthenticated()) {
        const user = req.user as any;
        if (post.userId !== user.id && user.username !== 'admin') {
          return res.status(403).json({ message: 'Unauthorized to delete this post' });
        }
      } else {
        return res.status(401).json({ message: 'Authentication required' });
      }

      await storage.deleteBoardPost(postId);
      res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting board post:', error);
      res.status(500).json({ message: 'Failed to delete board post' });
    }
  });

  // Get replies for a post
  app.get('/api/board/posts/:postId/replies', async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      const replies = await storage.getBoardRepliesByPostId(postId);
      res.json(replies);
    } catch (error) {
      console.error('Error getting replies:', error);
      res.status(500).json({ message: 'Failed to get replies' });
    }
  });

  // Create new reply - Authentication required
  app.post('/api/board/posts/:postId/replies', (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  }, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.postId);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      const user = req.user as any;
      const userId = user.id;
      const authorName = user.displayName || user.username || '사용자';

      const replyData = insertBoardReplySchema.parse({
        ...req.body,
        postId,
        userId,
        authorId: userId.toString(),
        authorName
      });

      const newReply = await storage.createBoardReply(replyData);
      res.status(201).json(newReply);
    } catch (error) {
      console.error('Error creating reply:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid reply data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create reply' });
    }
  });

  // Update reply
  app.put('/api/board/replies/:id', async (req, res) => {
    try {
      const replyId = parseInt(req.params.id);
      const reply = await storage.getBoardReply(replyId);
      
      if (!reply) {
        return res.status(404).json({ message: 'Reply not found' });
      }

      // Check if user is the author or admin
      if (req.isAuthenticated && req.isAuthenticated()) {
        const user = req.user as any;
        if (reply.userId !== user.id && user.username !== 'admin') {
          return res.status(403).json({ message: 'Unauthorized to edit this reply' });
        }
      } else {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const updatedReply = await storage.updateBoardReply(replyId, req.body);
      res.json(updatedReply);
    } catch (error) {
      console.error('Error updating reply:', error);
      res.status(500).json({ message: 'Failed to update reply' });
    }
  });

  // Delete reply
  app.delete('/api/board/replies/:id', async (req, res) => {
    try {
      const replyId = parseInt(req.params.id);
      const reply = await storage.getBoardReply(replyId);
      
      if (!reply) {
        return res.status(404).json({ message: 'Reply not found' });
      }

      // Check if user is the author or admin
      if (req.isAuthenticated && req.isAuthenticated()) {
        const user = req.user as any;
        if (reply.userId !== user.id && user.username !== 'admin') {
          return res.status(403).json({ message: 'Unauthorized to delete this reply' });
        }
      } else {
        return res.status(401).json({ message: 'Authentication required' });
      }

      await storage.deleteBoardReply(replyId);
      res.json({ success: true, message: 'Reply deleted successfully' });
    } catch (error) {
      console.error('Error deleting reply:', error);
      res.status(500).json({ message: 'Failed to delete reply' });
    }
  });

  // ChatBot API endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, context, messages } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: '메시지를 입력해주세요' });
      }

      console.log(`ChatBot request - Context: ${context}, Message: ${message.substring(0, 100)}...`);
      
      const response = await getChatResponse(message, context || '', messages || []);
      
      res.json({ message: response });
    } catch (error) {
      console.error('ChatBot API error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'AI 상담 서비스에 오류가 발생했습니다' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}