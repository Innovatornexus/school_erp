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
  homework,
  Homework,
  InsertHomework,
  homeworkSubmissions,
  HomeworkSubmission,
  InsertHomeworkSubmission,
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
  teacherAttendance,
  TeacherAttendance,
  InsertTeacherAttendance,
  lessonPlans,
  LessonPlan,
  InsertLessonPlan,
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
  teacher_messages,
  holidays,
  InsertStudentAttendance,
  InsertMaterial,
  InsertTest,
  Material,
  Test,
  materials,
  tests,
} from "@shared/schema";

import { db, pool } from "./db";
import {
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
} from "date-fns";

import session from "express-session";
import connectPg from "connect-pg-simple";
import { and, eq, gte, lte, sql, desc } from "drizzle-orm"; // Make sure gte and lte are imported
``;
import type { ClassItemWithCount } from "../client/src/pages/type";
import { alias } from "drizzle-orm/pg-core";

// Initialize the session store
const PostgresSessionStore = connectPg(session);

// Database storage implementation
export class DatabaseStorage {
  // Session store for authentication
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Messages operations for teacher messages

  async getMessagesByTeacherId(teacherId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.sender_id, teacherId));
  }

  // Function to save holidays for a year
  async createOrUpdateHolidays(
    schoolId: number,
    year: number,
    holidayList: { date: string; name: string }[]
  ) {
    // Drizzle's ON CONFLICT DO UPDATE (upsert) is perfect here
    return db
      .insert(holidays)
      .values(
        holidayList.map((h) => ({
          school_id: schoolId,
          date: h.date,
          name: h.name,
        }))
      )
      .onConflictDoUpdate({
        target: [holidays.school_id, holidays.date], // Unique constraint
        set: {
          name: sql`excluded.name`, // Update the name if the date already exists
        },
      })
      .returning();
  }

  // Main function to generate reports
  async generateAttendanceReport(params: {
    reportType: "student" | "teacher";
    periodType: "month" | "year";
    year: number;
    month?: number;
    classId?: number;
    schoolId: number;
  }) {
    // 1. Determine Date Range
    let startDate, endDate;
    if (params.periodType === "year") {
      startDate = startOfYear(new Date(params.year, 0, 1));
      endDate = endOfYear(new Date(params.year, 0, 1));
    } else if (params.periodType === "month" && params.month !== undefined) {
      startDate = startOfMonth(new Date(params.year, params.month));
      endDate = endOfMonth(new Date(params.year, params.month));
    } else {
      throw new Error("Invalid period type or missing month.");
    }

    // 2. Get all holidays within the date range
    const holidaysInPeriod = await db.query.holidays.findMany({
      where: and(
        eq(holidays.school_id, params.schoolId),
        gte(holidays.date, format(startDate, "yyyy-MM-dd")),
        lte(holidays.date, format(endDate, "yyyy-MM-dd"))
      ),
    });
    const holidayDates = new Set(holidaysInPeriod.map((h) => h.date));

    // 3. Calculate Total Working Days (excluding Sundays and holidays)
    let totalWorkingDays = 0;
    const daysInInterval = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
    for (const day of daysInInterval) {
      const dayOfWeek = getDay(day); // 0 = Sunday
      const formattedDate = format(day, "yyyy-MM-dd");
      if (dayOfWeek !== 0 && !holidayDates.has(formattedDate)) {
        totalWorkingDays++;
      }
    }

    // 4. Fetch and Aggregate Attendance Data
    let reportData: any;
    if (params.reportType === "student") {
      if (!params.classId)
        throw new Error("Class ID is required for student reports.");

      const studentAttendances = await db
        .select({
          id: students.id,
          name: students.full_name,
          roll_no: students.roll_no,
          daysPresent:
            sql<number>`count(CASE WHEN ${studentAttendance.status} = 'present' THEN 1 END)`.mapWith(
              Number
            ),
        })
        .from(students) // <-- START from the 'students' table
        .leftJoin(
          studentAttendance,
          and(
            // <-- USE leftJoin to include all students, even those with no attendance records
            eq(studentAttendance.student_id, students.id),
            // Move date filter for attendance records into the join condition for correctness
            gte(studentAttendance.date, format(startDate, "yyyy-MM-dd")),
            lte(studentAttendance.date, format(endDate, "yyyy-MM-dd"))
          )
        )
        .where(
          // Filter the main table (students) by classId
          eq(students.class_id, params.classId)
        )
        .groupBy(students.id, students.full_name, students.roll_no)
        .orderBy(students.roll_no);
      reportData = studentAttendances.map((row) => ({
        ...row,
        percentage:
          totalWorkingDays > 0
            ? Math.round((row.daysPresent / totalWorkingDays) * 100)
            : 0,
      }));
      // Inside generateAttendanceReport function
    } else {
      // This is the block for params.reportType === "teacher"
      const teacherAttendances = await db
        .select({
          id: teachers.id,
          name: teachers.full_name,
          daysPresent:
            sql<number>`count(CASE WHEN ${teacherAttendance.status} = 'present' THEN 1 END)`.mapWith(
              Number
            ),
        })
        .from(teachers)
        .leftJoin(
          teacherAttendance,
          and(
            eq(teacherAttendance.teacher_id, teachers.id),
            // Add a filter for the school to ensure you only get teachers from the correct school
            eq(teacherAttendance.school_id, params.schoolId),
            gte(teacherAttendance.date, format(startDate, "yyyy-MM-dd")),
            lte(teacherAttendance.date, format(endDate, "yyyy-MM-dd"))
          )
        )
        // Add a WHERE clause to select teachers of the specific school
        .where(eq(teachers.school_id, params.schoolId))
        .groupBy(teachers.id, teachers.full_name)
        .orderBy(teachers.full_name);

      // Assign the calculated and mapped data to reportData
      reportData = teacherAttendances.map((row) => ({
        ...row,
        percentage:
          totalWorkingDays > 0
            ? Math.round((row.daysPresent / totalWorkingDays) * 100)
            : 0,
      }));

      // The line "reportData = [];" has been removed.
    }
    let good = 0;
    let average = 0;
    let poor = 0;

    // Loop through the report data you just generated
    for (const record of reportData) {
      if (record.percentage >= 90) {
        good++;
      } else if (record.percentage >= 75) {
        average++;
      } else {
        poor++;
      }
    }
    // 5. Return the final report object
    return {
      data: reportData,
      summary: {
        totalWorkingDays,
        good, // <-- ADDED
        average, // <-- ADDED
        poor,
        // You can add more summary data here
      },
    };
  }

  async markMessageAsRead(
    messageId: number,
    teacherId: number
  ): Promise<boolean> {
    const [updated] = await db
      .update(messages)
      .set({ status: "read" })
      .where(
        and(eq(messages.id, messageId), eq(messages.receiver_id, teacherId))
      )
      .returning();
    return !!updated;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, insertUser.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error("User with this email already exists.");
      }

      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error("Error in createUser:", error);
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

  async getSchoolByEmail(contact_email: string): Promise<School | undefined> {
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.contact_email, contact_email));
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
      .select({
        id: teachers.id,
        user_id: teachers.user_id,
        email: teachers.email,
        school_id: teachers.school_id,
        full_name: teachers.full_name,
        gender: teachers.gender,
        joining_date: teachers.joining_date,
        phone_number: teachers.phone_number,
        status: teachers.status,
        subject_specialization: teachers.subject_specialization,
      })
      .from(teachers)
      .where(eq(teachers.school_id, schoolId));
  }

  async getTeachersByTeacherId(
    schoolId: number,
    staffId: number
  ): Promise<Teacher[]> {
    return await db
      .select({
        id: teachers.id,
        user_id: teachers.user_id,
        school_id: teachers.school_id,
        full_name: teachers.full_name,
        email: teachers.email,
        gender: teachers.gender,
        joining_date: teachers.joining_date,
        phone_number: teachers.phone_number,
        status: teachers.status,
        subject_specialization: teachers.subject_specialization,
      })
      .from(teachers)
      .where(and(eq(teachers.school_id, schoolId), eq(teachers.id, staffId)));
  }

  async getTeacherByTeacherEmail(teacherEmail: string): Promise<Teacher[]> {
    return await db
      .select()
      .from(teachers)
      .where(eq(teachers.email, teacherEmail));
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
    return await db
      .select({
        id: classes.id,
        grade: classes.grade,
        section: classes.section,
        studentCount: sql<number>`COUNT(${students.id})`.mapWith(Number),
        class_teacher_id: classes.class_teacher_id,
        class_teacher_name: classes.class_teacher_name,
      })
      .from(classSubjects)
      .innerJoin(classes, eq(classSubjects.class_id, classes.id))
      .leftJoin(students, eq(classes.id, students.class_id))
      .where(eq(classSubjects.teacher_id, teacherId))
      .groupBy(
        classes.id,
        classes.grade,
        classes.section,
        classes.class_teacher_id,
        classes.class_teacher_name
      );
  }

  //fetching classes that staff assigned as classteacher
  async getAllClassesByTeacherId(teacherId: number): Promise<Class[]> {
    return await db
      .select()
      .from(classes)
      .where(eq(classes.class_teacher_id, teacherId));
  }

  async getTeachersByClassId(classId: number): Promise<Teacher[]> {
    return await db
      // Specify the columns you want to select from the teachers table
      .selectDistinct({
        id: teachers.id,
        user_id: teachers.user_id,
        email: teachers.email,
        school_id: teachers.school_id,
        full_name: teachers.full_name,
        gender: teachers.gender,
        joining_date: teachers.joining_date,
        phone_number: teachers.phone_number,
        status: teachers.status,
        subject_specialization: teachers.subject_specialization,
      })
      .from(teachers)
      .innerJoin(classSubjects, eq(teachers.id, classSubjects.teacher_id))
      .where(eq(classSubjects.class_id, classId));
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

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    try {
      const existingStudent = await db
        .select()
        .from(students)
        .where(eq(students.student_email, insertStudent.student_email))
        .limit(1);

      if (existingStudent.length > 0) {
        throw new Error("Student with this email already exists.");
      }

      // Ensure class_id is provided
      if (!insertStudent.class_id) {
        throw new Error("class_id is required to generate roll number.");
      }

      // Fetch class details for grade and section
      const [classItem] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, insertStudent.class_id))
        .limit(1);

      if (!classItem) {
        throw new Error("Class not found for the given class_id.");
      }

      // Count existing students in the class
      const existingStudents = await db
        .select()
        .from(students)
        .where(eq(students.class_id, insertStudent.class_id));

      const count = existingStudents.length;

      // Convert section letter to number: 'a' -> 1, 'b' -> 2, etc.
      const sectionLetter = classItem.section.toLowerCase();
      const sectionNumber = sectionLetter.charCodeAt(0) - "a".charCodeAt(0) + 1;

      // Generate roll_no as grade + sectionNumber + (count + 1) padded to 2 digits
      // Assuming grade is numeric string, e.g., "9"
      const ascendingOrder = (count + 1).toString().padStart(2, "0");
      const rollNoStr = `${classItem.grade}${sectionNumber}${ascendingOrder}`;
      const rollNo = parseInt(rollNoStr);

      // Assign roll_no to insertStudent
      insertStudent.roll_no = rollNo;

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

  async createClass(insertClass: InsertClass): Promise<Class> {
    try {
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

      if (existingClass.length > 0) {
        throw new Error(
          "Class with this grade and section already exists for this school."
        );
      }

      const [classItem] = await db
        .insert(classes)
        .values(insertClass)
        .returning();

      return classItem;
    } catch (error) {
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
      const [classSubject] = await db
        .update(classSubjects)
        .set({ teacher_id: insertClassSubject.teacher_id })
        .where(eq(classSubjects.id, existing[0].id))
        .returning();
      return classSubject;
    }

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
    const dateStr = date.toISOString().split("T")[0]; // Format to YYYY-MM-DD
    return await db
      .select()
      .from(studentAttendance)
      .where(
        and(
          eq(studentAttendance.class_id, classId),
          eq(studentAttendance.date, dateStr)
        )
      );
  }

  async getStudentAttendanceBySchoolId(
    schoolId: number,
    date: Date
  ): Promise<StudentAttendance[]> {
    const dateStr = date.toISOString().split("T")[0];

    return await db
      .select({
        id: studentAttendance.id,
        student_id: studentAttendance.student_id,
        class_id: studentAttendance.class_id,
        date: studentAttendance.date,
        day: studentAttendance.day,
        status: studentAttendance.status,
        notes: studentAttendance.notes,
        roll_no: studentAttendance.roll_no,
        entry_id: students.id,
        entry_name: students.full_name,
      })
      .from(studentAttendance)
      .innerJoin(students, eq(studentAttendance.student_id, students.id))
      .where(
        and(
          eq(students.school_id, schoolId),
          eq(studentAttendance.date, dateStr)
        )
      );
  }

  // async createStudentAttendance(
  //   insertAttendance: InsertStudentAttendance
  // ): Promise<StudentAttendance> {
  //   const [attendance] = await db
  //     .insert(studentAttendance)
  //     .values(insertAttendance)
  //     .returning();
  //   return attendance;
  // }

  async createStudentAttendances(
    attendances: InsertStudentAttendance[]
  ): Promise<StudentAttendance[]> {
    const formattedAttendances = attendances.map((att) => {
      // Ensure att.date is a valid date object before formatting
      const dateObj = new Date(att.date);
      if (isNaN(dateObj.getTime())) {
        throw new Error(`Invalid date format received: "${att.date}"`);
      }
      return {
        ...att,
        date: dateObj.toISOString().split("T")[0],
      };
    });

    const newAttendances = await db
      .insert(studentAttendance)
      .values(formattedAttendances)
      .returning();
    return newAttendances;
  }

  async updateStudentAttendances(
    attendances: InsertStudentAttendance[]
  ): Promise<any[]> {
    // Use a transaction to ensure all updates are atomic (all or nothing)
    const updatedRecords = await db.transaction(async (tx) => {
      // Create an array of update promises to run them concurrently
      const updatePromises = attendances.map((record) => {
        if (!record.student_id || !record.date) {
          throw new Error("Missing student_id or date in one of the records.");
        }

        return tx
          .update(studentAttendance)
          .set({
            // Fields to update
            status: record.status,
            entry_id: record.entry_id,
            entry_name: record.entry_name,
            // You could also update a 'notes' field here if needed
            // notes: record.notes,
          })
          .where(
            // Condition to find the specific record to update
            and(
              eq(studentAttendance.student_id, record.student_id),
              eq(studentAttendance.date, record.date)
            )
          )
          .returning(); // Return the entire updated row from the database
      });

      // Wait for all update operations to complete
      return Promise.all(updatePromises);
    });

    // The result from Drizzle is an array of arrays, so we flatten it
    // into a single array of updated attendance objects.
    return updatedRecords.flat();
  }

  async updateTeacherAttendances(
    attendances: InsertTeacherAttendance[]
  ): Promise<any[]> {
    // Use a transaction to ensure all updates are atomic (all or nothing)
    const updatedRecords = await db.transaction(async (tx) => {
      // Create an array of update promises to run them concurrently
      const updatePromises = attendances.map((record) => {
        if (!record.teacher_id || !record.date) {
          throw new Error("Missing student_id or date in one of the records.");
        }

        return tx
          .update(teacherAttendance)
          .set({
            // Fields to update
            status: record.status,

            // You could also update a 'notes' field here if needed
            // notes: record.notes,
          })
          .where(
            // Condition to find the specific record to update
            and(
              eq(teacherAttendance.teacher_id, record.teacher_id),
              // FIX: Format the date to a string
              eq(
                teacherAttendance.date,
                format(new Date(record.date), "yyyy-MM-dd")
              )
            )
          )
          .returning(); // Return the entire updated row from the database
      });

      // Wait for all update operations to complete
      return Promise.all(updatePromises);
    });

    // The result from Drizzle is an array of arrays, so we flatten it
    // into a single array of updated attendance objects.
    return updatedRecords.flat();
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
    const dateStr = date.toISOString().split("T")[0]; // Format to YYYY-MM-DD
    return await db
      .select()
      .from(teacherAttendance)
      .where(
        and(
          eq(teacherAttendance.school_id, schoolId),
          eq(teacherAttendance.date, dateStr)
        )
      );
  }

  // In server/storage.ts, inside the DatabaseStorage class

  // Method to get student attendance within a date range
  async getStudentAttendanceByDateRange(filters: {
    school_id: number;
    class_id?: number;
    startDate: Date;
    endDate: Date;
  }): Promise<any[]> {
    const { school_id, class_id, startDate, endDate } = filters;

    const conditions = [
      eq(students.school_id, school_id),
      gte(studentAttendance.date, startDate.toISOString().split("T")[0]),
      lte(studentAttendance.date, endDate.toISOString().split("T")[0]),
    ];

    if (class_id) {
      conditions.push(eq(studentAttendance.class_id, class_id));
    }

    return db
      .select({
        id: studentAttendance.id,
        status: studentAttendance.status,
        date: studentAttendance.date,
        full_name: students.full_name,
        class_id: classes.id,
        grade: classes.grade,
        section: classes.section,
      })
      .from(studentAttendance)
      .innerJoin(students, eq(studentAttendance.student_id, students.id))
      .innerJoin(classes, eq(studentAttendance.class_id, classes.id))
      .where(and(...conditions));
  }

  // Method to get teacher attendance within a date range
  async getTeacherAttendanceByDateRange(filters: {
    school_id: number;
    startDate: Date;
    endDate: Date;
  }): Promise<any[]> {
    const { school_id, startDate, endDate } = filters;

    return db
      .select({
        id: teacherAttendance.id,
        status: teacherAttendance.status,
        date: teacherAttendance.date,
        full_name: teachers.full_name,
      })
      .from(teacherAttendance)
      .innerJoin(teachers, eq(teacherAttendance.teacher_id, teachers.id))
      .where(
        and(
          eq(teacherAttendance.school_id, school_id),
          gte(teacherAttendance.date, startDate.toISOString().split("T")[0]),
          lte(teacherAttendance.date, endDate.toISOString().split("T")[0])
        )
      );
  }

  async createTeacherAttendance(
    insertAttendance: InsertTeacherAttendance
  ): Promise<TeacherAttendance> {
    // Format the date to a string before inserting
    const formattedAttendance = {
      ...insertAttendance,
      date: new Date(insertAttendance.date).toISOString().split("T")[0],
    };

    const [attendance] = await db
      .insert(teacherAttendance)
      .values(formattedAttendance) // Use the formatted object
      .returning();
    return attendance;
  }

  async createTeacherAttendances(
    attendances: InsertTeacherAttendance[]
  ): Promise<TeacherAttendance[]> {
    const formattedAttendances = attendances.map((att) => {
      const dateObj = new Date(att.date);
      if (isNaN(dateObj.getTime())) {
        throw new Error(`Invalid date format received: "${att.date}"`);
      }
      return {
        ...att,
        date: dateObj.toISOString().split("T")[0],
      };
    });

    const newAttendances = await db
      .insert(teacherAttendance)
      .values(formattedAttendances)
      .returning();
    return newAttendances;
  }

  async updateTeacherAttendance(
    id: number,
    data: Partial<InsertTeacherAttendance>
  ): Promise<TeacherAttendance | undefined> {
    // Create a mutable copy of the data
    const dataToSet: { [key: string]: any } = { ...data };

    // If the update includes a date, format it
    if (data.date) {
      dataToSet.date = new Date(data.date).toISOString().split("T")[0];
    }

    const [updated] = await db
      .update(teacherAttendance)
      .set(dataToSet) // Use the object with the formatted date
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

  // Homework operations
  async getHomework(id: number): Promise<Homework | undefined> {
    const [hw] = await db.select().from(homework).where(eq(homework.id, id));
    return hw;
  }

  async getHomeworkByTeacherId(teacherId: number): Promise<Homework[]> {
    return await db
      .select()
      .from(homework)
      .where(eq(homework.teacher_id, teacherId));
  }

  async getHomeworkByClassId(classId: number): Promise<Homework[]> {
    return await db
      .select()
      .from(homework)
      .where(eq(homework.class_id, classId));
  }

  async getHomeworkList(): Promise<Homework[]> {
    return await db.select().from(homework);
  }

  async createHomework(insertHomework: InsertHomework): Promise<Homework> {
    const [hw] = await db.insert(homework).values(insertHomework).returning();
    return hw;
  }

  async updateHomework(
    id: number,
    data: Partial<InsertHomework>
  ): Promise<Homework | undefined> {
    const [updated] = await db
      .update(homework)
      .set(data)
      .where(eq(homework.id, id))
      .returning();
    return updated;
  }

  async deleteHomework(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(homework)
      .where(eq(homework.id, id))
      .returning();
    return !!deleted;
  }

  // HomeworkSubmission operations
  async getHomeworkSubmission(
    id: number
  ): Promise<HomeworkSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(homeworkSubmissions)
      .where(eq(homeworkSubmissions.id, id));
    return submission;
  }

  async getHomeworkSubmissionsByHomeworkId(
    homeworkId: number
  ): Promise<HomeworkSubmission[]> {
    return await db
      .select()
      .from(homeworkSubmissions)
      .where(eq(homeworkSubmissions.homework_id, homeworkId));
  }

  async getHomeworkSubmissionsByStudentId(
    studentId: number
  ): Promise<HomeworkSubmission[]> {
    return await db
      .select()
      .from(homeworkSubmissions)
      .where(eq(homeworkSubmissions.student_id, studentId));
  }

  async createHomeworkSubmission(
    insertSubmission: InsertHomeworkSubmission
  ): Promise<HomeworkSubmission> {
    const [submission] = await db
      .insert(homeworkSubmissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async updateHomeworkSubmission(
    id: number,
    data: Partial<InsertHomeworkSubmission>
  ): Promise<HomeworkSubmission | undefined> {
    const [updated] = await db
      .update(homeworkSubmissions)
      .set(data)
      .where(eq(homeworkSubmissions.id, id))
      .returning();
    return updated;
  }

  async deleteHomeworkSubmission(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(homeworkSubmissions)
      .where(eq(homeworkSubmissions.id, id))
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
  // async getMessage(id: number): Promise<Message | undefined> {
  //   const [message] = await db
  //     .select()
  //     .from(messages)
  //     .where(eq(messages.id, id));
  //   return message;
  // }

  // async getMessagesBySenderId(senderId: number): Promise<Message[]> {
  //   return await db
  //     .select()
  //     .from(messages)
  //     .where(eq(messages.sender_id, senderId));
  // }

  async getMessagesBySchoolId(schoolId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.school_id, schoolId));
  }

  // async getMessagesByReceiverId(
  //   receiverId: number,
  //   receiverRole: string
  // ): Promise<Message[]> {
  //   return await db
  //     .select()
  //     .from(messages)
  //     .where(
  //       and(
  //         eq(messages.receiver_id, receiverId),
  //         eq(messages.receiver_role, receiverRole)
  //       )
  //     );
  // }

  // async createMessage(insertMessage: InsertMessage): Promise<Message> {
  //   const [message] = await db
  //     .insert(messages)
  //     .values(insertMessage)
  //     .returning();
  //   return message;
  // }

  //chatgpt
  // Fetch all messages sent to a specific user
  async getMessagesForUser(userId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.receiver_id, userId));
  }

  // Accept array or single number
  async sendMessage(messageData: InsertMessage): Promise<Message[]> {
    const receiverIds = Array.isArray(messageData.receiver_id)
      ? messageData.receiver_id
      : [messageData.receiver_id];

    const valuesToInsert = receiverIds.map((id) => ({
      ...messageData,
      receiver_id: id,
    }));

    const inserted = await db
      .insert(messages)
      .values(valuesToInsert)
      .returning();

    return inserted;
  }

  // Optional: Fetch messages sent by a user
  async getMessagesSentByUser(senderId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.sender_id, senderId));
  }

  // Fetch class-based messages for a student
  async getMessagesForClass(classId: number): Promise<ClassMessage[]> {
    return await db
      .select()
      .from(classMessages)
      .where(eq(classMessages.class_id, classId));
  }

  // async updateMessage(
  //   id: number,
  //   data: Partial<InsertMessage>
  // ): Promise<Message | undefined> {
  //   const [updated] = await db
  //     .update(messages)
  //     .set(data)
  //     .where(eq(messages.id, id))
  //     .returning();
  //   return updated;
  // }

  // async deleteMessage(id: number): Promise<boolean> {
  //   const [deleted] = await db
  //     .delete(messages)
  //     .where(eq(messages.id, id))
  //     .returning();
  //   return !!deleted;
  // }

  // // ClassMessage operations
  // async getClassMessage(id: number): Promise<ClassMessage | undefined> {
  //   const [message] = await db
  //     .select()
  //     .from(classMessages)
  //     .where(eq(classMessages.id, id));
  //   return message;
  // }

  // async getClassMessagesByClassId(classId: number): Promise<ClassMessage[]> {
  //   return await db
  //     .select()
  //     .from(classMessages)
  //     .where(eq(classMessages.class_id, classId));
  // }

  // async createClassMessage(
  //   insertClassMessage: InsertClassMessage
  // ): Promise<ClassMessage> {
  //   const [message] = await db
  //     .insert(classMessages)
  //     .values(insertClassMessage)
  //     .returning();
  //   return message;
  // }

  // async updateClassMessage(
  //   id: number,
  //   data: Partial<InsertClassMessage>
  // ): Promise<ClassMessage | undefined> {
  //   const [updated] = await db
  //     .update(classMessages)
  //     .set(data)
  //     .where(eq(classMessages.id, id))
  //     .returning();
  //   return updated;
  // }

  // async deleteClassMessage(id: number): Promise<boolean> {
  //   const [deleted] = await db
  //     .delete(classMessages)
  //     .where(eq(classMessages.id, id))
  //     .returning();
  //   return !!deleted;
  // }

  // ClassLog operations
  async getClassLog(id: number): Promise<ClassLog | undefined> {
    const [classLog] = await db
      .select()
      .from(classLogs)
      .where(eq(classLogs.id, id));
    return classLog;
  }

  async getClassLogsByClassId(classId: number): Promise<ClassLog[]> {
    return await db
      .select()
      .from(classLogs)
      .where(eq(classLogs.class_id, classId));
  }

  async getClassLogsByTeacherId(teacherId: number): Promise<ClassLog[]> {
    return await db
      .select()
      .from(classLogs)
      .where(eq(classLogs.teacher_id, teacherId));
  }

  async updateClassLog(
    id: number,
    data: Partial<InsertClassLog>
  ): Promise<ClassLog | undefined> {
    const [updated] = await db
      .update(classLogs)
      .set(data)
      .where(eq(classLogs.id, id))
      .returning();
    return updated;
  }

  async createClassLog(insertClassLog: InsertClassLog): Promise<ClassLog> {
    const [classLog] = await db
      .insert(classLogs)
      .values(insertClassLog)
      .returning();
    return classLog;
  }

  async deleteClassLog(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(classLogs)
      .where(eq(classLogs.id, id))
      .returning();
    return !!deleted;
  }

  // Timetable operations
  async getTimetable(id: number): Promise<Timetable | undefined> {
    const [timetable] = await db
      .select()
      .from(timetables)
      .where(eq(timetables.id, id));
    return timetable;
  }

  async getTimetablesBySchoolId(schoolId: number): Promise<Timetable[]> {
    return await db
      .select()
      .from(timetables)
      .where(eq(timetables.school_id, schoolId));
  }

  async getTimetablesByClassId(classId: number): Promise<Timetable[]> {
    return await db
      .select()
      .from(timetables)
      .where(eq(timetables.class_id, classId));
  }

  async createTimetable(insertTimetable: InsertTimetable): Promise<Timetable> {
    const [timetable] = await db
      .insert(timetables)
      .values(insertTimetable)
      .returning();
    return timetable;
  }

  async updateTimetable(
    id: number,
    data: Partial<InsertTimetable>
  ): Promise<Timetable | undefined> {
    const [updated] = await db
      .update(timetables)
      .set(data)
      .where(eq(timetables.id, id))
      .returning();
    return updated;
  }

  async deleteTimetable(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(timetables)
      .where(eq(timetables.id, id))
      .returning();
    return !!deleted;
  }
  async getMessagesByClass(classId: number) {
    const receiverUser = alias(users, "receiverUser");

    return await db
      .select({
        id: teacher_messages.id,
        message: teacher_messages.message,
        created_at: teacher_messages.created_at,
        sender: {
          id: users.id,
          name: users.name,
          role: users.role,
        },
        receiver: {
          id: receiverUser.id,
          name: receiverUser.name,
          role: receiverUser.role,
        },
      })
      .from(teacher_messages)
      .leftJoin(users, eq(teacher_messages.sender_id, users.id))
      .leftJoin(receiverUser, eq(teacher_messages.receiver_id, receiverUser.id))
      .where(eq(users.class_id, classId)) // sender belongs to this class
      .orderBy(desc(teacher_messages.created_at));
  }

  async getMessagesWithUserInfo(schoolId: number) {
    const sender = alias(users, "sender");
    const receiver = alias(users, "receiver");

    return await db
      .select({
        id: messages.id,
        content: messages.content,
        messageType: messages.message_type,
        status: messages.status,
        createdAt: messages.created_at,

        sender: {
          id: sender.id,
          name: sender.name,
          role: sender.role,
          email: sender.email,
        },

        receiver: {
          id: receiver.id,
          name: receiver.name,
          role: receiver.role,
          email: receiver.email,
        },
      })
      .from(messages)
      .leftJoin(sender, eq(messages.sender_id, sender.id))
      .leftJoin(receiver, eq(messages.receiver_id, receiver.id))
      .where(eq(messages.school_id, schoolId))
      .orderBy(desc(messages.created_at));
  }

  // Material operations
  async getMaterials(): Promise<Material[]> {
    return await db.select().from(materials);
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const [material] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, id));
    return material;
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const [material] = await db
      .insert(materials)
      .values(insertMaterial)
      .returning();
    return material;
  }

  async updateMaterial(
    id: number,
    data: Partial<InsertMaterial>
  ): Promise<Material | undefined> {
    const [updated] = await db
      .update(materials)
      .set(data)
      .where(eq(materials.id, id))
      .returning();
    return updated;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(materials)
      .where(eq(materials.id, id))
      .returning();
    return !!deleted;
  }

  // Test operations
  async getTests(): Promise<Test[]> {
    return await db.select().from(tests);
  }

  async getTest(id: number): Promise<Test | undefined> {
    const [test] = await db.select().from(tests).where(eq(tests.id, id));
    return test;
  }

  async createTest(insertTest: InsertTest): Promise<Test> {
    const [test] = await db.insert(tests).values(insertTest).returning();
    return test;
  }

  async updateTest(
    id: number,
    data: Partial<InsertTest>
  ): Promise<Test | undefined> {
    const [updated] = await db
      .update(tests)
      .set(data)
      .where(eq(tests.id, id))
      .returning();
    return updated;
  }

  async deleteTest(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(tests)
      .where(eq(tests.id, id))
      .returning();
    return !!deleted;
  }
}

// Export a single instance of the storage class for the application to use
export const storage = new DatabaseStorage();
