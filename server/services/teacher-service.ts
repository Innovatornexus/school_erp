import { storage } from "../mongodb-storage";
import type { ITeacher, InsertTeacher } from "../../shared/mongodb-schemas";
import mongoose from "mongoose";

export class TeacherService {
  // Transform MongoDB teacher to frontend format
  static transformTeacherToFrontend(teacher: ITeacher) {
    const teacherObj = teacher.toObject();
    return {
      ...teacherObj,
      id: (teacher._id as any).toString(),
      userId: teacher.userId.toString(),
      schoolId: teacher.schoolId.toString(),
    };
  }

  // Create a new teacher
  static async createTeacher(teacherData: InsertTeacher) {
    const teacher = await storage.createTeacher(teacherData);
    return this.transformTeacherToFrontend(teacher);
  }

  // Get teacher by ID
  static async getTeacher(id: string) {
    const teacher = await storage.getTeacher(id);
    return teacher ? this.transformTeacherToFrontend(teacher) : null;
  }

  // Get teacher by user ID
  static async getTeacherByUserId(userId: string) {
    const teacher = await storage.getTeacherByUserId(userId);
    return teacher ? this.transformTeacherToFrontend(teacher) : null;
  }

  // Get teachers by school
  static async getTeachersBySchool(schoolId: string) {
    const teachers = await storage.getTeachersBySchool(schoolId);
    return teachers.map(teacher => this.transformTeacherToFrontend(teacher));
  }

  // Update teacher
  static async updateTeacher(id: string, teacherData: any) {
    // Convert string IDs to ObjectIds for database operations
    const processedData: any = { ...teacherData };
    if (teacherData.schoolId && typeof teacherData.schoolId === 'string') {
      processedData.schoolId = new mongoose.Types.ObjectId(teacherData.schoolId);
    }
    if (teacherData.userId && typeof teacherData.userId === 'string') {
      processedData.userId = new mongoose.Types.ObjectId(teacherData.userId);
    }
    
    const teacher = await storage.updateTeacher(id, processedData);
    return teacher ? this.transformTeacherToFrontend(teacher) : null;
  }

  // Delete teacher
  static async deleteTeacher(id: string) {
    // Get teacher details before deletion to get the userId
    const teacher = await storage.getTeacher(id);
    if (!teacher) {
      return false;
    }

    const userId = teacher.userId?.toString();

    // Delete the teacher
    const teacherDeleted = await storage.deleteTeacher(id);

    if (teacherDeleted) {
      // Also delete the corresponding user record
      if (userId) {
        try {
          await storage.deleteUser(userId);
        } catch (error) {
          console.error(`Error deleting user ${userId} for teacher ${id}:`, error);
          // Don't fail the teacher deletion if user deletion fails
        }
      }
    }

    return teacherDeleted;
  }
}