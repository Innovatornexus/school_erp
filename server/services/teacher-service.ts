import { storage } from "../mongodb-storage";
import type { ITeacher, InsertTeacher } from "../../shared/mongodb-schemas";

export class TeacherService {
  // Transform MongoDB teacher to frontend format
  static transformTeacherToFrontend(teacher: ITeacher) {
    const teacherObj = teacher.toObject();
    return {
      ...teacherObj,
      id: teacher._id.toString(),
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
  static async updateTeacher(id: string, teacherData: Partial<ITeacher>) {
    const teacher = await storage.updateTeacher(id, teacherData);
    return teacher ? this.transformTeacherToFrontend(teacher) : null;
  }

  // Delete teacher
  static async deleteTeacher(id: string) {
    return await storage.deleteTeacher(id);
  }
}