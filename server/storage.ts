import mongoose from 'mongoose';
import {
  User, School, SchoolAdmin, Teacher, Student, Class, Subject, 
  ClassSubject, TeacherSubject, StudentAttendance, TeacherAttendance,
  Exam, Message, Homework, Material, Test,
  IUser, ISchool, ISchoolAdmin, ITeacher, IStudent, IClass, ISubject,
  IClassSubject, ITeacherSubject, IStudentAttendance, ITeacherAttendance,
  IExam, IMessage, IHomework, IMaterial, ITest,
  InsertUser, InsertSchool, InsertSchoolAdmin, InsertTeacher, InsertStudent,
  InsertClass, InsertSubject, InsertClassSubject, InsertTeacherSubject
} from "../shared/schema";

export interface IStorage {
  // User operations
  createUser(userData: Omit<InsertUser, 'school_id' | 'class_id'> & { school_id?: string; class_id?: string }): Promise<IUser>;
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

  // Student operations
  createStudent(studentData: InsertStudent): Promise<IStudent>;
  getStudent(id: string): Promise<IStudent | null>;
  getStudentByUserId(userId: string): Promise<IStudent | null>;
  getStudentsBySchool(schoolId: string): Promise<IStudent[]>;
  getStudentsByClass(classId: string): Promise<IStudent[]>;
  updateStudent(id: string, studentData: Partial<IStudent>): Promise<IStudent | null>;
  deleteStudent(id: string): Promise<boolean>;

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

  // Class-Subject operations
  createClassSubject(classSubjectData: InsertClassSubject): Promise<IClassSubject>;
  getClassSubjectsByClass(classId: string): Promise<IClassSubject[]>;
  getClassSubjectsBySubject(subjectId: string): Promise<IClassSubject[]>;
  deleteClassSubject(id: string): Promise<boolean>;

  // Teacher-Subject operations
  createTeacherSubject(teacherSubjectData: InsertTeacherSubject): Promise<ITeacherSubject>;
  getTeacherSubjectsByTeacher(teacherId: string): Promise<ITeacherSubject[]>;
  getTeacherSubjectsBySubject(subjectId: string): Promise<ITeacherSubject[]>;
  deleteTeacherSubject(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  
  // User operations
  async createUser(userData: Omit<InsertUser, 'school_id' | 'class_id'> & { school_id?: string; class_id?: string }): Promise<IUser> {
    const user = new User({
      ...userData,
      school_id: userData.school_id ? new mongoose.Types.ObjectId(userData.school_id) : undefined,
      class_id: userData.class_id ? new mongoose.Types.ObjectId(userData.class_id) : undefined,
    });
    return await user.save();
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email }).exec();
  }

  async getUserById(id: string): Promise<IUser | null> {
    return await User.findById(id).exec();
  }

  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, userData, { new: true }).exec();
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // School operations
  async createSchool(schoolData: InsertSchool): Promise<ISchool> {
    const school = new School(schoolData);
    return await school.save();
  }

  async getSchool(id: string): Promise<ISchool | null> {
    return await School.findById(id).exec();
  }

  async getSchools(): Promise<ISchool[]> {
    return await School.find().exec();
  }

  async updateSchool(id: string, schoolData: Partial<ISchool>): Promise<ISchool | null> {
    return await School.findByIdAndUpdate(id, schoolData, { new: true }).exec();
  }

  // School Admin operations
  async createSchoolAdmin(adminData: InsertSchoolAdmin): Promise<ISchoolAdmin> {
    const admin = new SchoolAdmin({
      ...adminData,
      user_id: new mongoose.Types.ObjectId(adminData.user_id),
      school_id: new mongoose.Types.ObjectId(adminData.school_id),
    });
    return await admin.save();
  }

  async getSchoolAdminByUserId(userId: string): Promise<ISchoolAdmin | null> {
    return await SchoolAdmin.findOne({ user_id: new mongoose.Types.ObjectId(userId) }).exec();
  }

  async getSchoolAdminsBySchool(schoolId: string): Promise<ISchoolAdmin[]> {
    return await SchoolAdmin.find({ school_id: new mongoose.Types.ObjectId(schoolId) }).exec();
  }

  // Teacher operations
  async createTeacher(teacherData: InsertTeacher): Promise<ITeacher> {
    const teacher = new Teacher({
      ...teacherData,
      user_id: new mongoose.Types.ObjectId(teacherData.user_id),
      school_id: new mongoose.Types.ObjectId(teacherData.school_id),
    });
    return await teacher.save();
  }

  async getTeacher(id: string): Promise<ITeacher | null> {
    return await Teacher.findById(id).exec();
  }

  async getTeacherByUserId(userId: string): Promise<ITeacher | null> {
    return await Teacher.findOne({ user_id: new mongoose.Types.ObjectId(userId) }).exec();
  }

  async getTeachersBySchool(schoolId: string): Promise<ITeacher[]> {
    return await Teacher.find({ school_id: new mongoose.Types.ObjectId(schoolId) }).exec();
  }

  async updateTeacher(id: string, teacherData: Partial<ITeacher>): Promise<ITeacher | null> {
    return await Teacher.findByIdAndUpdate(id, teacherData, { new: true }).exec();
  }

  async deleteTeacher(id: string): Promise<boolean> {
    const result = await Teacher.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Student operations
  async createStudent(studentData: InsertStudent): Promise<IStudent> {
    const student = new Student({
      ...studentData,
      user_id: new mongoose.Types.ObjectId(studentData.user_id),
      school_id: new mongoose.Types.ObjectId(studentData.school_id),
      class_id: studentData.class_id ? new mongoose.Types.ObjectId(studentData.class_id) : undefined,
    });
    return await student.save();
  }

  async getStudent(id: string): Promise<IStudent | null> {
    return await Student.findById(id).exec();
  }

  async getStudentByUserId(userId: string): Promise<IStudent | null> {
    return await Student.findOne({ user_id: new mongoose.Types.ObjectId(userId) }).exec();
  }

  async getStudentsBySchool(schoolId: string): Promise<IStudent[]> {
    return await Student.find({ school_id: new mongoose.Types.ObjectId(schoolId) }).exec();
  }

  async getStudentsByClass(classId: string): Promise<IStudent[]> {
    return await Student.find({ class_id: new mongoose.Types.ObjectId(classId) }).exec();
  }

  async updateStudent(id: string, studentData: Partial<IStudent>): Promise<IStudent | null> {
    return await Student.findByIdAndUpdate(id, studentData, { new: true }).exec();
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await Student.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Class operations
  async createClass(classData: InsertClass): Promise<IClass> {
    const classObj = new Class({
      ...classData,
      school_id: new mongoose.Types.ObjectId(classData.school_id),
      class_teacher_id: classData.class_teacher_id ? new mongoose.Types.ObjectId(classData.class_teacher_id) : undefined,
    });
    return await classObj.save();
  }

  async getClass(id: string): Promise<IClass | null> {
    return await Class.findById(id).exec();
  }

  async getClassesBySchool(schoolId: string): Promise<IClass[]> {
    return await Class.find({ school_id: new mongoose.Types.ObjectId(schoolId) }).exec();
  }

  async updateClass(id: string, classData: Partial<IClass>): Promise<IClass | null> {
    return await Class.findByIdAndUpdate(id, classData, { new: true }).exec();
  }

  async deleteClass(id: string): Promise<boolean> {
    const result = await Class.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Subject operations
  async createSubject(subjectData: InsertSubject): Promise<ISubject> {
    const subject = new Subject({
      ...subjectData,
      school_id: new mongoose.Types.ObjectId(subjectData.school_id),
    });
    return await subject.save();
  }

  async getSubject(id: string): Promise<ISubject | null> {
    return await Subject.findById(id).exec();
  }

  async getSubjectsBySchool(schoolId: string): Promise<ISubject[]> {
    return await Subject.find({ school_id: new mongoose.Types.ObjectId(schoolId) }).exec();
  }

  async updateSubject(id: string, subjectData: Partial<ISubject>): Promise<ISubject | null> {
    return await Subject.findByIdAndUpdate(id, subjectData, { new: true }).exec();
  }

  async deleteSubject(id: string): Promise<boolean> {
    const result = await Subject.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Class-Subject operations
  async createClassSubject(classSubjectData: InsertClassSubject): Promise<IClassSubject> {
    const classSubject = new ClassSubject({
      ...classSubjectData,
      class_id: new mongoose.Types.ObjectId(classSubjectData.class_id),
      subject_id: new mongoose.Types.ObjectId(classSubjectData.subject_id),
      teacher_id: classSubjectData.teacher_id ? new mongoose.Types.ObjectId(classSubjectData.teacher_id) : undefined,
    });
    return await classSubject.save();
  }

  async getClassSubjectsByClass(classId: string): Promise<IClassSubject[]> {
    return await ClassSubject.find({ class_id: new mongoose.Types.ObjectId(classId) }).exec();
  }

  async getClassSubjectsBySubject(subjectId: string): Promise<IClassSubject[]> {
    return await ClassSubject.find({ subject_id: new mongoose.Types.ObjectId(subjectId) }).exec();
  }

  async deleteClassSubject(id: string): Promise<boolean> {
    const result = await ClassSubject.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Teacher-Subject operations
  async createTeacherSubject(teacherSubjectData: InsertTeacherSubject): Promise<ITeacherSubject> {
    const teacherSubject = new TeacherSubject({
      ...teacherSubjectData,
      teacher_id: new mongoose.Types.ObjectId(teacherSubjectData.teacher_id),
      subject_id: new mongoose.Types.ObjectId(teacherSubjectData.subject_id),
    });
    return await teacherSubject.save();
  }

  async getTeacherSubjectsByTeacher(teacherId: string): Promise<ITeacherSubject[]> {
    return await TeacherSubject.find({ teacher_id: new mongoose.Types.ObjectId(teacherId) }).exec();
  }

  async getTeacherSubjectsBySubject(subjectId: string): Promise<ITeacherSubject[]> {
    return await TeacherSubject.find({ subject_id: new mongoose.Types.ObjectId(subjectId) }).exec();
  }

  async deleteTeacherSubject(id: string): Promise<boolean> {
    const result = await TeacherSubject.findByIdAndDelete(id).exec();
    return result !== null;
  }
}

// Create and export the storage instance
export const storage = new DatabaseStorage();