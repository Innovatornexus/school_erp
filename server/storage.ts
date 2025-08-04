import {
  users,
  User,
  InsertUser,
  schools,
  School,
  InsertSchool,
  schoolAdmins,
  SchoolAdmin,
  InsertSchoolAdmin,
  teachers,
  Teacher,
  InsertTeacher,
  students,
  Student,
  InsertStudent,
  classes,
  Class,
  InsertClass,
  subjects,
  Subject,
  InsertSubject,
  classSubjects,
  ClassSubject,
  InsertClassSubject,
  studentAttendance,
  StudentAttendance,
  InsertStudentAttendance,
  teacherAttendance,
  TeacherAttendance,
  InsertTeacherAttendance,
  lessonPlans,
  LessonPlan,
  InsertLessonPlan,
  assignments,
  Assignment,
  InsertAssignment,
  assignmentSubmissions,
  AssignmentSubmission,
  InsertAssignmentSubmission,
  exams,
  Exam,
  InsertExam,
  examSubjects,
  ExamSubject,
  InsertExamSubject,
  marks,
  Mark,
  InsertMark,
  feeStructures,
  FeeStructure,
  InsertFeeStructure,
  feePayments,
  FeePayment,
  InsertFeePayment,
  bills,
  Bill,
  InsertBill,
  messages,
  Message,
  InsertMessage,
  classMessages,
  ClassMessage,
  InsertClassMessage,
  classLogs,
  ClassLog,
  InsertClassLog,
  timetables,
  Timetable,
  InsertTimetable,
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { pool } from "./db";
import { ClassItemWithCount } from "@/pages/type";
import { sql } from "drizzle-orm";

// Memory store for session management
const MemoryStore = createMemoryStore(session);

// PostgreSQL session store
const PostgresSessionStore = connectPg(session);

// Storage interface with CRUD operations for all entity types
export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // School operations
  getSchool(id: number): Promise<School | undefined>;
  getSchools(): Promise<School[]>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchool(
    id: number,
    data: Partial<InsertSchool>
  ): Promise<School | undefined>;
  deleteSchool(id: number): Promise<boolean>;

  // SchoolAdmin operations
  getSchoolAdmin(id: number): Promise<SchoolAdmin | undefined>;
  getSchoolAdminByUserId(userId: number): Promise<SchoolAdmin | undefined>;
  getSchoolAdminsBySchoolId(schoolId: number): Promise<SchoolAdmin[]>;
  createSchoolAdmin(schoolAdmin: InsertSchoolAdmin): Promise<SchoolAdmin>;
  updateSchoolAdmin(
    id: number,
    data: Partial<InsertSchoolAdmin>
  ): Promise<SchoolAdmin | undefined>;
  deleteSchoolAdmin(id: number): Promise<boolean>;

  // Teacher operations
  getTeacher(id: number): Promise<Teacher | undefined>;
  getTeacherByUserId(userId: number): Promise<Teacher | undefined>;
  getTeachersBySchoolId(schoolId: number): Promise<Teacher[]>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(
    id: number,
    data: Partial<InsertTeacher>
  ): Promise<Teacher | undefined>;
  deleteTeacher(id: number): Promise<boolean>;

  // Student operations
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByUserId(userId: number): Promise<Student | undefined>;
  getStudentsBySchoolId(schoolId: number): Promise<Student[]>;
  getStudentsByClassId(classId: number): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(
    id: number,
    data: Partial<InsertStudent>
  ): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;

  // Class operations
  getClass(id: number): Promise<Class | undefined>;
  getClassesBySchoolId(schoolId: number): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(
    id: number,
    data: Partial<InsertClass>
  ): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;

  // Subject operations
  getSubject(id: number): Promise<Subject | undefined>;
  getSubjectsBySchoolId(schoolId: number): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(
    id: number,
    data: Partial<InsertSubject>
  ): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<boolean>;

  // ClassSubject operations
  getClassSubject(id: number): Promise<ClassSubject | undefined>;
  getClassSubjectsByClassId(classId: number): Promise<ClassSubject[]>;
  getClassSubjectsByTeacherId(teacherId: number): Promise<ClassSubject[]>;
  createClassSubject(classSubject: InsertClassSubject): Promise<ClassSubject>;
  updateClassSubject(
    id: number,
    data: Partial<InsertClassSubject>
  ): Promise<ClassSubject | undefined>;
  deleteClassSubject(id: number): Promise<boolean>;

  // StudentAttendance operations
  getStudentAttendance(id: number): Promise<StudentAttendance | undefined>;
  getStudentAttendanceByStudentId(
    studentId: number
  ): Promise<StudentAttendance[]>;
  getStudentAttendanceByClassId(
    classId: number,
    date: Date
  ): Promise<StudentAttendance[]>;
  createStudentAttendance(
    attendance: InsertStudentAttendance
  ): Promise<StudentAttendance>;
  updateStudentAttendance(
    id: number,
    data: Partial<InsertStudentAttendance>
  ): Promise<StudentAttendance | undefined>;
  deleteStudentAttendance(id: number): Promise<boolean>;

  // TeacherAttendance operations
  getTeacherAttendance(id: number): Promise<TeacherAttendance | undefined>;
  getTeacherAttendanceByTeacherId(
    teacherId: number
  ): Promise<TeacherAttendance[]>;
  getTeacherAttendanceBySchoolId(
    schoolId: number,
    date: Date
  ): Promise<TeacherAttendance[]>;
  createTeacherAttendance(
    attendance: InsertTeacherAttendance
  ): Promise<TeacherAttendance>;
  updateTeacherAttendance(
    id: number,
    data: Partial<InsertTeacherAttendance>
  ): Promise<TeacherAttendance | undefined>;
  deleteTeacherAttendance(id: number): Promise<boolean>;

  // LessonPlan operations
  getLessonPlan(id: number): Promise<LessonPlan | undefined>;
  getLessonPlansByTeacherId(teacherId: number): Promise<LessonPlan[]>;
  getLessonPlansByClassId(classId: number): Promise<LessonPlan[]>;
  createLessonPlan(lessonPlan: InsertLessonPlan): Promise<LessonPlan>;
  updateLessonPlan(
    id: number,
    data: Partial<InsertLessonPlan>
  ): Promise<LessonPlan | undefined>;
  deleteLessonPlan(id: number): Promise<boolean>;

  // Assignment operations
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentsByTeacherId(teacherId: number): Promise<Assignment[]>;
  getAssignmentsByClassId(classId: number): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(
    id: number,
    data: Partial<InsertAssignment>
  ): Promise<Assignment | undefined>;
  deleteAssignment(id: number): Promise<boolean>;

  // AssignmentSubmission operations
  getAssignmentSubmission(
    id: number
  ): Promise<AssignmentSubmission | undefined>;
  getAssignmentSubmissionsByAssignmentId(
    assignmentId: number
  ): Promise<AssignmentSubmission[]>;
  getAssignmentSubmissionsByStudentId(
    studentId: number
  ): Promise<AssignmentSubmission[]>;
  createAssignmentSubmission(
    submission: InsertAssignmentSubmission
  ): Promise<AssignmentSubmission>;
  updateAssignmentSubmission(
    id: number,
    data: Partial<InsertAssignmentSubmission>
  ): Promise<AssignmentSubmission | undefined>;
  deleteAssignmentSubmission(id: number): Promise<boolean>;

  // Exam operations
  getExam(id: number): Promise<Exam | undefined>;
  getExamsBySchoolId(schoolId: number): Promise<Exam[]>;
  getExamsByClassId(classId: number): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, data: Partial<InsertExam>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<boolean>;

  // ExamSubject operations
  getExamSubject(id: number): Promise<ExamSubject | undefined>;
  getExamSubjectsByExamId(examId: number): Promise<ExamSubject[]>;
  createExamSubject(examSubject: InsertExamSubject): Promise<ExamSubject>;
  updateExamSubject(
    id: number,
    data: Partial<InsertExamSubject>
  ): Promise<ExamSubject | undefined>;
  deleteExamSubject(id: number): Promise<boolean>;

  // Mark operations
  getMark(id: number): Promise<Mark | undefined>;
  getMarksByStudentId(studentId: number): Promise<Mark[]>;
  getMarksByExamSubjectId(examSubjectId: number): Promise<Mark[]>;
  createMark(mark: InsertMark): Promise<Mark>;
  updateMark(id: number, data: Partial<InsertMark>): Promise<Mark | undefined>;
  deleteMark(id: number): Promise<boolean>;

  // FeeStructure operations
  getFeeStructure(id: number): Promise<FeeStructure | undefined>;
  getFeeStructuresBySchoolId(schoolId: number): Promise<FeeStructure[]>;
  getFeeStructuresByClassId(classId: number): Promise<FeeStructure[]>;
  createFeeStructure(feeStructure: InsertFeeStructure): Promise<FeeStructure>;
  updateFeeStructure(
    id: number,
    data: Partial<InsertFeeStructure>
  ): Promise<FeeStructure | undefined>;
  deleteFeeStructure(id: number): Promise<boolean>;

  // FeePayment operations
  getFeePayment(id: number): Promise<FeePayment | undefined>;
  getFeePaymentsByStudentId(studentId: number): Promise<FeePayment[]>;
  createFeePayment(feePayment: InsertFeePayment): Promise<FeePayment>;
  updateFeePayment(
    id: number,
    data: Partial<InsertFeePayment>
  ): Promise<FeePayment | undefined>;
  deleteFeePayment(id: number): Promise<boolean>;

  // Bill operations
  getBill(id: number): Promise<Bill | undefined>;
  getBillsBySchoolId(schoolId: number): Promise<Bill[]>;
  createBill(bill: InsertBill): Promise<Bill>;
  updateBill(id: number, data: Partial<InsertBill>): Promise<Bill | undefined>;
  deleteBill(id: number): Promise<boolean>;

  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesBySenderId(senderId: number): Promise<Message[]>;
  getMessagesBySchoolId(schoolId: number): Promise<Message[]>;
  getMessagesByReceiverId(
    receiverId: number,
    receiverRole: string
  ): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(
    id: number,
    data: Partial<InsertMessage>
  ): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;

  // ClassMessage operations
  getClassMessage(id: number): Promise<ClassMessage | undefined>;
  getClassMessagesByClassId(classId: number): Promise<ClassMessage[]>;
  createClassMessage(classMessage: InsertClassMessage): Promise<ClassMessage>;
  updateClassMessage(
    id: number,
    data: Partial<InsertClassMessage>
  ): Promise<ClassMessage | undefined>;
  deleteClassMessage(id: number): Promise<boolean>;

  // ClassLog operations
  getClassLog(id: number): Promise<ClassLog | undefined>;
  getClassLogsByClassId(classId: number): Promise<ClassLog[]>;
  getClassLogsByTeacherId(teacherId: number): Promise<ClassLog[]>;
  createClassLog(classLog: InsertClassLog): Promise<ClassLog>;
  updateClassLog(
    id: number,
    data: Partial<InsertClassLog>
  ): Promise<ClassLog | undefined>;
  deleteClassLog(id: number): Promise<boolean>;

  // Timetable operations
  getTimetable(id: number): Promise<Timetable | undefined>;
  getTimetablesBySchoolId(schoolId: number): Promise<Timetable[]>;
  getTimetablesByClassId(classId: number): Promise<Timetable[]>;
  createTimetable(timetable: InsertTimetable): Promise<Timetable>;
  updateTimetable(
    id: number,
    data: Partial<InsertTimetable>
  ): Promise<Timetable | undefined>;
  deleteTimetable(id: number): Promise<boolean>;

  // For auth compatibility
  getUserByUsername(username: string): Promise<User | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  // Session store for authentication
  sessionStore: session.Store;

  // Maps to store all entity data in memory
  private usersMap: Map<number, User>;
  private schoolsMap: Map<number, School>;
  private schoolAdminsMap: Map<number, SchoolAdmin>;
  private teachersMap: Map<number, Teacher>;
  private parentsMap: Map<number, Parent>;
  private studentsMap: Map<number, Student>;
  private classesMap: Map<number, Class>;
  private subjectsMap: Map<number, Subject>;
  private classSubjectsMap: Map<number, ClassSubject>;
  private studentAttendanceMap: Map<number, StudentAttendance>;
  private teacherAttendanceMap: Map<number, TeacherAttendance>;
  private lessonPlansMap: Map<number, LessonPlan>;
  private assignmentsMap: Map<number, Assignment>;
  private assignmentSubmissionsMap: Map<number, AssignmentSubmission>;
  private examsMap: Map<number, Exam>;
  private examSubjectsMap: Map<number, ExamSubject>;
  private marksMap: Map<number, Mark>;
  private feeStructuresMap: Map<number, FeeStructure>;
  private feePaymentsMap: Map<number, FeePayment>;
  private billsMap: Map<number, Bill>;
  private messagesMap: Map<number, Message>;
  private classMessagesMap: Map<number, ClassMessage>;

  // Counters for generating unique IDs
  private currentIds: {
    users: number;
    schools: number;
    schoolAdmins: number;
    teachers: number;
    parents: number;
    students: number;
    classes: number;
    subjects: number;
    classSubjects: number;
    studentAttendance: number;
    teacherAttendance: number;
    lessonPlans: number;
    assignments: number;
    assignmentSubmissions: number;
    exams: number;
    examSubjects: number;
    marks: number;
    feeStructures: number;
    feePayments: number;
    bills: number;
    messages: number;
    classMessages: number;
  };

  constructor() {
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });

    // Initialize maps for all entities
    this.usersMap = new Map<number, User>();
    this.schoolsMap = new Map<number, School>();
    this.schoolAdminsMap = new Map<number, SchoolAdmin>();
    this.teachersMap = new Map<number, Teacher>();
    this.parentsMap = new Map<number, Parent>();
    this.studentsMap = new Map<number, Student>();
    this.classesMap = new Map<number, Class>();
    this.subjectsMap = new Map<number, Subject>();
    this.classSubjectsMap = new Map<number, ClassSubject>();
    this.studentAttendanceMap = new Map<number, StudentAttendance>();
    this.teacherAttendanceMap = new Map<number, TeacherAttendance>();
    this.lessonPlansMap = new Map<number, LessonPlan>();
    this.assignmentsMap = new Map<number, Assignment>();
    this.assignmentSubmissionsMap = new Map<number, AssignmentSubmission>();
    this.examsMap = new Map<number, Exam>();
    this.examSubjectsMap = new Map<number, ExamSubject>();
    this.marksMap = new Map<number, Mark>();
    this.feeStructuresMap = new Map<number, FeeStructure>();
    this.feePaymentsMap = new Map<number, FeePayment>();
    this.billsMap = new Map<number, Bill>();
    this.messagesMap = new Map<number, Message>();
    this.classMessagesMap = new Map<number, ClassMessage>();

    // Initialize ID counters for all entities
    this.currentIds = {
      users: 1,
      schools: 1,
      schoolAdmins: 1,
      teachers: 1,
      parents: 1,
      students: 1,
      classes: 1,
      subjects: 1,
      classSubjects: 1,
      studentAttendance: 1,
      teacherAttendance: 1,
      lessonPlans: 1,
      assignments: 1,
      assignmentSubmissions: 1,
      exams: 1,
      examSubjects: 1,
      marks: 1,
      feeStructures: 1,
      feePayments: 1,
      bills: 1,
      messages: 1,
      classMessages: 1,
    };
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email === email
    );
  }

  // For auth compatibility
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.getUserByEmail(username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const created_at = new Date();
    const user = { ...insertUser, id, created_at };
    this.usersMap.set(id, user);
    return user;
  }

  async updateUser(
    id: number,
    data: Partial<InsertUser>
  ): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...data };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersMap.delete(id);
  }

  // School operations
  async getSchool(id: number): Promise<School | undefined> {
    return this.schoolsMap.get(id);
  }

  async getSchools(): Promise<School[]> {
    return Array.from(this.schoolsMap.values());
  }

  async createSchool(insertSchool: InsertSchool): Promise<School> {
    const id = this.currentIds.schools++;
    const created_at = new Date();
    const school = { ...insertSchool, id, created_at };
    this.schoolsMap.set(id, school);
    return school;
  }

  async updateSchool(
    id: number,
    data: Partial<InsertSchool>
  ): Promise<School | undefined> {
    const school = await this.getSchool(id);
    if (!school) return undefined;

    const updatedSchool = { ...school, ...data };
    this.schoolsMap.set(id, updatedSchool);
    return updatedSchool;
  }

  async deleteSchool(id: number): Promise<boolean> {
    return this.schoolsMap.delete(id);
  }

  // SchoolAdmin operations
  async getSchoolAdmin(id: number): Promise<SchoolAdmin | undefined> {
    return this.schoolAdminsMap.get(id);
  }

  async getSchoolAdminByUserId(
    userId: number
  ): Promise<SchoolAdmin | undefined> {
    return Array.from(this.schoolAdminsMap.values()).find(
      (admin) => admin.user_id === userId
    );
  }

  async getSchoolAdminsBySchoolId(schoolId: number): Promise<SchoolAdmin[]> {
    return Array.from(this.schoolAdminsMap.values()).filter(
      (admin) => admin.school_id === schoolId
    );
  }

  async createSchoolAdmin(
    insertSchoolAdmin: InsertSchoolAdmin
  ): Promise<SchoolAdmin> {
    const id = this.currentIds.schoolAdmins++;
    const schoolAdmin = { ...insertSchoolAdmin, id };
    this.schoolAdminsMap.set(id, schoolAdmin);
    return schoolAdmin;
  }

  async updateSchoolAdmin(
    id: number,
    data: Partial<InsertSchoolAdmin>
  ): Promise<SchoolAdmin | undefined> {
    const schoolAdmin = await this.getSchoolAdmin(id);
    if (!schoolAdmin) return undefined;

    const updatedSchoolAdmin = { ...schoolAdmin, ...data };
    this.schoolAdminsMap.set(id, updatedSchoolAdmin);
    return updatedSchoolAdmin;
  }

  async deleteSchoolAdmin(id: number): Promise<boolean> {
    return this.schoolAdminsMap.delete(id);
  }

  // Teacher operations
  async getTeacher(id: number): Promise<Teacher | undefined> {
    return this.teachersMap.get(id);
  }

  async getTeacherByUserId(userId: number): Promise<Teacher | undefined> {
    return Array.from(this.teachersMap.values()).find(
      (teacher) => teacher.user_id === userId
    );
  }

  async getTeachersBySchoolId(schoolId: number): Promise<Teacher[]> {
    return Array.from(this.teachersMap.values()).filter(
      (teacher) => teacher.school_id === schoolId
    );
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const id = this.currentIds.teachers++;
    const teacher = { ...insertTeacher, id };
    this.teachersMap.set(id, teacher);
    return teacher;
  }

  async updateTeacher(
    id: number,
    data: Partial<InsertTeacher>
  ): Promise<Teacher | undefined> {
    const teacher = await this.getTeacher(id);
    if (!teacher) return undefined;

    const updatedTeacher = { ...teacher, ...data };
    this.teachersMap.set(id, updatedTeacher);
    return updatedTeacher;
  }

  async deleteTeacher(id: number): Promise<boolean> {
    return this.teachersMap.delete(id);
  }

  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    return this.studentsMap.get(id);
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    return Array.from(this.studentsMap.values()).find(
      (student) => student.user_id === userId
    );
  }

  async getStudentsBySchoolId(schoolId: number): Promise<Student[]> {
    return Array.from(this.studentsMap.values()).filter(
      (student) => student.school_id === schoolId
    );
  }

  async getStudentsByClassId(classId: number): Promise<Student[]> {
    return Array.from(this.studentsMap.values()).filter(
      (student) => student.class_id === classId
    );
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = this.currentIds.students++;
    const student = { ...insertStudent, id };
    this.studentsMap.set(id, student);
    return student;
  }

  async updateStudent(
    id: number,
    data: Partial<InsertStudent>
  ): Promise<Student | undefined> {
    const student = await this.getStudent(id);
    if (!student) return undefined;

    const updatedStudent = { ...student, ...data };
    this.studentsMap.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.studentsMap.delete(id);
  }

  // Class operations
  async getClass(id: number): Promise<Class | undefined> {
    return this.classesMap.get(id);
  }

  async getClassesBySchoolId(schoolId: number): Promise<Class[]> {
    return Array.from(this.classesMap.values()).filter(
      (cls) => cls.school_id === schoolId
    );
  }

  async createClass(insertClass: InsertClass): Promise<Class> {
    const id = this.currentIds.classes++;
    const classData = {
      ...insertClass,
      id,
      class_teacher_id:
        insertClass.class_teacher_id !== undefined
          ? insertClass.class_teacher_id
          : null,
      class_teacher_name:
        insertClass.class_teacher_name !== undefined
          ? insertClass.class_teacher_name
          : null,
    };
    this.classesMap.set(id, classData);
    return classData;
  }

  async updateClass(
    id: number,
    data: Partial<InsertClass>
  ): Promise<Class | undefined> {
    const classData = await this.getClass(id);
    if (!classData) return undefined;

    const updatedClass = { ...classData, ...data };
    this.classesMap.set(id, updatedClass);
    return updatedClass;
  }

  async deleteClass(id: number): Promise<boolean> {
    return this.classesMap.delete(id);
  }

  // Subject operations
  async getSubject(id: number): Promise<Subject | undefined> {
    return this.subjectsMap.get(id);
  }

  async getSubjectsBySchoolId(schoolId: number): Promise<Subject[]> {
    return Array.from(this.subjectsMap.values()).filter(
      (subject) => subject.school_id === schoolId
    );
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = this.currentIds.subjects++;
    const subject: Subject = {
      ...insertSubject,
      id,
      subject_description: insertSubject.subject_description ?? null,
    };
    this.subjectsMap.set(id, subject);
    return subject;
  }

  async updateSubject(
    id: number,
    data: Partial<InsertSubject>
  ): Promise<Subject | undefined> {
    const subject = await this.getSubject(id);
    if (!subject) return undefined;

    const updatedSubject = { ...subject, ...data };
    this.subjectsMap.set(id, updatedSubject);
    return updatedSubject;
  }

  async deleteSubject(id: number): Promise<boolean> {
    return this.subjectsMap.delete(id);
  }

  // ClassSubject operations
  async getClassSubject(id: number): Promise<ClassSubject | undefined> {
    return this.classSubjectsMap.get(id);
  }

  async getClassSubjectsByClassId(classId: number): Promise<ClassSubject[]> {
    return Array.from(this.classSubjectsMap.values()).filter(
      (cs) => cs.class_id === classId
    );
  }

  async getClassSubjectsByTeacherId(
    teacherId: number
  ): Promise<ClassSubject[]> {
    return Array.from(this.classSubjectsMap.values()).filter(
      (cs) => cs.teacher_id === teacherId
    );
  }

  async createClassSubject(
    insertClassSubject: InsertClassSubject
  ): Promise<ClassSubject> {
    const id = this.currentIds.classSubjects++;
    const classSubject = {
      ...insertClassSubject,
      id,
      teacher_id:
        insertClassSubject.teacher_id !== undefined
          ? insertClassSubject.teacher_id
          : null,
    };
    this.classSubjectsMap.set(id, classSubject);
    return classSubject;
  }

  async updateClassSubject(
    id: number,
    data: Partial<InsertClassSubject>
  ): Promise<ClassSubject | undefined> {
    const classSubject = await this.getClassSubject(id);
    if (!classSubject) return undefined;

    const updatedClassSubject = { ...classSubject, ...data };
    this.classSubjectsMap.set(id, updatedClassSubject);
    return updatedClassSubject;
  }

  async deleteClassSubject(id: number): Promise<boolean> {
    return this.classSubjectsMap.delete(id);
  }

  // StudentAttendance operations
  async getStudentAttendance(
    id: number
  ): Promise<StudentAttendance | undefined> {
    return this.studentAttendanceMap.get(id);
  }

  async getStudentAttendanceByStudentId(
    studentId: number
  ): Promise<StudentAttendance[]> {
    return Array.from(this.studentAttendanceMap.values()).filter(
      (sa) => sa.student_id === studentId
    );
  }

  async getStudentAttendanceByClassId(
    classId: number,
    date: Date
  ): Promise<StudentAttendance[]> {
    const dateStr = date.toISOString().split("T")[0]; // Convert to YYYY-MM-DD format
    return Array.from(this.studentAttendanceMap.values()).filter((sa) => {
      const saDateStr = new Date(sa.date).toISOString().split("T")[0];
      return sa.class_id === classId && saDateStr === dateStr;
    });
  }

  async createStudentAttendance(
    insertStudentAttendance: InsertStudentAttendance
  ): Promise<StudentAttendance> {
    const id = this.currentIds.studentAttendance++;
    const studentAttendance = { ...insertStudentAttendance, id };
    this.studentAttendanceMap.set(id, studentAttendance);
    return studentAttendance;
  }

  async updateStudentAttendance(
    id: number,
    data: Partial<InsertStudentAttendance>
  ): Promise<StudentAttendance | undefined> {
    const studentAttendance = await this.getStudentAttendance(id);
    if (!studentAttendance) return undefined;

    const updatedStudentAttendance = { ...studentAttendance, ...data };
    this.studentAttendanceMap.set(id, updatedStudentAttendance);
    return updatedStudentAttendance;
  }

  async deleteStudentAttendance(id: number): Promise<boolean> {
    return this.studentAttendanceMap.delete(id);
  }

  // TeacherAttendance operations
  async getTeacherAttendance(
    id: number
  ): Promise<TeacherAttendance | undefined> {
    return this.teacherAttendanceMap.get(id);
  }

  async getTeacherAttendanceByTeacherId(
    teacherId: number
  ): Promise<TeacherAttendance[]> {
    return Array.from(this.teacherAttendanceMap.values()).filter(
      (ta) => ta.teacher_id === teacherId
    );
  }

  async getTeacherAttendanceBySchoolId(
    schoolId: number,
    date: Date
  ): Promise<TeacherAttendance[]> {
    const dateStr = date.toISOString().split("T")[0]; // Convert to YYYY-MM-DD format
    return Array.from(this.teacherAttendanceMap.values()).filter((ta) => {
      const taDateStr = new Date(ta.date).toISOString().split("T")[0];
      return ta.school_id === schoolId && taDateStr === dateStr;
    });
  }

  async createTeacherAttendance(
    insertTeacherAttendance: InsertTeacherAttendance
  ): Promise<TeacherAttendance> {
    const id = this.currentIds.teacherAttendance++;
    const teacherAttendance = { ...insertTeacherAttendance, id };
    this.teacherAttendanceMap.set(id, teacherAttendance);
    return teacherAttendance;
  }

  async updateTeacherAttendance(
    id: number,
    data: Partial<InsertTeacherAttendance>
  ): Promise<TeacherAttendance | undefined> {
    const teacherAttendance = await this.getTeacherAttendance(id);
    if (!teacherAttendance) return undefined;

    const updatedTeacherAttendance = { ...teacherAttendance, ...data };
    this.teacherAttendanceMap.set(id, updatedTeacherAttendance);
    return updatedTeacherAttendance;
  }

  async deleteTeacherAttendance(id: number): Promise<boolean> {
    return this.teacherAttendanceMap.delete(id);
  }

  // LessonPlan operations
  async getLessonPlan(id: number): Promise<LessonPlan | undefined> {
    return this.lessonPlansMap.get(id);
  }

  async getLessonPlansByTeacherId(teacherId: number): Promise<LessonPlan[]> {
    return Array.from(this.lessonPlansMap.values()).filter(
      (lp) => lp.teacher_id === teacherId
    );
  }

  async getLessonPlansByClassId(classId: number): Promise<LessonPlan[]> {
    return Array.from(this.lessonPlansMap.values()).filter(
      (lp) => lp.class_id === classId
    );
  }

  async createLessonPlan(
    insertLessonPlan: InsertLessonPlan
  ): Promise<LessonPlan> {
    const id = this.currentIds.lessonPlans++;
    const lessonPlan = { ...insertLessonPlan, id };
    this.lessonPlansMap.set(id, lessonPlan);
    return lessonPlan;
  }

  async updateLessonPlan(
    id: number,
    data: Partial<InsertLessonPlan>
  ): Promise<LessonPlan | undefined> {
    const lessonPlan = await this.getLessonPlan(id);
    if (!lessonPlan) return undefined;

    const updatedLessonPlan = { ...lessonPlan, ...data };
    this.lessonPlansMap.set(id, updatedLessonPlan);
    return updatedLessonPlan;
  }

  async deleteLessonPlan(id: number): Promise<boolean> {
    return this.lessonPlansMap.delete(id);
  }

  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignmentsMap.get(id);
  }

  async getAssignmentsByTeacherId(teacherId: number): Promise<Assignment[]> {
    return Array.from(this.assignmentsMap.values()).filter(
      (a) => a.teacher_id === teacherId
    );
  }

  async getAssignmentsByClassId(classId: number): Promise<Assignment[]> {
    return Array.from(this.assignmentsMap.values()).filter(
      (a) => a.class_id === classId
    );
  }

  async createAssignment(
    insertAssignment: InsertAssignment
  ): Promise<Assignment> {
    const id = this.currentIds.assignments++;
    const assignment = { ...insertAssignment, id };
    this.assignmentsMap.set(id, assignment);
    return assignment;
  }

  async updateAssignment(
    id: number,
    data: Partial<InsertAssignment>
  ): Promise<Assignment | undefined> {
    const assignment = await this.getAssignment(id);
    if (!assignment) return undefined;

    const updatedAssignment = { ...assignment, ...data };
    this.assignmentsMap.set(id, updatedAssignment);
    return updatedAssignment;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    return this.assignmentsMap.delete(id);
  }

  // AssignmentSubmission operations
  async getAssignmentSubmission(
    id: number
  ): Promise<AssignmentSubmission | undefined> {
    return this.assignmentSubmissionsMap.get(id);
  }

  async getAssignmentSubmissionsByAssignmentId(
    assignmentId: number
  ): Promise<AssignmentSubmission[]> {
    return Array.from(this.assignmentSubmissionsMap.values()).filter(
      (as) => as.assignment_id === assignmentId
    );
  }

  async getAssignmentSubmissionsByStudentId(
    studentId: number
  ): Promise<AssignmentSubmission[]> {
    return Array.from(this.assignmentSubmissionsMap.values()).filter(
      (as) => as.student_id === studentId
    );
  }

  async createAssignmentSubmission(
    insertAssignmentSubmission: InsertAssignmentSubmission
  ): Promise<AssignmentSubmission> {
    const id = this.currentIds.assignmentSubmissions++;
    const submission_date = new Date();
    const assignmentSubmission = {
      ...insertAssignmentSubmission,
      id,
      submission_date,
    };
    this.assignmentSubmissionsMap.set(id, assignmentSubmission);
    return assignmentSubmission;
  }

  async updateAssignmentSubmission(
    id: number,
    data: Partial<InsertAssignmentSubmission>
  ): Promise<AssignmentSubmission | undefined> {
    const assignmentSubmission = await this.getAssignmentSubmission(id);
    if (!assignmentSubmission) return undefined;

    const updatedAssignmentSubmission = { ...assignmentSubmission, ...data };
    this.assignmentSubmissionsMap.set(id, updatedAssignmentSubmission);
    return updatedAssignmentSubmission;
  }

  async deleteAssignmentSubmission(id: number): Promise<boolean> {
    return this.assignmentSubmissionsMap.delete(id);
  }

  // Exam operations
  async getExam(id: number): Promise<Exam | undefined> {
    return this.examsMap.get(id);
  }

  async getExamsBySchoolId(schoolId: number): Promise<Exam[]> {
    return Array.from(this.examsMap.values()).filter(
      (e) => e.school_id === schoolId
    );
  }

  async getExamsByClassId(classId: number): Promise<Exam[]> {
    return Array.from(this.examsMap.values()).filter(
      (e) => e.class_id === classId
    );
  }

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const id = this.currentIds.exams++;
    const exam = { ...insertExam, id };
    this.examsMap.set(id, exam);
    return exam;
  }

  async updateExam(
    id: number,
    data: Partial<InsertExam>
  ): Promise<Exam | undefined> {
    const exam = await this.getExam(id);
    if (!exam) return undefined;

    const updatedExam = { ...exam, ...data };
    this.examsMap.set(id, updatedExam);
    return updatedExam;
  }

  async deleteExam(id: number): Promise<boolean> {
    return this.examsMap.delete(id);
  }

  // ExamSubject operations
  async getExamSubject(id: number): Promise<ExamSubject | undefined> {
    return this.examSubjectsMap.get(id);
  }

  async getExamSubjectsByExamId(examId: number): Promise<ExamSubject[]> {
    return Array.from(this.examSubjectsMap.values()).filter(
      (es) => es.exam_id === examId
    );
  }

  async createExamSubject(
    insertExamSubject: InsertExamSubject
  ): Promise<ExamSubject> {
    const id = this.currentIds.examSubjects++;
    const examSubject = { ...insertExamSubject, id };
    this.examSubjectsMap.set(id, examSubject);
    return examSubject;
  }

  async updateExamSubject(
    id: number,
    data: Partial<InsertExamSubject>
  ): Promise<ExamSubject | undefined> {
    const examSubject = await this.getExamSubject(id);
    if (!examSubject) return undefined;

    const updatedExamSubject = { ...examSubject, ...data };
    this.examSubjectsMap.set(id, updatedExamSubject);
    return updatedExamSubject;
  }

  async deleteExamSubject(id: number): Promise<boolean> {
    return this.examSubjectsMap.delete(id);
  }

  // Mark operations
  async getMark(id: number): Promise<Mark | undefined> {
    return this.marksMap.get(id);
  }

  async getMarksByStudentId(studentId: number): Promise<Mark[]> {
    return Array.from(this.marksMap.values()).filter(
      (m) => m.student_id === studentId
    );
  }

  async getMarksByExamSubjectId(examSubjectId: number): Promise<Mark[]> {
    return Array.from(this.marksMap.values()).filter(
      (m) => m.exam_subject_id === examSubjectId
    );
  }

  async createMark(insertMark: InsertMark): Promise<Mark> {
    const id = this.currentIds.marks++;
    const mark = { ...insertMark, id };
    this.marksMap.set(id, mark);
    return mark;
  }

  async updateMark(
    id: number,
    data: Partial<InsertMark>
  ): Promise<Mark | undefined> {
    const mark = await this.getMark(id);
    if (!mark) return undefined;

    const updatedMark = { ...mark, ...data };
    this.marksMap.set(id, updatedMark);
    return updatedMark;
  }

  async deleteMark(id: number): Promise<boolean> {
    return this.marksMap.delete(id);
  }

  // FeeStructure operations
  async getFeeStructure(id: number): Promise<FeeStructure | undefined> {
    return this.feeStructuresMap.get(id);
  }

  async getFeeStructuresBySchoolId(schoolId: number): Promise<FeeStructure[]> {
    return Array.from(this.feeStructuresMap.values()).filter(
      (fs) => fs.school_id === schoolId
    );
  }

  async getFeeStructuresByClassId(classId: number): Promise<FeeStructure[]> {
    return Array.from(this.feeStructuresMap.values()).filter(
      (fs) => fs.class_id === classId
    );
  }

  async createFeeStructure(
    insertFeeStructure: InsertFeeStructure
  ): Promise<FeeStructure> {
    const id = this.currentIds.feeStructures++;
    const feeStructure = { ...insertFeeStructure, id };
    this.feeStructuresMap.set(id, feeStructure);
    return feeStructure;
  }

  async updateFeeStructure(
    id: number,
    data: Partial<InsertFeeStructure>
  ): Promise<FeeStructure | undefined> {
    const feeStructure = await this.getFeeStructure(id);
    if (!feeStructure) return undefined;

    const updatedFeeStructure = { ...feeStructure, ...data };
    this.feeStructuresMap.set(id, updatedFeeStructure);
    return updatedFeeStructure;
  }

  async deleteFeeStructure(id: number): Promise<boolean> {
    return this.feeStructuresMap.delete(id);
  }

  // FeePayment operations
  async getFeePayment(id: number): Promise<FeePayment | undefined> {
    return this.feePaymentsMap.get(id);
  }

  async getFeePaymentsByStudentId(studentId: number): Promise<FeePayment[]> {
    return Array.from(this.feePaymentsMap.values()).filter(
      (fp) => fp.student_id === studentId
    );
  }

  async createFeePayment(
    insertFeePayment: InsertFeePayment
  ): Promise<FeePayment> {
    const id = this.currentIds.feePayments++;
    const feePayment = { ...insertFeePayment, id };
    this.feePaymentsMap.set(id, feePayment);
    return feePayment;
  }

  async updateFeePayment(
    id: number,
    data: Partial<InsertFeePayment>
  ): Promise<FeePayment | undefined> {
    const feePayment = await this.getFeePayment(id);
    if (!feePayment) return undefined;

    const updatedFeePayment = { ...feePayment, ...data };
    this.feePaymentsMap.set(id, updatedFeePayment);
    return updatedFeePayment;
  }

  async deleteFeePayment(id: number): Promise<boolean> {
    return this.feePaymentsMap.delete(id);
  }

  // Bill operations
  async getBill(id: number): Promise<Bill | undefined> {
    return this.billsMap.get(id);
  }

  async getBillsBySchoolId(schoolId: number): Promise<Bill[]> {
    return Array.from(this.billsMap.values()).filter(
      (b) => b.school_id === schoolId
    );
  }

  async createBill(insertBill: InsertBill): Promise<Bill> {
    const id = this.currentIds.bills++;
    const bill = { ...insertBill, id };
    this.billsMap.set(id, bill);
    return bill;
  }

  async updateBill(
    id: number,
    data: Partial<InsertBill>
  ): Promise<Bill | undefined> {
    const bill = await this.getBill(id);
    if (!bill) return undefined;

    const updatedBill = { ...bill, ...data };
    this.billsMap.set(id, updatedBill);
    return updatedBill;
  }

  async deleteBill(id: number): Promise<boolean> {
    return this.billsMap.delete(id);
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messagesMap.get(id);
  }

  async getMessagesBySenderId(senderId: number): Promise<Message[]> {
    return Array.from(this.messagesMap.values()).filter(
      (m) => m.sender_id === senderId
    );
  }

  async getMessagesBySchoolId(schoolId: number): Promise<Message[]> {
    return Array.from(this.messagesMap.values()).filter(
      (m) => m.school_id === schoolId
    );
  }

  async getMessagesByReceiverId(
    receiverId: number,
    receiverRole: string
  ): Promise<Message[]> {
    return Array.from(this.messagesMap.values()).filter(
      (m) =>
        (m.receiver_id === receiverId && m.receiver_role === receiverRole) ||
        m.receiver_role === "all"
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentIds.messages++;
    const created_at = new Date();
    const message = { ...insertMessage, id, created_at };
    this.messagesMap.set(id, message);
    return message;
  }

  async updateMessage(
    id: number,
    data: Partial<InsertMessage>
  ): Promise<Message | undefined> {
    const message = await this.getMessage(id);
    if (!message) return undefined;

    const updatedMessage = { ...message, ...data };
    this.messagesMap.set(id, updatedMessage);
    return updatedMessage;
  }

  async deleteMessage(id: number): Promise<boolean> {
    return this.messagesMap.delete(id);
  }

  // ClassMessage operations
  async getClassMessage(id: number): Promise<ClassMessage | undefined> {
    return this.classMessagesMap.get(id);
  }

  async getClassMessagesByClassId(classId: number): Promise<ClassMessage[]> {
    return Array.from(this.classMessagesMap.values()).filter(
      (cm) => cm.class_id === classId
    );
  }

  async createClassMessage(
    insertClassMessage: InsertClassMessage
  ): Promise<ClassMessage> {
    const id = this.currentIds.classMessages++;
    const created_at = new Date();
    const classMessage = { ...insertClassMessage, id, created_at };
    this.classMessagesMap.set(id, classMessage);
    return classMessage;
  }

  async updateClassMessage(
    id: number,
    data: Partial<InsertClassMessage>
  ): Promise<ClassMessage | undefined> {
    const classMessage = await this.getClassMessage(id);
    if (!classMessage) return undefined;

    const updatedClassMessage = { ...classMessage, ...data };
    this.classMessagesMap.set(id, updatedClassMessage);
    return updatedClassMessage;
  }

  async deleteClassMessage(id: number): Promise<boolean> {
    return this.classMessagesMap.delete(id);
  }
}

// Export the storage instance
// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Session store for authentication
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // For auth compatibility
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.getUserByEmail(username);
  }

  // async createUser(insertUser: InsertUser): Promise<User> {
  //   const [user] = await db.insert(users).values(insertUser).returning();
  //   return user;
  // }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Step 1: Check if a user with the same email already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, insertUser.email))
        .limit(1);

      // Step 2: If a user is found, throw an error
      if (existingUser.length > 0) {
        throw new Error("User with this email already exists.");
      }

      // Step 3: If no duplicate exists, proceed with the insertion
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }

  // Add this method to the DatabaseStorage class in server/storage.ts
  async createClassLog(logData: InsertClassLog): Promise<ClassLog> {
    try {
      const [classLog] = await db
        .insert(classLogs)
        .values({
          ...logData,
          created_at: new Date(),
        })
        .returning();
      return classLog;
    } catch (error) {
      console.error("Error creating class log:", error);
      throw error;
    }
  }

  async updateUser(
    id: number,
    data: Partial<InsertUser>
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return !!deleted;
  }

  // School operations
  async getSchool(id: number): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.id, id));
    return school;
  }

  // Method to get school by email
  async getSchoolByEmail(contact_email: string): Promise<School | undefined> {
    console.log("Searching school for email:", contact_email);
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.contact_email, contact_email));

    console.log("School found:", school);
    return school;
  }

  async getSchools(): Promise<School[]> {
    return await db.select().from(schools);
  }

  async createSchool(insertSchool: InsertSchool): Promise<School> {
    const [school] = await db.insert(schools).values(insertSchool).returning();
    return school;
  }

  async updateSchool(
    id: number,
    data: Partial<InsertSchool>
  ): Promise<School | undefined> {
    const [updated] = await db
      .update(schools)
      .set(data)
      .where(eq(schools.id, id))
      .returning();
    return updated;
  }

  async deleteSchool(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(schools)
      .where(eq(schools.id, id))
      .returning();
    return !!deleted;
  }

  // SchoolAdmin operations
  async getSchoolAdmin(id: number): Promise<SchoolAdmin | undefined> {
    const [admin] = await db
      .select()
      .from(schoolAdmins)
      .where(eq(schoolAdmins.id, id));
    return admin;
  }

  async getSchoolAdminByUserId(
    userId: number
  ): Promise<SchoolAdmin | undefined> {
    const [admin] = await db
      .select()
      .from(schoolAdmins)
      .where(eq(schoolAdmins.user_id, userId));
    return admin;
  }

  async getSchoolAdminsBySchoolId(schoolId: number): Promise<SchoolAdmin[]> {
    return await db
      .select()
      .from(schoolAdmins)
      .where(eq(schoolAdmins.school_id, schoolId));
  }

  async createSchoolAdmin(
    insertSchoolAdmin: InsertSchoolAdmin
  ): Promise<SchoolAdmin> {
    const [admin] = await db
      .insert(schoolAdmins)
      .values(insertSchoolAdmin)
      .returning();
    return admin;
  }

  async updateSchoolAdmin(
    id: number,
    data: Partial<InsertSchoolAdmin>
  ): Promise<SchoolAdmin | undefined> {
    const [updated] = await db
      .update(schoolAdmins)
      .set(data)
      .where(eq(schoolAdmins.id, id))
      .returning();
    return updated;
  }

  async deleteSchoolAdmin(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(schoolAdmins)
      .where(eq(schoolAdmins.id, id))
      .returning();
    return !!deleted;
  }

  // Teacher operations
  async getTeacher(id: number): Promise<Teacher | undefined> {
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, id));
    return teacher;
  }

  async getTeacherByUserId(userId: number): Promise<Teacher | undefined> {
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.user_id, userId));
    return teacher;
  }

  async getTeachersBySchoolId(schoolId: number): Promise<Teacher[]> {
    return await db
      .select()
      .from(teachers)
      .where(eq(teachers.school_id, schoolId));
  }

  async getTeachersByTeacherId(
    schoolId: number,
    staffId: number
  ): Promise<Teacher[]> {
    return await db
      .select()
      .from(teachers)
      .where(and(eq(teachers.school_id, schoolId), eq(teachers.id, staffId)));
  }

  async getTeacherByTeacherEmail(TeacherEmail: string): Promise<Teacher[]> {
    return await db
      .select()
      .from(teachers)
      .where(eq(teachers.email, TeacherEmail));
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const [teacher] = await db
      .insert(teachers)
      .values(insertTeacher)
      .returning();
    return teacher;
  }

  async updateTeacher(
    id: number,
    data: Partial<InsertTeacher>
  ): Promise<Teacher | undefined> {
    const [updated] = await db
      .update(teachers)
      .set(data)
      .where(eq(teachers.id, id))
      .returning();
    return updated;
  }

  async deleteTeacher(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(teachers)
      .where(eq(teachers.id, id))
      .returning();
    return !!deleted;
  }

  async getClassesByTeacherId(teacherId: number) {
    console.log("Fetching classes for teacher ID:", teacherId);
    try {
      const result = await db
        .selectDistinct({
          id: classes.id,
          grade: classes.grade,
          section: classes.section,
        })
        .from(classSubjects)
        .innerJoin(classes, eq(classSubjects.class_id, classes.id))
        .where(eq(classSubjects.teacher_id, teacherId));

      console.log("Query result:", result);
      return result;
    } catch (error) {
      console.error("Error fetching classes by teacher ID:", error);
      throw error;
    }
  }

  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, id));
    return student;
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.user_id, userId));
    return student;
  }

  async getStudentsBySchoolId(schoolId: number): Promise<Student[]> {
    return await db
      .select()
      .from(students)
      .where(eq(students.school_id, schoolId));
  }

  async getStudentsByClassId(classId: number): Promise<Student[]> {
    return await db
      .select()
      .from(students)
      .where(eq(students.class_id, classId));
  }

  // async createStudent(insertStudent: InsertStudent): Promise<Student> {
  //   const [student] = await db
  //     .insert(students)
  //     .values(insertStudent)
  //     .returning();
  //   return student;
  // }
  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    try {
      // Step 1: Check if a student with the same email already exists
      const existingStudent = await db
        .select()
        .from(students)
        .where(eq(students.student_email, insertStudent.student_email))
        .limit(1);

      // Step 2: If a student is found, throw an error to prevent a duplicate
      if (existingStudent.length > 0) {
        throw new Error("Student with this email already exists.");
      }

      // Step 3: If no duplicate exists, proceed with the insertion
      const [studentItem] = await db
        .insert(students)
        .values(insertStudent)
        .returning();

      return studentItem;
    } catch (error) {
      console.error("Error in createStudent:", error);
      throw error;
    }
  }

  async updateStudent(
    id: number,
    data: Partial<InsertStudent>
  ): Promise<Student | undefined> {
    const [updated] = await db
      .update(students)
      .set(data)
      .where(eq(students.id, id))
      .returning();
    return updated;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(students)
      .where(eq(students.id, id))
      .returning();
    return !!deleted;
  }

  // Class operations
  async getClass(id: number): Promise<Class | undefined> {
    const [classItem] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, id));
    return classItem;
  }

  async getClassesBySchoolId(schoolId: number): Promise<Class[]> {
    return await db
      .select()
      .from(classes)
      .where(eq(classes.school_id, schoolId));
  }
  async getClassesBySchool(schoolId: number): Promise<ClassItemWithCount[]> {
    const classWithCount = await db
      .select({
        id: classes.id,
        grade: classes.grade,
        section: classes.section,
        studentCount: sql<number>`COUNT(${students.id})`.mapWith(Number),
        class_teacher_id: classes.class_teacher_id,
        class_teacher_name: classes.class_teacher_name,
      })
      .from(classes)
      .leftJoin(students, eq(classes.id, students.class_id))
      .where(eq(classes.school_id, schoolId))
      .groupBy(classes.id, classes.grade, classes.section);

    return classWithCount;
  }

  // async createClass(insertClass: InsertClass): Promise<Class> {
  //   const [classItem] = await db
  //     .insert(classes)
  //     .values(insertClass)
  //     .returning();
  //   return classItem;
  // }
  async createClass(insertClass: InsertClass): Promise<Class> {
    try {
      // Step 1: Check if a class with the same school, grade, and section already exists
      const existingClass = await db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.school_id, insertClass.school_id),
            eq(classes.grade, insertClass.grade),
            eq(classes.section, insertClass.section)
          )
        )
        .limit(1);

      // Step 2: If a class is found, throw an error to prevent a duplicate
      if (existingClass.length > 0) {
        throw new Error(
          "Class with this grade and section already exists for this school."
        );
      }

      // Step 3: If no duplicate exists, proceed with the insertion
      const [classItem] = await db
        .insert(classes)
        .values(insertClass)
        .returning();

      return classItem;
    } catch (error) {
      // Re-throw the error to be handled by the API route
      console.error("Error in createClass:", error);
      throw error;
    }
  }

  async updateClass(
    id: number,
    data: Partial<InsertClass>
  ): Promise<Class | undefined> {
    const [updated] = await db
      .update(classes)
      .set(data)
      .where(eq(classes.id, id))
      .returning();
    return updated;
  }

  async deleteClass(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(classes)
      .where(eq(classes.id, id))
      .returning();
    return !!deleted;
  }

  // Subject operations
  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id));
    return subject;
  }

  async getSubjectsBySchoolId(schoolId: number): Promise<Subject[]> {
    return await db
      .select()
      .from(subjects)
      .where(eq(subjects.school_id, schoolId));
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const [subject] = await db
      .insert(subjects)
      .values(insertSubject)
      .returning();
    return subject;
  }

  async updateSubject(
    id: number,
    data: Partial<InsertSubject>
  ): Promise<Subject | undefined> {
    const [updated] = await db
      .update(subjects)
      .set(data)
      .where(eq(subjects.id, id))
      .returning();
    return updated;
  }

  async deleteSubject(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(subjects)
      .where(eq(subjects.id, id))
      .returning();
    return !!deleted;
  }

  // ClassSubject operations
  async getClassSubject(id: number): Promise<ClassSubject | undefined> {
    const [classSubject] = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.id, id));
    return classSubject;
  }

  async getClassSubjectsByClassId(classId: number): Promise<ClassSubject[]> {
    return await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.class_id, classId));
  }

  async getClassSubjectsByTeacherId(
    teacherId: number
  ): Promise<ClassSubject[]> {
    return await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.teacher_id, teacherId));
  }

  async createClassSubject(
    insertClassSubject: InsertClassSubject
  ): Promise<ClassSubject> {
    // Check if the subject is already assigned to the class
    const existing = await db
      .select()
      .from(classSubjects)
      .where(
        and(
          eq(classSubjects.class_id, insertClassSubject.class_id),
          eq(classSubjects.subject_id, insertClassSubject.subject_id)
        )
      );

    if (existing.length > 0) {
      // Subject is already assigned, update the teacher
      const [classSubject] = await db
        .update(classSubjects)
        .set({ teacher_id: insertClassSubject.teacher_id })
        .where(eq(classSubjects.id, existing[0].id))
        .returning();
      return classSubject;
    }

    // Subject is not assigned, create a new mapping
    const [classSubject] = await db
      .insert(classSubjects)
      .values(insertClassSubject)
      .returning();
    return classSubject;
  }

  async updateClassSubject(
    id: number,
    data: Partial<InsertClassSubject>
  ): Promise<ClassSubject | undefined> {
    const [updated] = await db
      .update(classSubjects)
      .set(data)
      .where(eq(classSubjects.id, id))
      .returning();
    return updated;
  }

  async deleteClassSubject(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(classSubjects)
      .where(eq(classSubjects.id, id))
      .returning();
    return !!deleted;
  }

  // StudentAttendance operations
  async getStudentAttendance(
    id: number
  ): Promise<StudentAttendance | undefined> {
    const [attendance] = await db
      .select()
      .from(studentAttendance)
      .where(eq(studentAttendance.id, id));
    return attendance;
  }

  async getStudentAttendanceByStudentId(
    studentId: number
  ): Promise<StudentAttendance[]> {
    return await db
      .select()
      .from(studentAttendance)
      .where(eq(studentAttendance.student_id, studentId));
  }

  async getStudentAttendanceByClassId(
    classId: number,
    date: Date
  ): Promise<StudentAttendance[]> {
    return await db
      .select()
      .from(studentAttendance)
      .where(
        and(
          eq(studentAttendance.class_id, classId),
          eq(studentAttendance.date, date)
        )
      );
  }

  async createStudentAttendance(
    insertAttendance: InsertStudentAttendance
  ): Promise<StudentAttendance> {
    const [attendance] = await db
      .insert(studentAttendance)
      .values(insertAttendance)
      .returning();
    return attendance;
  }

  async updateStudentAttendance(
    id: number,
    data: Partial<InsertStudentAttendance>
  ): Promise<StudentAttendance | undefined> {
    const [updated] = await db
      .update(studentAttendance)
      .set(data)
      .where(eq(studentAttendance.id, id))
      .returning();
    return updated;
  }

  async deleteStudentAttendance(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(studentAttendance)
      .where(eq(studentAttendance.id, id))
      .returning();
    return !!deleted;
  }

  // TeacherAttendance operations
  async getTeacherAttendance(
    id: number
  ): Promise<TeacherAttendance | undefined> {
    const [attendance] = await db
      .select()
      .from(teacherAttendance)
      .where(eq(teacherAttendance.id, id));
    return attendance;
  }

  async getTeacherAttendanceByTeacherId(
    teacherId: number
  ): Promise<TeacherAttendance[]> {
    return await db
      .select()
      .from(teacherAttendance)
      .where(eq(teacherAttendance.teacher_id, teacherId));
  }

  async getTeacherAttendanceBySchoolId(
    schoolId: number,
    date: Date
  ): Promise<TeacherAttendance[]> {
    return await db
      .select()
      .from(teacherAttendance)
      .where(
        and(
          eq(teacherAttendance.school_id, schoolId),
          eq(teacherAttendance.date, date)
        )
      );
  }

  async createTeacherAttendance(
    insertAttendance: InsertTeacherAttendance
  ): Promise<TeacherAttendance> {
    const [attendance] = await db
      .insert(teacherAttendance)
      .values(insertAttendance)
      .returning();
    return attendance;
  }

  async updateTeacherAttendance(
    id: number,
    data: Partial<InsertTeacherAttendance>
  ): Promise<TeacherAttendance | undefined> {
    const [updated] = await db
      .update(teacherAttendance)
      .set(data)
      .where(eq(teacherAttendance.id, id))
      .returning();
    return updated;
  }

  async deleteTeacherAttendance(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(teacherAttendance)
      .where(eq(teacherAttendance.id, id))
      .returning();
    return !!deleted;
  }

  //logs
  // Add this method to the DatabaseStorage class
  async createClassLog(logData: InsertClassLog): Promise<ClassLog> {
    const [classLog] = await db.insert(classLogs).values(logData).returning();
    return classLog;
  }

  // LessonPlan operations
  async getLessonPlan(id: number): Promise<LessonPlan | undefined> {
    const [plan] = await db
      .select()
      .from(lessonPlans)
      .where(eq(lessonPlans.id, id));
    return plan;
  }

  async getLessonPlansByTeacherId(teacherId: number): Promise<LessonPlan[]> {
    return await db
      .select()
      .from(lessonPlans)
      .where(eq(lessonPlans.teacher_id, teacherId));
  }

  async getLessonPlansByClassId(classId: number): Promise<LessonPlan[]> {
    return await db
      .select()
      .from(lessonPlans)
      .where(eq(lessonPlans.class_id, classId));
  }

  async createLessonPlan(
    insertLessonPlan: InsertLessonPlan
  ): Promise<LessonPlan> {
    const [plan] = await db
      .insert(lessonPlans)
      .values(insertLessonPlan)
      .returning();
    return plan;
  }

  async updateLessonPlan(
    id: number,
    data: Partial<InsertLessonPlan>
  ): Promise<LessonPlan | undefined> {
    const [updated] = await db
      .update(lessonPlans)
      .set(data)
      .where(eq(lessonPlans.id, id))
      .returning();
    return updated;
  }

  async deleteLessonPlan(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(lessonPlans)
      .where(eq(lessonPlans.id, id))
      .returning();
    return !!deleted;
  }

  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, id));
    return assignment;
  }

  async getAssignmentsByTeacherId(teacherId: number): Promise<Assignment[]> {
    return await db
      .select()
      .from(assignments)
      .where(eq(assignments.teacher_id, teacherId));
  }

  async getAssignmentsByClassId(classId: number): Promise<Assignment[]> {
    return await db
      .select()
      .from(assignments)
      .where(eq(assignments.class_id, classId));
  }

  async createAssignment(
    insertAssignment: InsertAssignment
  ): Promise<Assignment> {
    const [assignment] = await db
      .insert(assignments)
      .values(insertAssignment)
      .returning();
    return assignment;
  }

  async updateAssignment(
    id: number,
    data: Partial<InsertAssignment>
  ): Promise<Assignment | undefined> {
    const [updated] = await db
      .update(assignments)
      .set(data)
      .where(eq(assignments.id, id))
      .returning();
    return updated;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(assignments)
      .where(eq(assignments.id, id))
      .returning();
    return !!deleted;
  }

  // AssignmentSubmission operations
  async getAssignmentSubmission(
    id: number
  ): Promise<AssignmentSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.id, id));
    return submission;
  }

  async getAssignmentSubmissionsByAssignmentId(
    assignmentId: number
  ): Promise<AssignmentSubmission[]> {
    return await db
      .select()
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.assignment_id, assignmentId));
  }

  async getAssignmentSubmissionsByStudentId(
    studentId: number
  ): Promise<AssignmentSubmission[]> {
    return await db
      .select()
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.student_id, studentId));
  }

  async createAssignmentSubmission(
    insertSubmission: InsertAssignmentSubmission
  ): Promise<AssignmentSubmission> {
    const [submission] = await db
      .insert(assignmentSubmissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async updateAssignmentSubmission(
    id: number,
    data: Partial<InsertAssignmentSubmission>
  ): Promise<AssignmentSubmission | undefined> {
    const [updated] = await db
      .update(assignmentSubmissions)
      .set(data)
      .where(eq(assignmentSubmissions.id, id))
      .returning();
    return updated;
  }

  async deleteAssignmentSubmission(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(assignmentSubmissions)
      .where(eq(assignmentSubmissions.id, id))
      .returning();
    return !!deleted;
  }

  // Exam operations
  async getExam(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async getExamsBySchoolId(schoolId: number): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.school_id, schoolId));
  }

  async getExamsByClassId(classId: number): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.class_id, classId));
  }

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const [exam] = await db.insert(exams).values(insertExam).returning();
    return exam;
  }

  async updateExam(
    id: number,
    data: Partial<InsertExam>
  ): Promise<Exam | undefined> {
    const [updated] = await db
      .update(exams)
      .set(data)
      .where(eq(exams.id, id))
      .returning();
    return updated;
  }

  async deleteExam(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(exams)
      .where(eq(exams.id, id))
      .returning();
    return !!deleted;
  }

  // ExamSubject operations
  async getExamSubject(id: number): Promise<ExamSubject | undefined> {
    const [examSubject] = await db
      .select()
      .from(examSubjects)
      .where(eq(examSubjects.id, id));
    return examSubject;
  }

  async getExamSubjectsByExamId(examId: number): Promise<ExamSubject[]> {
    return await db
      .select()
      .from(examSubjects)
      .where(eq(examSubjects.exam_id, examId));
  }

  async createExamSubject(
    insertExamSubject: InsertExamSubject
  ): Promise<ExamSubject> {
    const [examSubject] = await db
      .insert(examSubjects)
      .values(insertExamSubject)
      .returning();
    return examSubject;
  }

  async updateExamSubject(
    id: number,
    data: Partial<InsertExamSubject>
  ): Promise<ExamSubject | undefined> {
    const [updated] = await db
      .update(examSubjects)
      .set(data)
      .where(eq(examSubjects.id, id))
      .returning();
    return updated;
  }

  async deleteExamSubject(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(examSubjects)
      .where(eq(examSubjects.id, id))
      .returning();
    return !!deleted;
  }

  // Mark operations
  async getMark(id: number): Promise<Mark | undefined> {
    const [mark] = await db.select().from(marks).where(eq(marks.id, id));
    return mark;
  }

  async getMarksByStudentId(studentId: number): Promise<Mark[]> {
    return await db.select().from(marks).where(eq(marks.student_id, studentId));
  }

  async getMarksByExamSubjectId(examSubjectId: number): Promise<Mark[]> {
    return await db
      .select()
      .from(marks)
      .where(eq(marks.exam_subject_id, examSubjectId));
  }

  async createMark(insertMark: InsertMark): Promise<Mark> {
    const [mark] = await db.insert(marks).values(insertMark).returning();
    return mark;
  }

  async updateMark(
    id: number,
    data: Partial<InsertMark>
  ): Promise<Mark | undefined> {
    const [updated] = await db
      .update(marks)
      .set(data)
      .where(eq(marks.id, id))
      .returning();
    return updated;
  }

  async deleteMark(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(marks)
      .where(eq(marks.id, id))
      .returning();
    return !!deleted;
  }

  // FeeStructure operations
  async getFeeStructure(id: number): Promise<FeeStructure | undefined> {
    const [feeStructure] = await db
      .select()
      .from(feeStructures)
      .where(eq(feeStructures.id, id));
    return feeStructure;
  }

  async getFeeStructuresBySchoolId(schoolId: number): Promise<FeeStructure[]> {
    return await db
      .select()
      .from(feeStructures)
      .where(eq(feeStructures.school_id, schoolId));
  }

  async getFeeStructuresByClassId(classId: number): Promise<FeeStructure[]> {
    return await db
      .select()
      .from(feeStructures)
      .where(eq(feeStructures.class_id, classId));
  }

  async createFeeStructure(
    insertFeeStructure: InsertFeeStructure
  ): Promise<FeeStructure> {
    const [feeStructure] = await db
      .insert(feeStructures)
      .values(insertFeeStructure)
      .returning();
    return feeStructure;
  }

  async updateFeeStructure(
    id: number,
    data: Partial<InsertFeeStructure>
  ): Promise<FeeStructure | undefined> {
    const [updated] = await db
      .update(feeStructures)
      .set(data)
      .where(eq(feeStructures.id, id))
      .returning();
    return updated;
  }

  async deleteFeeStructure(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(feeStructures)
      .where(eq(feeStructures.id, id))
      .returning();
    return !!deleted;
  }

  // FeePayment operations
  async getFeePayment(id: number): Promise<FeePayment | undefined> {
    const [feePayment] = await db
      .select()
      .from(feePayments)
      .where(eq(feePayments.id, id));
    return feePayment;
  }

  async getFeePaymentsByStudentId(studentId: number): Promise<FeePayment[]> {
    return await db
      .select()
      .from(feePayments)
      .where(eq(feePayments.student_id, studentId));
  }

  async createFeePayment(
    insertFeePayment: InsertFeePayment
  ): Promise<FeePayment> {
    const [feePayment] = await db
      .insert(feePayments)
      .values(insertFeePayment)
      .returning();
    return feePayment;
  }

  async updateFeePayment(
    id: number,
    data: Partial<InsertFeePayment>
  ): Promise<FeePayment | undefined> {
    const [updated] = await db
      .update(feePayments)
      .set(data)
      .where(eq(feePayments.id, id))
      .returning();
    return updated;
  }

  async deleteFeePayment(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(feePayments)
      .where(eq(feePayments.id, id))
      .returning();
    return !!deleted;
  }

  // Bill operations
  async getBill(id: number): Promise<Bill | undefined> {
    const [bill] = await db.select().from(bills).where(eq(bills.id, id));
    return bill;
  }

  async getBillsBySchoolId(schoolId: number): Promise<Bill[]> {
    return await db.select().from(bills).where(eq(bills.school_id, schoolId));
  }

  async createBill(insertBill: InsertBill): Promise<Bill> {
    const [bill] = await db.insert(bills).values(insertBill).returning();
    return bill;
  }

  async updateBill(
    id: number,
    data: Partial<InsertBill>
  ): Promise<Bill | undefined> {
    const [updated] = await db
      .update(bills)
      .set(data)
      .where(eq(bills.id, id))
      .returning();
    return updated;
  }

  async deleteBill(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(bills)
      .where(eq(bills.id, id))
      .returning();
    return !!deleted;
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return message;
  }

  async getMessagesBySenderId(senderId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.sender_id, senderId));
  }

  async getMessagesBySchoolId(schoolId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.school_id, schoolId));
  }

  async getMessagesByReceiverId(
    receiverId: number,
    receiverRole: string
  ): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.receiver_id, receiverId),
          eq(messages.receiver_role, receiverRole)
        )
      );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async updateMessage(
    id: number,
    data: Partial<InsertMessage>
  ): Promise<Message | undefined> {
    const [updated] = await db
      .update(messages)
      .set(data)
      .where(eq(messages.id, id))
      .returning();
    return updated;
  }

  async deleteMessage(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(messages)
      .where(eq(messages.id, id))
      .returning();
    return !!deleted;
  }

  // ClassMessage operations
  async getClassMessage(id: number): Promise<ClassMessage | undefined> {
    const [message] = await db
      .select()
      .from(classMessages)
      .where(eq(classMessages.id, id));
    return message;
  }

  async getClassMessagesByClassId(classId: number): Promise<ClassMessage[]> {
    return await db
      .select()
      .from(classMessages)
      .where(eq(classMessages.class_id, classId));
  }

  async createClassMessage(
    insertClassMessage: InsertClassMessage
  ): Promise<ClassMessage> {
    const [message] = await db
      .insert(classMessages)
      .values(insertClassMessage)
      .returning();
    return message;
  }

  async updateClassMessage(
    id: number,
    data: Partial<InsertClassMessage>
  ): Promise<ClassMessage | undefined> {
    const [updated] = await db
      .update(classMessages)
      .set(data)
      .where(eq(classMessages.id, id))
      .returning();
    return updated;
  }

  async deleteClassMessage(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(classMessages)
      .where(eq(classMessages.id, id))
      .returning();
    return !!deleted;
  }
}

// Export database storage instance
export const storage = new DatabaseStorage();
