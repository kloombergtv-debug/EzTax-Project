import { users, type User, type InsertUser, taxReturns, type TaxReturn, type InsertTaxReturn, retirementAssessments, type RetirementAssessment, type InsertRetirementAssessment, boardPosts, type BoardPost, type InsertBoardPost } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: number): Promise<void>;
  updateUser(userId: number, updates: Partial<User>): Promise<User>;
  updateUserPassword(userId: number, newPassword: string): Promise<void>;
  
  // Tax return methods
  getTaxReturn(id: number): Promise<TaxReturn | undefined>;
  getAllTaxReturns(): Promise<TaxReturn[]>;
  getCurrentTaxReturn(userId: number): Promise<TaxReturn | undefined>;
  getTaxReturnByUserId(userId: number): Promise<TaxReturn | undefined>;
  createTaxReturn(taxReturn: InsertTaxReturn): Promise<TaxReturn>;
  updateTaxReturn(id: number, taxReturn: Partial<TaxReturn>): Promise<TaxReturn>;
  deleteTaxReturn(id: number): Promise<void>;
  deleteUserTaxReturns(userId: number): Promise<void>;
  
  // Retirement assessment methods
  getRetirementAssessment(id: number): Promise<RetirementAssessment | undefined>;
  getAllRetirementAssessments(): Promise<RetirementAssessment[]>;
  getRetirementAssessmentsByUserId(userId: number): Promise<RetirementAssessment[]>;
  getLatestRetirementAssessment(userId: number): Promise<RetirementAssessment | undefined>;
  createRetirementAssessment(assessment: InsertRetirementAssessment): Promise<RetirementAssessment>;
  updateRetirementAssessment(id: number, assessment: Partial<RetirementAssessment>): Promise<RetirementAssessment>;
  deleteRetirementAssessment(id: number): Promise<void>;
  deleteUserRetirementAssessments(userId: number): Promise<void>;
  
  // Board post methods
  getBoardPost(id: number): Promise<BoardPost | undefined>;
  getAllBoardPosts(): Promise<BoardPost[]>;
  getBoardPostsByCategory(category: string): Promise<BoardPost[]>;
  getBoardPostsByUserId(userId: number): Promise<BoardPost[]>;
  createBoardPost(post: InsertBoardPost): Promise<BoardPost>;
  updateBoardPost(id: number, post: Partial<BoardPost>): Promise<BoardPost>;
  deleteBoardPost(id: number): Promise<void>;
  incrementBoardPostViews(id: number): Promise<void>;
}

export class DbStorage implements IStorage {
  constructor() {
    // Initialize default data if database is empty
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    try {
      const existingUsers = await db.select().from(users);
      if (existingUsers.length === 0) {
        // Create default user
        await db.insert(users).values({
          username: "default",
          password: "password",
          email: null,
          googleId: null,
          displayName: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getTaxReturn(id: number): Promise<TaxReturn | undefined> {
    const [taxReturn] = await db.select().from(taxReturns).where(eq(taxReturns.id, id));
    return taxReturn || undefined;
  }

  async getAllTaxReturns(): Promise<TaxReturn[]> {
    return await db.select().from(taxReturns);
  }

  async getCurrentTaxReturn(userId: number): Promise<TaxReturn | undefined> {
    const [taxReturn] = await db
      .select()
      .from(taxReturns)
      .where(eq(taxReturns.userId, userId))
      .orderBy(desc(taxReturns.updatedAt))
      .limit(1);
    return taxReturn || undefined;
  }

  async getTaxReturnByUserId(userId: number): Promise<TaxReturn | undefined> {
    const [taxReturn] = await db
      .select()
      .from(taxReturns)
      .where(eq(taxReturns.userId, userId))
      .orderBy(desc(taxReturns.updatedAt))
      .limit(1);
    return taxReturn || undefined;
  }

  async createTaxReturn(insertTaxReturn: InsertTaxReturn): Promise<TaxReturn> {
    const [taxReturn] = await db
      .insert(taxReturns)
      .values({
        ...insertTaxReturn,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();
    return taxReturn;
  }

  async updateTaxReturn(id: number, updates: Partial<TaxReturn>): Promise<TaxReturn> {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const [result] = await db
      .update(taxReturns)
      .set(updateData)
      .where(eq(taxReturns.id, id))
      .returning();
    
    if (!result) {
      throw new Error(`Tax return with ID ${id} not found`);
    }
    
    return result;
  }
  
  async deleteTaxReturn(id: number): Promise<void> {
    await db.delete(taxReturns).where(eq(taxReturns.id, id));
  }

  // Admin methods
  async deleteUser(userId: number): Promise<void> {
    const result = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    
    if (!result || result.length === 0) {
      throw new Error(`사용자 ID ${userId}를 찾을 수 없습니다`);
    }
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`사용자 ID ${userId}를 찾을 수 없습니다`);
    }
    
    return updatedUser;
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    const crypto = await import('crypto');
    const { promisify } = await import('util');
    const scryptAsync = promisify(crypto.scrypt);
    
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');
    // Hash password with salt
    const buf = (await scryptAsync(newPassword, salt, 64)) as Buffer;
    const hash = buf.toString('hex');
    // Store as hash.salt format
    const hashedPassword = `${hash}.${salt}`;
    
    const result = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    
    if (!result || result.length === 0) {
      throw new Error(`사용자 ID ${userId}를 찾을 수 없습니다`);
    }
  }

  async deleteUserTaxReturns(userId: number): Promise<void> {
    await db
      .delete(taxReturns)
      .where(eq(taxReturns.userId, userId));
  }

  // Retirement Assessment Methods
  async getRetirementAssessment(id: number): Promise<RetirementAssessment | undefined> {
    const [assessment] = await db.select().from(retirementAssessments).where(eq(retirementAssessments.id, id));
    return assessment || undefined;
  }

  async getAllRetirementAssessments(): Promise<RetirementAssessment[]> {
    return await db.select().from(retirementAssessments).orderBy(desc(retirementAssessments.createdAt));
  }

  async getRetirementAssessmentsByUserId(userId: number): Promise<RetirementAssessment[]> {
    return await db.select().from(retirementAssessments)
      .where(eq(retirementAssessments.userId, userId))
      .orderBy(desc(retirementAssessments.createdAt));
  }

  async getLatestRetirementAssessment(userId: number): Promise<RetirementAssessment | undefined> {
    const [assessment] = await db.select().from(retirementAssessments)
      .where(eq(retirementAssessments.userId, userId))
      .orderBy(desc(retirementAssessments.createdAt))
      .limit(1);
    return assessment || undefined;
  }

  async createRetirementAssessment(insertAssessment: InsertRetirementAssessment): Promise<RetirementAssessment> {
    const [assessment] = await db
      .insert(retirementAssessments)
      .values({
        ...insertAssessment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();
    return assessment;
  }

  async updateRetirementAssessment(id: number, assessment: Partial<RetirementAssessment>): Promise<RetirementAssessment> {
    const updateData = {
      ...assessment,
      updatedAt: new Date().toISOString()
    };

    const [updatedAssessment] = await db
      .update(retirementAssessments)
      .set(updateData)
      .where(eq(retirementAssessments.id, id))
      .returning();
    
    if (!updatedAssessment) {
      throw new Error(`은퇴 평가 ID ${id}를 찾을 수 없습니다`);
    }
    
    return updatedAssessment;
  }

  async deleteRetirementAssessment(id: number): Promise<void> {
    await db.delete(retirementAssessments).where(eq(retirementAssessments.id, id));
  }

  async deleteUserRetirementAssessments(userId: number): Promise<void> {
    await db
      .delete(retirementAssessments)
      .where(eq(retirementAssessments.userId, userId));
  }

  // Board Post Methods
  async getBoardPost(id: number): Promise<BoardPost | undefined> {
    const [post] = await db.select().from(boardPosts).where(eq(boardPosts.id, id));
    return post || undefined;
  }

  async getAllBoardPosts(): Promise<BoardPost[]> {
    return await db.select().from(boardPosts).orderBy(desc(boardPosts.createdAt));
  }

  async getBoardPostsByCategory(category: string): Promise<BoardPost[]> {
    if (category === 'all') {
      return this.getAllBoardPosts();
    }
    return await db.select().from(boardPosts)
      .where(eq(boardPosts.category, category))
      .orderBy(desc(boardPosts.createdAt));
  }

  async getBoardPostsByUserId(userId: number): Promise<BoardPost[]> {
    return await db.select().from(boardPosts)
      .where(eq(boardPosts.userId, userId))
      .orderBy(desc(boardPosts.createdAt));
  }

  async createBoardPost(insertPost: InsertBoardPost): Promise<BoardPost> {
    const [post] = await db
      .insert(boardPosts)
      .values({
        ...insertPost
        // createdAt and updatedAt will be set automatically by defaultNow()
      })
      .returning();
    return post;
  }

  async updateBoardPost(id: number, post: Partial<BoardPost>): Promise<BoardPost> {
    const [updatedPost] = await db
      .update(boardPosts)
      .set({
        ...post,
        updatedAt: new Date()  // Use Date object for timestamp column
      })
      .where(eq(boardPosts.id, id))
      .returning();
    
    if (!updatedPost) {
      throw new Error(`게시글 ID ${id}를 찾을 수 없습니다`);
    }
    
    return updatedPost;
  }

  async deleteBoardPost(id: number): Promise<void> {
    await db.delete(boardPosts).where(eq(boardPosts.id, id));
  }

  async incrementBoardPostViews(id: number): Promise<void> {
    await db
      .update(boardPosts)
      .set({ 
        views: boardPosts.views + 1,
        updatedAt: new Date()  // Use Date object for timestamp column
      })
      .where(eq(boardPosts.id, id));
  }
}

// Database storage instance
export const storage = new DbStorage();