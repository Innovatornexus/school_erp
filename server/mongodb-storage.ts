import mongoose from 'mongoose';
import {
  User, School, SchoolAdmin, Teacher, Subject, Class, Student,
  IUser, ISchool, ISchoolAdmin, ITeacher, ISubject, IClass, IStudent,
  InsertUser, InsertSchool, InsertSchoolAdmin, InsertTeacher, InsertSubject, InsertClass, InsertStudent
} from "../shared/mongodb-schemas";

export interface IStorage {
  // User operations
  createUser(userData: Omit<InsertUser, 'schoolId' | 'classId'> & { schoolId?: string; classId?: string }): Promise<IUser>;
  getUserByEmail(email: string): Promise<IUser | null>;
  getUserById(id: string): Promise<IUser | null>;
  updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null>;
  deleteUser(id: string): Promise<boolean>;

  // School operations
  createSchool(schoolData: InsertSchool): Promise<ISchool>;
  getSchool(id: string): Promise<ISchool | null>;
  getSchools(): Promise<ISchool[]>;
  updateSchool(id: string, schoolData: Partial<ISchool>): Promise<ISchool | null>;

  // School Admin operations
  createSchoolAdmin(adminData: InsertSchoolAdmin): Promise<ISchoolAdmin>;
  getSchoolAdminByUserId(userId: string): Promise<ISchoolAdmin | null>;
  getSchoolAdminsBySchool(schoolId: string): Promise<ISchoolAdmin[]>;

  // Teacher operations
  createTeacher(teacherData: InsertTeacher): Promise<ITeacher>;
  getTeacher(id: string): Promise<ITeacher | null>;
  getTeacherByUserId(userId: string): Promise<ITeacher | null>;
  getTeachersBySchool(schoolId: string): Promise<ITeacher[]>;
  updateTeacher(id: string, teacherData: Partial<ITeacher>): Promise<ITeacher | null>;
  deleteTeacher(id: string): Promise<boolean>;

  // Class operations
  createClass(classData: InsertClass): Promise<IClass>;
  getClass(id: string): Promise<IClass | null>;
  getClassesBySchool(schoolId: string): Promise<IClass[]>;
  updateClass(id: string, classData: Partial<IClass>): Promise<IClass | null>;
  deleteClass(id: string): Promise<boolean>;

  // Subject operations
  createSubject(subjectData: InsertSubject): Promise<ISubject>;
  getSubject(id: string): Promise<ISubject | null>;
  getSubjectsBySchool(schoolId: string): Promise<ISubject[]>;
  updateSubject(id: string, subjectData: Partial<ISubject>): Promise<ISubject | null>;
  deleteSubject(id: string): Promise<boolean>;

  // Student operations
  createStudent(studentData: InsertStudent): Promise<IStudent>;
  getStudent(id: string): Promise<IStudent | null>;
  getStudentsBySchool(schoolId: string): Promise<IStudent[]>;
  getStudentsByClass(classId: string): Promise<IStudent[]>;
  getStudentCountByClass(classId: string): Promise<number>;
  updateStudent(id: string, studentData: Partial<IStudent>): Promise<IStudent | null>;
  deleteStudent(id: string): Promise<boolean>;
}

export class MongoDBStorage implements IStorage {
  
  // User operations
  async createUser(userData: Omit<InsertUser, 'schoolId' | 'classId'> & { schoolId?: string; classId?: string }): Promise<IUser> {
    console.log('MongoDBStorage.createUser called with:', { ...userData, password: '[HIDDEN]' });
    const user = new User({
      ...userData,
      schoolId: userData.schoolId ? new mongoose.Types.ObjectId(userData.schoolId) : undefined,
      classId: userData.classId ? new mongoose.Types.ObjectId(userData.classId) : undefined,
    });
    console.log('About to save user to MongoDB...');
    const savedUser = await user.save();
    console.log('User saved to MongoDB:', savedUser);
    return savedUser;
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email }).exec();
  }

  async getUserById(id: string): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await User.findById(id).exec();
  }

  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await User.findByIdAndUpdate(id, userData, { new: true }).exec();
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }
    const result = await User.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // School operations
  async createSchool(schoolData: InsertSchool): Promise<ISchool> {
    const school = new School(schoolData);
    return await school.save();
  }

  async getSchool(id: string): Promise<ISchool | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await School.findById(id).exec();
  }

  async getSchools(): Promise<ISchool[]> {
    return await School.find().sort({ createdAt: 1 }).exec();
  }

  async updateSchool(id: string, schoolData: Partial<ISchool>): Promise<ISchool | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await School.findByIdAndUpdate(id, schoolData, { new: true }).exec();
  }

  // School Admin operations
  async createSchoolAdmin(adminData: InsertSchoolAdmin): Promise<ISchoolAdmin> {
    const admin = new SchoolAdmin({
      ...adminData,
      userId: new mongoose.Types.ObjectId(adminData.userId),
      schoolId: new mongoose.Types.ObjectId(adminData.schoolId),
    });
    return await admin.save();
  }

  async getSchoolAdminByUserId(userId: string): Promise<ISchoolAdmin | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }
    return await SchoolAdmin.findOne({ userId: new mongoose.Types.ObjectId(userId) }).exec();
  }

  async getSchoolAdminsBySchool(schoolId: string): Promise<ISchoolAdmin[]> {
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return [];
    }
    return await SchoolAdmin.find({ schoolId: new mongoose.Types.ObjectId(schoolId) }).exec();
  }

  // Teacher operations
  async createTeacher(teacherData: InsertTeacher): Promise<ITeacher> {
    const teacher = new Teacher({
      ...teacherData,
      userId: new mongoose.Types.ObjectId(teacherData.userId),
      schoolId: new mongoose.Types.ObjectId(teacherData.schoolId),
    });
    return await teacher.save();
  }

  async getTeacher(id: string): Promise<ITeacher | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await Teacher.findById(id).exec();
  }

  async getTeacherByUserId(userId: string): Promise<ITeacher | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }
    return await Teacher.findOne({ userId: new mongoose.Types.ObjectId(userId) }).exec();
  }

  async getTeachersBySchool(schoolId: string): Promise<ITeacher[]> {
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return [];
    }
    return await Teacher.find({ schoolId: new mongoose.Types.ObjectId(schoolId) }).exec();
  }

  async updateTeacher(id: string, teacherData: Partial<ITeacher>): Promise<ITeacher | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await Teacher.findByIdAndUpdate(id, teacherData, { new: true }).exec();
  }

  async deleteTeacher(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }
    const result = await Teacher.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Class operations
  async createClass(classData: InsertClass): Promise<IClass> {
    const classObj = new Class({
      ...classData,
      schoolId: new mongoose.Types.ObjectId(classData.schoolId),
      classTeacherId: classData.classTeacherId ? new mongoose.Types.ObjectId(classData.classTeacherId) : undefined,
    });
    return await classObj.save();
  }

  async getClass(id: string): Promise<IClass | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await Class.findById(id).exec();
  }

  async getClassesBySchool(schoolId: string): Promise<IClass[]> {
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return [];
    }
    return await Class.find({ schoolId: new mongoose.Types.ObjectId(schoolId) }).exec();
  }

  async updateClass(id: string, classData: Partial<IClass>): Promise<IClass | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await Class.findByIdAndUpdate(id, classData, { new: true }).exec();
  }

  async deleteClass(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }
    const result = await Class.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Subject operations
  async createSubject(subjectData: InsertSubject): Promise<ISubject> {
    const subject = new Subject({
      ...subjectData,
      schoolId: new mongoose.Types.ObjectId(subjectData.schoolId),
    });
    return await subject.save();
  }

  async getSubject(id: string): Promise<ISubject | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await Subject.findById(id).exec();
  }

  async getSubjectsBySchool(schoolId: string): Promise<ISubject[]> {
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return [];
    }
    return await Subject.find({ schoolId: new mongoose.Types.ObjectId(schoolId) }).exec();
  }

  async updateSubject(id: string, subjectData: Partial<ISubject>): Promise<ISubject | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await Subject.findByIdAndUpdate(id, subjectData, { new: true }).exec();
  }

  async deleteSubject(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }
    const result = await Subject.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Student operations
  async createStudent(studentData: InsertStudent): Promise<IStudent> {
    const student = new Student({
      ...studentData,
      userId: new mongoose.Types.ObjectId(studentData.userId),
      schoolId: new mongoose.Types.ObjectId(studentData.schoolId),
      classId: studentData.classId ? new mongoose.Types.ObjectId(studentData.classId) : undefined,
      parentId: studentData.parentId ? new mongoose.Types.ObjectId(studentData.parentId) : undefined,
    });
    return await student.save();
  }

  async getStudent(id: string): Promise<IStudent | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await Student.findById(id).exec();
  }

  async getStudentsBySchool(schoolId: string): Promise<IStudent[]> {
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return [];
    }
    return await Student.find({ schoolId: new mongoose.Types.ObjectId(schoolId) }).exec();
  }

  async getStudentsByClass(classId: string): Promise<IStudent[]> {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return [];
    }
    return await Student.find({ classId: new mongoose.Types.ObjectId(classId) }).exec();
  }

  async getStudentCountByClass(classId: string): Promise<number> {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return 0;
    }
    return await Student.countDocuments({ classId: new mongoose.Types.ObjectId(classId) }).exec();
  }

  async updateStudent(id: string, studentData: Partial<IStudent>): Promise<IStudent | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await Student.findByIdAndUpdate(id, studentData, { new: true }).exec();
  }

  async deleteStudent(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }
    const result = await Student.findByIdAndDelete(id).exec();
    return result !== null;
  }
}

// Create and export the storage instance
export const storage = new MongoDBStorage();