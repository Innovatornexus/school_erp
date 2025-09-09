import { storage } from "../mongodb-storage";
import type { ISchoolAdmin, InsertSchoolAdmin } from "../../shared/mongodb-schemas";

export class SchoolAdminService {
  // Transform MongoDB school admin to frontend format
  static transformSchoolAdminToFrontend(admin: ISchoolAdmin) {
    const adminObj = admin.toObject();
    return {
      ...adminObj,
      id: admin._id.toString(),
      userId: admin.userId.toString(),
      schoolId: admin.schoolId.toString(),
    };
  }

  // Create a new school admin
  static async createSchoolAdmin(adminData: InsertSchoolAdmin) {
    const admin = await storage.createSchoolAdmin(adminData);
    return this.transformSchoolAdminToFrontend(admin);
  }

  // Get school admin by user ID
  static async getSchoolAdminByUserId(userId: string) {
    const admin = await storage.getSchoolAdminByUserId(userId);
    return admin ? this.transformSchoolAdminToFrontend(admin) : null;
  }

  // Get school admins by school
  static async getSchoolAdminsBySchool(schoolId: string) {
    const admins = await storage.getSchoolAdminsBySchool(schoolId);
    return admins.map(admin => this.transformSchoolAdminToFrontend(admin));
  }
}