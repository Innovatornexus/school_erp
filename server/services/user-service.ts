import { storage } from "../mongodb-storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { IUser } from "../../shared/mongodb-schemas";

const scryptAsync = promisify(scrypt);

// Password hashing function
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Password comparison function
export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export class UserService {
  // Transform MongoDB user to frontend format
  static transformUserToFrontend(user: IUser) {
    const { password, __v, ...userWithoutPassword } = user.toObject();
    return {
      ...userWithoutPassword,
      id: user._id.toString(),
      schoolId: user.schoolId ? user.schoolId.toString() : null,
      classId: user.classId ? user.classId.toString() : null,
    };
  }

  // Create a new user
  static async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent';
    schoolId?: string;
    classId?: string;
  }) {
    const hashedPassword = await hashPassword(userData.password);
    
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    return this.transformUserToFrontend(user);
  }

  // Get user by email
  static async getUserByEmail(email: string) {
    const user = await storage.getUserByEmail(email);
    return user ? this.transformUserToFrontend(user) : null;
  }

  // Get user by ID
  static async getUserById(id: string) {
    const user = await storage.getUserById(id);
    return user ? this.transformUserToFrontend(user) : null;
  }

  // Verify user password
  static async verifyPassword(email: string, password: string) {
    const user = await storage.getUserByEmail(email);
    if (!user) return null;

    const isValid = await comparePasswords(password, user.password);
    if (!isValid) return null;

    return this.transformUserToFrontend(user);
  }

  // Update user
  static async updateUser(id: string, userData: Partial<IUser>) {
    const user = await storage.updateUser(id, userData);
    return user ? this.transformUserToFrontend(user) : null;
  }

  // Delete user
  static async deleteUser(id: string) {
    return await storage.deleteUser(id);
  }
}