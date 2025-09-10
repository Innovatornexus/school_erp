import { storage } from "../mongodb-storage";
import type { IStudent, InsertStudent } from "../../shared/mongodb-schemas";
import mongoose from "mongoose";

export class StudentService {
  // Transform MongoDB student to frontend format
  static transformStudentToFrontend(student: IStudent) {
    const studentObj = student.toObject();
    return {
      ...studentObj,
      id: (student._id as any).toString(),
      userId: student.userId ? student.userId.toString() : null,
      schoolId: student.schoolId.toString(),
      classId: student.classId ? student.classId.toString() : null,
      dateOfBirth: student.dateOfBirth.toISOString().split("T")[0], // Convert Date to string
      admissionDate: student.admissionDate.toISOString().split("T")[0], // Convert Date to string
      createdAt: student.createdAt.toISOString(),
      updatedAt: student.createdAt.toISOString(), // MongoDB doesn't have updatedAt, use createdAt
    };
  }
  // Generate roll number based on class grade, section and student count
  static async generateRollNumber(classId: string): Promise<string> {
    try {
      // Get class information
      const classInfo = await storage.getClass(classId);
      if (!classInfo) {
        throw new Error("Class not found");
      }

      // Grade (no leading zero)
      const grade = classInfo.grade.toString();

      // Section letter → number (A=1, B=2, …)
      const section = classInfo.section.toUpperCase();
      const sectionNumber = section.charCodeAt(0) - "A".charCodeAt(0) + 1;

      // Student number (always 2 digits)
      const existingStudentsCount = await storage.getStudentCountByClass(
        classId
      );
      const studentNumber = (existingStudentsCount + 1)
        .toString()
        .padStart(2, "0");

      // Format: [grade][section number][student number]
      const rollNumber = `${grade}${sectionNumber}${studentNumber}`;

      return rollNumber;
    } catch (error) {
      console.error("Error generating roll number:", error);
      throw new Error("Failed to generate roll number");
    }
  }

  // Create a new student
  static async createStudent(studentData: InsertStudent) {
    // Generate roll number if classId is provided
    let rollNo = "";
    if (studentData.classId) {
      rollNo = await this.generateRollNumber(studentData.classId);
    }

    const studentWithRollNo = {
      ...studentData,
      rollNo,
    };

    const student = await storage.createStudent(studentWithRollNo);
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
    return students.map((student) => this.transformStudentToFrontend(student));
  }

  // Update student
  static async updateStudent(id: string, studentData: any) {
    // Get current student data to check if class changed
    const currentStudent = await storage.getStudent(id);
    const oldClassId = currentStudent?.classId?.toString();

    // Convert string IDs to ObjectIds for database operations
    const processedData: any = { ...studentData };
    if (studentData.schoolId && typeof studentData.schoolId === "string") {
      processedData.schoolId = new mongoose.Types.ObjectId(
        studentData.schoolId
      );
    }
    if (studentData.userId && typeof studentData.userId === "string") {
      processedData.userId = new mongoose.Types.ObjectId(studentData.userId);
    }
    if (studentData.classId && typeof studentData.classId === "string") {
      processedData.classId = new mongoose.Types.ObjectId(studentData.classId);
    }
    if (studentData.parentId && typeof studentData.parentId === "string") {
      processedData.parentId = new mongoose.Types.ObjectId(
        studentData.parentId
      );
    }

    // If class is changing, generate new roll number
    const newClassId = studentData.classId;
    if (newClassId && newClassId !== oldClassId) {
      const newRollNo = await this.generateRollNumber(newClassId);
      processedData.rollNo = newRollNo;
    }

    const student = await storage.updateStudent(id, processedData);

    // If class changed, reorder roll numbers in both old and new classes
    if (newClassId && newClassId !== oldClassId) {
      if (oldClassId) {
        await this.reorderRollNumbers(oldClassId);
      }
      await this.reorderRollNumbers(newClassId);
    }

    return student ? this.transformStudentToFrontend(student) : null;
  }

  // Update student status
  static async updateStudentStatus(id: string, status: "Active" | "Inactive") {
    const student = await storage.updateStudent(id, { status });
    return student ? this.transformStudentToFrontend(student) : null;
  }

  // Delete student and reorder roll numbers
  static async deleteStudent(id: string) {
    // Get student details before deletion
    const student = await storage.getStudent(id);
    if (!student) {
      return false;
    }

    const classId = student.classId?.toString();
    const userId = student.userId?.toString();

    // Delete the student
    const studentDeleted = await storage.deleteStudent(id);

    if (studentDeleted) {
      // Also delete the corresponding user record
      if (userId) {
        try {
          await storage.deleteUser(userId);
        } catch (error) {
          console.error(`Error deleting user ${userId} for student ${id}:`, error);
          // Continue with roll number reordering even if user deletion fails
        }
      }

      // Reorder roll numbers for remaining students in the same class
      if (classId) {
        await this.reorderRollNumbers(classId);
      }
    }

    return studentDeleted;
  }

  // Reorder roll numbers for all students in a class
  static async reorderRollNumbers(classId: string) {
    try {
      // Get class information
      const classInfo = await storage.getClass(classId);
      if (!classInfo) return;

      const grade = classInfo.grade;
      const section = classInfo.section.toUpperCase();
      const sectionNumber = section.charCodeAt(0) - "A".charCodeAt(0) + 1;

      // Get all students in the class ordered by roll number
      const students = await storage.getStudentsByClass(classId);

      // Update roll numbers sequentially
      for (let i = 0; i < students.length; i++) {
        const studentNumber = (i + 1).toString().padStart(2, "0");
        const newRollNo = `${grade}${sectionNumber}${studentNumber}`;

        if (students[i].rollNo !== newRollNo) {
          await storage.updateStudent((students[i]._id as any).toString(), {
            rollNo: newRollNo,
          });
        }
      }
    } catch (error) {
      console.error("Error reordering roll numbers:", error);
    }
  }
}
