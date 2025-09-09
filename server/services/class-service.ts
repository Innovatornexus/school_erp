import { storage } from "../mongodb-storage";
import type { IClass, InsertClass } from "../../shared/mongodb-schemas";

export class ClassService {
  // Transform MongoDB class to frontend format
  static transformClassToFrontend(classItem: IClass) {
    const classObj = classItem.toObject();
    return {
      ...classObj,
      id: classItem._id.toString(),
      schoolId: classItem.schoolId.toString(),
      classTeacherId: classItem.classTeacherId ? classItem.classTeacherId.toString() : null,
    };
  }

  // Create a new class
  static async createClass(classData: InsertClass) {
    const classItem = await storage.createClass(classData);
    return this.transformClassToFrontend(classItem);
  }

  // Get class by ID
  static async getClass(id: string) {
    const classItem = await storage.getClass(id);
    return classItem ? this.transformClassToFrontend(classItem) : null;
  }

  // Get classes by school
  static async getClassesBySchool(schoolId: string) {
    const classes = await storage.getClassesBySchool(schoolId);
    return classes.map(classItem => this.transformClassToFrontend(classItem));
  }

  // Update class
  static async updateClass(id: string, classData: Partial<IClass>) {
    const classItem = await storage.updateClass(id, classData);
    return classItem ? this.transformClassToFrontend(classItem) : null;
  }

  // Delete class
  static async deleteClass(id: string) {
    return await storage.deleteClass(id);
  }
}