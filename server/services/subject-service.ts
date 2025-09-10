import { storage } from "../mongodb-storage";
import type { ISubject, InsertSubject } from "../../shared/mongodb-schemas";

export class SubjectService {
  // Transform MongoDB subject to frontend format
  static transformSubjectToFrontend(subject: ISubject) {
    const subjectObj = subject.toObject();
    return {
      ...subjectObj,
      id: subject.id.toString(),
      schoolId: subject.schoolId.toString(),
    };
  }

  // Create a new subject
  static async createSubject(subjectData: InsertSubject) {
    const subject = await storage.createSubject(subjectData);
    return this.transformSubjectToFrontend(subject);
  }

  // Get subject by ID
  static async getSubject(id: string) {
    const subject = await storage.getSubject(id);
    return subject ? this.transformSubjectToFrontend(subject) : null;
  }

  // Get subjects by school
  static async getSubjectsBySchool(schoolId: string) {
    const subjects = await storage.getSubjectsBySchool(schoolId);
    return subjects.map((subject) => this.transformSubjectToFrontend(subject));
  }

  // Update subject
  static async updateSubject(id: string, subjectData: Partial<ISubject>) {
    const subject = await storage.updateSubject(id, subjectData);
    return subject ? this.transformSubjectToFrontend(subject) : null;
  }

  // Delete subject
  static async deleteSubject(id: string) {
    return await storage.deleteSubject(id);
  }
}
