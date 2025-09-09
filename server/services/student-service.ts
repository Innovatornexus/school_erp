import { storage } from "../mongodb-storage";
import type { IStudent, InsertStudent } from "../../shared/mongodb-schemas";
import mongoose from "mongoose";

export class StudentService {
  // Transform MongoDB student to frontend format
  static transformStudentToFrontend(student: IStudent) {
    const studentObj = student.toObject();
    return {
      ...studentObj,
      id: student._id.toString(),
      userId: student.userId ? student.userId.toString() : null,
      schoolId: student.schoolId.toString(),
      classId: student.classId ? student.classId.toString() : null,
    };
  }

  // Create a new student
  static async createStudent(studentData: InsertStudent) {
    const student = await storage.createStudent(studentData);
    return this.transformStudentToFrontend(student);
  }

  // Get student by ID
  static async getStudent(id: string) {
    const student = await storage.getStudent(id);
    return student ? this.transformStudentToFrontend(student) : null;
  }

  // Get students by school
  static async getStudentsBySchool(schoolId: string) {
    const students = await storage.getStudentsBySchool(schoolId);
    return students.map(student => this.transformStudentToFrontend(student));
  }

  // Update student
  static async updateStudent(id: string, studentData: any) {
    // Convert string IDs to ObjectIds for database operations
    const processedData: any = { ...studentData };
    if (studentData.schoolId && typeof studentData.schoolId === 'string') {
      processedData.schoolId = new mongoose.Types.ObjectId(studentData.schoolId);
    }
    if (studentData.userId && typeof studentData.userId === 'string') {
      processedData.userId = new mongoose.Types.ObjectId(studentData.userId);
    }
    if (studentData.classId && typeof studentData.classId === 'string') {
      processedData.classId = new mongoose.Types.ObjectId(studentData.classId);
    }
    if (studentData.parentId && typeof studentData.parentId === 'string') {
      processedData.parentId = new mongoose.Types.ObjectId(studentData.parentId);
    }
    
    const student = await storage.updateStudent(id, processedData);
    return student ? this.transformStudentToFrontend(student) : null;
  }

  // Update student status
  static async updateStudentStatus(id: string, status: string) {
    const student = await storage.updateStudent(id, { status });
    return student ? this.transformStudentToFrontend(student) : null;
  }

  // Delete student
  static async deleteStudent(id: string) {
    return await storage.deleteStudent(id);
  }
}