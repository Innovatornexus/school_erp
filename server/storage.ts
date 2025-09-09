import { eq, and, desc, asc, inArray, gte, lte, sql } from "drizzle-orm";
import { db } from "./database";
import { 
  users, schools, schoolAdmins, teachers, students, classes, subjects, 
  classSubjects, studentAttendance, teacherAttendance, holidays, exams, 
  examSubjects, marks, feeStructures, feePayments, bills, messages, 
  classMessages, classLogs, homework, homeworkSubmissions, timetables, 
  lessonPlans, materials, tests
} from "../shared/schema";
import session from 'express-session';
import MemoryStore from 'memorystore';

// Create memory store for sessions
const SessionStore = MemoryStore(session);

export class DatabaseStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new SessionStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async getUserByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async getUserByUsername(username: string) {
    return this.getUserByEmail(username);
  }

  async createUser(userData: {
    email: string;
    password: string;
    role: string;
    name: string;
    school_id?: number;
    class_id?: number;
  }) {
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error("User with this email already exists.");
    }

    const result = await db.insert(users).values({
      email: userData.email,
      password: userData.password,
      role: userData.role,
      name: userData.name,
      school_id: userData.school_id,
      class_id: userData.class_id,
    }).returning();

    return result[0];
  }

  async updateUser(id: number, data: Partial<typeof users.$inferInsert>) {
    const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0] || null;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // School operations
  async getSchool(id: number) {
    const result = await db.select().from(schools).where(eq(schools.id, id)).limit(1);
    return result[0] || null;
  }

  async getSchoolByEmail(contactEmail: string) {
    const result = await db.select().from(schools).where(eq(schools.contact_email, contactEmail)).limit(1);
    return result[0] || null;
  }

  async getSchools() {
    return await db.select().from(schools).orderBy(asc(schools.created_at));
  }

  async createSchool(schoolData: typeof schools.$inferInsert) {
    const result = await db.insert(schools).values(schoolData).returning();
    return result[0];
  }

  async updateSchool(id: number, data: Partial<typeof schools.$inferInsert>) {
    const result = await db.update(schools).set(data).where(eq(schools.id, id)).returning();
    return result[0] || null;
  }

  async deleteSchool(id: number): Promise<boolean> {
    const result = await db.delete(schools).where(eq(schools.id, id)).returning();
    return result.length > 0;
  }

  // School Admin operations
  async getSchoolAdminsBySchoolId(schoolId: number) {
    return await db.select().from(schoolAdmins).where(eq(schoolAdmins.school_id, schoolId));
  }

  async createSchoolAdmin(data: typeof schoolAdmins.$inferInsert) {
    const result = await db.insert(schoolAdmins).values(data).returning();
    return result[0];
  }

  async updateSchoolAdmin(id: number, data: Partial<typeof schoolAdmins.$inferInsert>) {
    const result = await db.update(schoolAdmins).set(data).where(eq(schoolAdmins.id, id)).returning();
    return result[0] || null;
  }

  async deleteSchoolAdmin(id: number): Promise<boolean> {
    const result = await db.delete(schoolAdmins).where(eq(schoolAdmins.id, id)).returning();
    return result.length > 0;
  }

  async getSchoolAdminByUserId(userId: number) {
    const result = await db.select().from(schoolAdmins).where(eq(schoolAdmins.user_id, userId)).limit(1);
    return result[0] || null;
  }

  // Teacher operations
  async getTeachersBySchoolId(schoolId: number) {
    return await db.select().from(teachers).where(eq(teachers.school_id, schoolId));
  }

  async getTeacherByUserId(userId: number) {
    const result = await db.select().from(teachers).where(eq(teachers.user_id, userId)).limit(1);
    return result[0] || null;
  }

  async getTeacherByTeacherEmail(email: string) {
    const result = await db.select().from(teachers).where(eq(teachers.email, email)).limit(1);
    return result[0] || null;
  }

  async createTeacher(data: typeof teachers.$inferInsert) {
    const result = await db.insert(teachers).values(data).returning();
    return result[0];
  }

  async updateTeacher(id: number, data: Partial<typeof teachers.$inferInsert>) {
    const result = await db.update(teachers).set(data).where(eq(teachers.id, id)).returning();
    return result[0] || null;
  }

  async deleteTeacher(id: number): Promise<boolean> {
    const result = await db.delete(teachers).where(eq(teachers.id, id)).returning();
    return result.length > 0;
  }

  // Student operations
  async getStudentsBySchoolId(schoolId: number) {
    return await db.select().from(students).where(eq(students.school_id, schoolId));
  }

  async getStudentsByClassId(classId: number) {
    return await db.select().from(students).where(eq(students.class_id, classId));
  }

  async getStudentByUserId(userId: number) {
    const result = await db.select().from(students).where(eq(students.user_id, userId)).limit(1);
    return result[0] || null;
  }

  async createStudent(data: typeof students.$inferInsert) {
    const result = await db.insert(students).values(data).returning();
    return result[0];
  }

  async updateStudent(id: number, data: Partial<typeof students.$inferInsert>) {
    const result = await db.update(students).set(data).where(eq(students.id, id)).returning();
    return result[0] || null;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id)).returning();
    return result.length > 0;
  }

  // Class operations
  async getClassesBySchoolId(schoolId: number) {
    return await db.select().from(classes).where(eq(classes.school_id, schoolId));
  }

  async getClassesByTeacherId(teacherId: number) {
    const result = await db.select({
      class: classes
    })
    .from(classes)
    .where(eq(classes.class_teacher_id, teacherId));
    
    return result.map(r => r.class);
  }

  async getAllClassesByTeacherId(teacherId: number) {
    return this.getClassesByTeacherId(teacherId);
  }

  async createClass(data: typeof classes.$inferInsert) {
    const result = await db.insert(classes).values(data).returning();
    return result[0];
  }

  async updateClass(id: number, data: Partial<typeof classes.$inferInsert>) {
    const result = await db.update(classes).set(data).where(eq(classes.id, id)).returning();
    return result[0] || null;
  }

  async deleteClass(id: number): Promise<boolean> {
    const result = await db.delete(classes).where(eq(classes.id, id)).returning();
    return result.length > 0;
  }

  // Subject operations
  async getSubjectsBySchoolId(schoolId: number) {
    return await db.select().from(subjects).where(eq(subjects.school_id, schoolId));
  }

  async createSubject(data: typeof subjects.$inferInsert) {
    const result = await db.insert(subjects).values(data).returning();
    return result[0];
  }

  async updateSubject(id: number, data: Partial<typeof subjects.$inferInsert>) {
    const result = await db.update(subjects).set(data).where(eq(subjects.id, id)).returning();
    return result[0] || null;
  }

  async deleteSubject(id: number): Promise<boolean> {
    const result = await db.delete(subjects).where(eq(subjects.id, id)).returning();
    return result.length > 0;
  }

  // Class Subject operations
  async getClassSubjectsByClassId(classId: number) {
    return await db.select().from(classSubjects).where(eq(classSubjects.class_id, classId));
  }

  async getClassSubjectsByTeacherId(teacherId: number) {
    return await db.select().from(classSubjects).where(eq(classSubjects.teacher_id, teacherId));
  }

  async createClassSubject(data: typeof classSubjects.$inferInsert) {
    const result = await db.insert(classSubjects).values(data).returning();
    return result[0];
  }

  async updateClassSubject(id: number, data: Partial<typeof classSubjects.$inferInsert>) {
    const result = await db.update(classSubjects).set(data).where(eq(classSubjects.id, id)).returning();
    return result[0] || null;
  }

  // Attendance operations
  async getStudentAttendanceByClassAndDate(classId: number, date: string) {
    return await db.select().from(studentAttendance)
      .where(and(eq(studentAttendance.class_id, classId), eq(studentAttendance.date, date)));
  }

  async getStudentAttendanceByStudentId(studentId: number) {
    return await db.select().from(studentAttendance)
      .where(eq(studentAttendance.student_id, studentId))
      .orderBy(desc(studentAttendance.date));
  }

  async getStudentAttendanceByClassId(classId: number) {
    return await db.select().from(studentAttendance)
      .where(eq(studentAttendance.class_id, classId))
      .orderBy(desc(studentAttendance.date));
  }

  async getStudentAttendanceBySchoolId(schoolId: number) {
    return await db.select().from(studentAttendance)
      .where(eq(studentAttendance.school_id, schoolId))
      .orderBy(desc(studentAttendance.date));
  }

  async getStudentAttendanceByDateRange(schoolId: number, startDate: string, endDate: string) {
    return await db.select().from(studentAttendance)
      .where(and(
        eq(studentAttendance.school_id, schoolId),
        gte(studentAttendance.date, startDate),
        lte(studentAttendance.date, endDate)
      ))
      .orderBy(desc(studentAttendance.date));
  }

  async createStudentAttendance(data: typeof studentAttendance.$inferInsert) {
    const result = await db.insert(studentAttendance).values(data).returning();
    return result[0];
  }

  async createStudentAttendances(attendanceRecords: typeof studentAttendance.$inferInsert[]) {
    const result = await db.insert(studentAttendance).values(attendanceRecords).returning();
    return result;
  }

  async updateStudentAttendances(attendanceRecords: Array<{ id: number; status: string }>) {
    const results = [];
    for (const record of attendanceRecords) {
      const result = await db.update(studentAttendance)
        .set({ status: record.status })
        .where(eq(studentAttendance.id, record.id))
        .returning();
      if (result[0]) results.push(result[0]);
    }
    return results;
  }

  // Teacher Attendance operations
  async getTeacherAttendanceBySchoolId(schoolId: number) {
    return await db.select().from(teacherAttendance)
      .where(eq(teacherAttendance.school_id, schoolId))
      .orderBy(desc(teacherAttendance.date));
  }

  async getTeacherAttendanceByDateRange(schoolId: number, startDate: string, endDate: string) {
    return await db.select().from(teacherAttendance)
      .where(and(
        eq(teacherAttendance.school_id, schoolId),
        gte(teacherAttendance.date, startDate),
        lte(teacherAttendance.date, endDate)
      ))
      .orderBy(desc(teacherAttendance.date));
  }

  async createTeacherAttendances(attendanceRecords: typeof teacherAttendance.$inferInsert[]) {
    const result = await db.insert(teacherAttendance).values(attendanceRecords).returning();
    return result;
  }

  async updateTeacherAttendances(attendanceRecords: Array<{ id: number; status: string }>) {
    const results = [];
    for (const record of attendanceRecords) {
      const result = await db.update(teacherAttendance)
        .set({ status: record.status })
        .where(eq(teacherAttendance.id, record.id))
        .returning();
      if (result[0]) results.push(result[0]);
    }
    return results;
  }

  // Teachers by Class operations
  async getTeachersByClassId(classId: number) {
    const result = await db.select({
      teacher: teachers
    })
    .from(classSubjects)
    .innerJoin(teachers, eq(classSubjects.teacher_id, teachers.id))
    .where(eq(classSubjects.class_id, classId));
    
    return result.map(r => r.teacher);
  }

  // Holiday operations
  async createOrUpdateHolidays(schoolId: number, holidayData: any) {
    // This would need custom logic based on your holiday requirements
    return { success: true };
  }

  // Report generation
  async generateAttendanceReport(schoolId: number, params: any) {
    // Custom report generation logic would go here
    return { report: "attendance report data" };
  }

  // Exam operations
  async getExamsBySchoolId(schoolId: number) {
    return await db.select().from(exams).where(eq(exams.school_id, schoolId));
  }

  async getExamsByClassId(classId: number) {
    return await db.select().from(exams).where(eq(exams.class_id, classId));
  }

  async getExam(id: number) {
    const result = await db.select().from(exams).where(eq(exams.id, id)).limit(1);
    return result[0] || null;
  }

  async createExam(data: typeof exams.$inferInsert) {
    const result = await db.insert(exams).values(data).returning();
    return result[0];
  }

  async updateExam(id: number, data: Partial<typeof exams.$inferInsert>) {
    const result = await db.update(exams).set(data).where(eq(exams.id, id)).returning();
    return result[0] || null;
  }

  async deleteExam(id: number): Promise<boolean> {
    const result = await db.delete(exams).where(eq(exams.id, id)).returning();
    return result.length > 0;
  }

  async getExamSubjects(examId: number) {
    return await db.select().from(examSubjects).where(eq(examSubjects.exam_id, examId));
  }

  async updateExamMarks(marks: any[]) {
    // Custom logic for updating exam marks
    return { success: true };
  }

  async getExamResults(examId: number) {
    return await db.select().from(marks).where(eq(marks.exam_id, examId));
  }

  // Fee operations
  async getFeeStructuresByClassId(classId: number) {
    return await db.select().from(feeStructures).where(eq(feeStructures.class_id, classId));
  }

  async createFeeStructure(data: typeof feeStructures.$inferInsert) {
    const result = await db.insert(feeStructures).values(data).returning();
    return result[0];
  }

  async createFeePayment(data: typeof feePayments.$inferInsert) {
    const result = await db.insert(feePayments).values(data).returning();
    return result[0];
  }

  // Message operations
  async getMessagesBySchoolId(schoolId: number) {
    return await db.select().from(messages)
      .where(eq(messages.school_id, schoolId))
      .orderBy(desc(messages.created_at));
  }

  async getMessagesByTeacherId(teacherId: number) {
    return await db.select().from(messages)
      .where(eq(messages.sender_id, teacherId))
      .orderBy(desc(messages.created_at));
  }

  async getMessagesWithUserInfo(schoolId: number) {
    // Would need join with users table
    return await db.select().from(messages)
      .where(eq(messages.school_id, schoolId))
      .orderBy(desc(messages.created_at));
  }

  async getMessagesForUser(userId: number) {
    return await db.select().from(messages)
      .where(eq(messages.sender_id, userId))
      .orderBy(desc(messages.created_at));
  }

  async getMessagesSentByUser(userId: number) {
    return this.getMessagesForUser(userId);
  }

  async getMessagesByClass(classId: number) {
    return await db.select().from(classMessages)
      .where(eq(classMessages.class_id, classId))
      .orderBy(desc(classMessages.created_at));
  }

  async markMessageAsRead(messageId: number, userId: number) {
    // Custom logic for marking messages as read
    return { success: true };
  }

  // Material operations
  async getMaterials(params: any) {
    return await db.select().from(materials).orderBy(desc(materials.created_at));
  }

  async getMaterial(id: number) {
    const result = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
    return result[0] || null;
  }

  async updateMaterial(id: number, data: Partial<typeof materials.$inferInsert>) {
    const result = await db.update(materials).set(data).where(eq(materials.id, id)).returning();
    return result[0] || null;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const result = await db.delete(materials).where(eq(materials.id, id)).returning();
    return result.length > 0;
  }

  // Test operations
  async getTests(params: any) {
    return await db.select().from(tests).orderBy(desc(tests.created_at));
  }

  async getTestsByClassId(classId: number) {
    return await db.select().from(tests).where(eq(tests.class_id, classId));
  }

  async getTest(id: number) {
    const result = await db.select().from(tests).where(eq(tests.id, id)).limit(1);
    return result[0] || null;
  }

  async updateTest(id: number, data: Partial<typeof tests.$inferInsert>) {
    const result = await db.update(tests).set(data).where(eq(tests.id, id)).returning();
    return result[0] || null;
  }

  async deleteTest(id: number): Promise<boolean> {
    const result = await db.delete(tests).where(eq(tests.id, id)).returning();
    return result.length > 0;
  }

  // Homework operations
  async getHomeworkList(params: any) {
    return await db.select().from(homework).orderBy(desc(homework.created_at));
  }

  async getHomework(id: number) {
    const result = await db.select().from(homework).where(eq(homework.id, id)).limit(1);
    return result[0] || null;
  }

  async updateHomework(id: number, data: Partial<typeof homework.$inferInsert>) {
    const result = await db.update(homework).set(data).where(eq(homework.id, id)).returning();
    return result[0] || null;
  }

  async deleteHomework(id: number): Promise<boolean> {
    const result = await db.delete(homework).where(eq(homework.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();