import { storage } from "../mongodb-storage";
import type { ISchool, InsertSchool } from "../../shared/mongodb-schemas";

export class SchoolService {
  // Transform MongoDB school to frontend format
  static transformSchoolToFrontend(school: ISchool) {
    const schoolObj = school.toObject();
    return {
      ...schoolObj,
      id: school._id.toString(),
    };
  }

  // Create a new school
  static async createSchool(schoolData: InsertSchool) {
    const school = await storage.createSchool(schoolData);
    return this.transformSchoolToFrontend(school);
  }

  // Get school by ID
  static async getSchool(id: string) {
    const school = await storage.getSchool(id);
    return school ? this.transformSchoolToFrontend(school) : null;
  }

  // Get all schools
  static async getSchools() {
    const schools = await storage.getSchools();
    return schools.map(school => this.transformSchoolToFrontend(school));
  }

  // Update school
  static async updateSchool(id: string, schoolData: Partial<ISchool>) {
    const school = await storage.updateSchool(id, schoolData);
    return school ? this.transformSchoolToFrontend(school) : null;
  }
}