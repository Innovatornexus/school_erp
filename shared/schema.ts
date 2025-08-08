import {
  pgTable,
  text,
  serial,
  integer,
  date,
  timestamp,
  doublePrecision,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { format } from "date-fns";

// Core user entity with authentication info
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  school_id: integer("school_id").references(() => schools.id),
  class_id: integer("class_id"),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'super_admin', 'school_admin', 'teacher', 'student', 'parent'
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

// Schools information
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  contact_email: text("contact_email").notNull(),
  contact_phone: text("contact_phone").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  created_at: true,
});

// School administrators
export const schoolAdmins = pgTable("school_admins", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  school_id: integer("school_id")
    .notNull()
    .references(() => schools.id),
  full_name: text("full_name").notNull(),
  phone_number: text("phone_number").notNull(),
});

export const insertSchoolAdminSchema = createInsertSchema(schoolAdmins).omit({
  id: true,
});

// Teachers information
export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  school_id: integer("school_id")
    .notNull()
    .references(() => schools.id),
  full_name: text("full_name").notNull(),
  email: text("email").notNull(),
  gender: text("gender").notNull(),
  joining_date: date("joining_date").notNull(),
  phone_number: text("phone_number").notNull(),
  status: text("status").notNull(),
  subject_specialization: text("subject_specialization").array().notNull(),
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
});

// Students information
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  roll_no: integer("roll_no"),
  school_id: integer("school_id")
    .notNull()
    .references(() => schools.id),
  class_id: integer("class_id").references(() => classes.id),
  full_name: text("full_name").notNull(),
  student_email: text("student_email").notNull().unique(),
  password: text("password").notNull(),
  dob: date("dob").notNull(),
  gender: text("gender").notNull(),
  admission_date: date("admission_date").notNull(),
  parent_name: text("parent_name"),
  parent_contact: text("parent_contact"),
  parent_address: text("parent_address"),
  status: text("status").notNull(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
});

// Classes information
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  school_id: integer("school_id")
    .notNull()
    .references(() => schools.id),
  grade: text("grade").notNull(),
  section: text("section").notNull(),
  class_teacher_id: integer("class_teacher_id").references(() => teachers.id),
  class_teacher_name: text("class_teacher_name"),
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
});

// Subjects information
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  school_id: integer("school_id")
    .notNull()
    .references(() => schools.id),
  subject_name: text("subject_name").notNull(),
  subject_description: text("subject_description"),
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
});

// Class-Subject mapping for teacher assignment
export const classSubjects = pgTable("class_subjects", {
  id: serial("id").primaryKey(),
  class_id: integer("class_id")
    .notNull()
    .references(() => classes.id),
  subject_id: integer("subject_id")
    .notNull()
    .references(() => subjects.id),
  teacher_id: integer("teacher_id").references(() => teachers.id),
});

export const insertClassSubjectSchema = createInsertSchema(classSubjects).omit({
  id: true,
});

// Teacher-Subject mapping
export const teacherSubjects = pgTable("teacher_subjects", {
  id: serial("id").primaryKey(),
  teacher_id: integer("teacher_id")
    .notNull()
    .references(() => teachers.id),
  subject_id: integer("subject_id")
    .notNull()
    .references(() => subjects.id),
});

export const insertTeacherSubjectSchema = createInsertSchema(
  teacherSubjects
).omit({
  id: true,
});

// Student attendance records
export const studentAttendance = pgTable("student_attendance", {
  id: serial("id").primaryKey(),
  student_id: integer("student_id")
    .notNull()
    .references(() => students.id),
  class_id: integer("class_id")
    .notNull()
    .references(() => classes.id),
  roll_no: integer("roll_no"),
  date: date("date").notNull(),
  day: text("day").notNull(),
  status: text("status").notNull(), // 'present', 'absent', 'late'
  entry_id: integer("entry_id")
    .notNull()
    .references(() => users.id),
  entry_name: text("entry_name").notNull(),
  notes: text("notes"),
});

export const studentAttendanceApiSchema = z.object({
  id: z.number(), // required for update
  student_id: z.number(),
  class_id: z.number(),
  date: z.string(),
  day: z.string(),
  status: z.enum(["present", "absent", "late"]),
  notes: z.string().nullable().optional(),
});
export const updateStudentAttendanceApiSchema = z.object({
  student_id: z.number(),
  class_id: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Validates 'YYYY-MM-DD' format
  day: z.string(),
  status: z.enum(["present", "absent", "late"]),
});

export const updateTeacherAttendanceApiSchema = z.object({
  teacher_id: z.number(),
  school_id: z.number(),
  teacher_name: z.string(),

  // FIX: Add this preprocess block to convert the string to a Date object
  date: z.preprocess(
    (val) =>
      val instanceof Date || typeof val === "string"
        ? new Date(val)
        : undefined,
    z.date()
  ),

  day: z.string(),
  status: z.enum(["present", "absent", "leave"]),
});

// In your schema file (e.g., db/schema.ts)
export const holidays = pgTable(
  "holidays",
  {
    id: serial("id").primaryKey(),
    school_id: integer("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    name: text("name").notNull(), // e.g., "Diwali", "Summer Vacation", "Sunday"
  },
  (table) => {
    return {
      // Ensure a school can't have the same holiday date twice
      unq: unique().on(table.school_id, table.date),
    };
  }
);

// Schema for adding a list of holidays
export const addHolidaysSchema = z.object({
  year: z.number().int().positive(),
  // Expecting dates in "YYYY-MM-DD" format
  holidays: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      name: z.string().min(1),
    })
  ),
});

// Schema for validating report generation query parameters
export const generateReportQuerySchema = z.object({
  reportType: z.enum(["student", "teacher"]),
  periodType: z.enum(["month", "year"]),
  year: z
    .string()
    .regex(/^\d{4}$/)
    .transform(Number), // Convert year string to number
  month: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)), // Optional month string to number
  classId: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)), // Optional classId string to number
});
// schema for data received from frontend
export const studentAttendanceInputSchema = z.object({
  student_id: z.number(),
  class_id: z.number(),
  roll_no: z.number().optional(),
  date: z.preprocess(
    (val) =>
      typeof val === "string"
        ? val
        : val instanceof Date
        ? format(val, "yyyy-MM-dd")
        : undefined,
    z.string()
  ),
  day: z.string(),
  status: z.enum(["present", "absent", "late"]),
  notes: z.string().optional(),
});
export const insertStudentAttendanceSchema =
  studentAttendanceInputSchema.extend({
    entry_id: z.number(),
    entry_name: z.string().min(1, "Entry name is required"),
  });

// Teacher attendance records
export const teacherAttendance = pgTable("teacher_attendance", {
  id: serial("id").primaryKey(),
  teacher_id: integer("teacher_id")
    .notNull()
    .references(() => teachers.id),
  teacher_name: text("teacher_name").notNull(),

  school_id: integer("school_id")
    .notNull()
    .references(() => schools.id),
  date: date("date").notNull(),
  day: text("day").notNull(),
  status: text("status").notNull(), // 'present', 'absent', 'leave'
});

export const insertTeacherAttendanceSchema = z.object({
  teacher_id: z.number(),
  school_id: z.number(),
  teacher_name: z.string(),
  // FIX: This preprocess block correctly handles incoming strings or Date objects
  // and ensures the final parsed type is a Date object.
  date: z.preprocess(
    (val) =>
      val instanceof Date || typeof val === "string"
        ? new Date(val)
        : undefined,
    z.date()
  ),
  day: z.string(),
  status: z.enum(["present", "absent", "leave"]),
});

// Weekly lesson plans submitted by teachers
export const lessonPlans = pgTable("lesson_plans", {
  id: serial("id").primaryKey(),
  teacher_id: integer("teacher_id")
    .notNull()
    .references(() => teachers.id),
  class_id: integer("class_id")
    .notNull()
    .references(() => classes.id),
  subject_id: integer("subject_id")
    .notNull()
    .references(() => subjects.id),
  week_start_date: date("week_start_date").notNull(),
  plan_content: text("plan_content").notNull(),
  status: text("status").notNull(), // 'draft', 'submitted', 'approved', 'rejected'
});

export const insertLessonPlanSchema = createInsertSchema(lessonPlans).omit({
  id: true,
});

// Assignments created by teachers
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  teacher_id: integer("teacher_id")
    .notNull()
    .references(() => teachers.id),
  class_id: integer("class_id")
    .notNull()
    .references(() => classes.id),
  subject_id: integer("subject_id")
    .notNull()
    .references(() => subjects.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  due_date: date("due_date").notNull(),
  attachment_url: text("attachment_url"),
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
});

// Assignment submissions by students
export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: serial("id").primaryKey(),
  assignment_id: integer("assignment_id")
    .notNull()
    .references(() => assignments.id),
  student_id: integer("student_id")
    .notNull()
    .references(() => students.id),
  submission_date: timestamp("submission_date").defaultNow().notNull(),
  content: text("content").notNull(),
  grade: text("grade"),
  feedback: text("feedback"),
});

export const insertAssignmentSubmissionSchema = createInsertSchema(
  assignmentSubmissions
).omit({
  id: true,
  submission_date: true,
});

// Exams information
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  school_id: integer("school_id")
    .notNull()
    .references(() => schools.id),
  title: text("title").notNull(),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  term: text("term").notNull(),
  class_id: integer("class_id")
    .notNull()
    .references(() => classes.id),
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
});

// Exam subjects details
export const examSubjects = pgTable("exam_subjects", {
  id: serial("id").primaryKey(),
  exam_id: integer("exam_id")
    .notNull()
    .references(() => exams.id),
  subject_id: integer("subject_id")
    .notNull()
    .references(() => subjects.id),
  exam_date: date("exam_date").notNull(),
  max_marks: integer("max_marks").notNull(),
});

export const insertExamSubjectSchema = createInsertSchema(examSubjects).omit({
  id: true,
});

// Student marks in exams
export const marks = pgTable("marks", {
  id: serial("id").primaryKey(),
  student_id: integer("student_id")
    .notNull()
    .references(() => students.id),
  exam_subject_id: integer("exam_subject_id")
    .notNull()
    .references(() => examSubjects.id),
  marks_obtained: doublePrecision("marks_obtained").notNull(),
});

export const insertMarkSchema = createInsertSchema(marks).omit({
  id: true,
});

// Fee structure by class and term
export const feeStructures = pgTable("fee_structures", {
  id: serial("id").primaryKey(),
  school_id: integer("school_id")
    .notNull()
    .references(() => schools.id),
  class_id: integer("class_id")
    .notNull()
    .references(() => classes.id),
  term: text("term").notNull(),
  amount: doublePrecision("amount").notNull(),
});

export const insertFeeStructureSchema = createInsertSchema(feeStructures).omit({
  id: true,
});

// Fee payments by students
export const feePayments = pgTable("fee_payments", {
  id: serial("id").primaryKey(),
  student_id: integer("student_id")
    .notNull()
    .references(() => students.id),
  amount_paid: doublePrecision("amount_paid").notNull(),
  payment_date: date("payment_date").notNull(),
  receipt_url: text("receipt_url"),
  term: text("term").notNull(),
  status: text("status").notNull(), // 'paid', 'pending', 'overdue'
});

export const insertFeePaymentSchema = createInsertSchema(feePayments).omit({
  id: true,
});

// School bills management
export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  school_id: integer("school_id")
    .notNull()
    .references(() => schools.id),
  title: text("title").notNull(),
  amount: doublePrecision("amount").notNull(),
  bill_month: text("bill_month").notNull(),
  category: text("category").notNull(), // 'electricity', 'water', 'salaries', etc.
  upload_url: text("upload_url"),
  status: text("status").notNull(), // 'paid', 'pending', 'overdue'
});

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
});

// Messages for communication
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sender_id: integer("sender_id").notNull(),
  sender_role: text("sender_role"),
  receiver_role: text("receiver_role"), // e.g., 'student', 'teacher', etc.
  receiver_id: integer("receiver_id"), // null for role-based broadcast
  school_id: integer("school_id").notNull(),
  message_type: text("message_type").notNull(), // e.g., 'announcement', 'direct'
  content: text("content").notNull(),
  status: text("status").default("unread"), // optional column
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow(),
});

export const teacher_messages = pgTable("teacher_messages", {
  id: serial("id").primaryKey(),
  sender_id: integer("sender_id").references(() => users.id),
  receiver_id: integer("receiver_id").references(() => users.id),
  message: text("message").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
export const messageTargets = pgTable("message_targets", {
  id: serial("id").primaryKey(),
  message_id: integer("message_id")
    .notNull()
    .references(() => messages.id),
  target_type: text("target_type").notNull(), // 'user', 'class', 'subject', 'role'
  target_id: integer("target_id"), // nullable for 'role'
});
export const messageReads = pgTable("message_reads", {
  id: serial("id").primaryKey(),
  message_id: integer("message_id").references(() => messages.id),
  user_id: integer("user_id").references(() => users.id),
  read_at: timestamp("read_at"),
});

export const insertMessageSchema = z.object({
  sender_id: z.number(),
  sender_role: z.string(),
  receiver_role: z.string().nullable(),
  receiver_id: z.union([z.number(), z.array(z.number())]), // <-- updated
  school_id: z.number(),
  message_type: z.string(),
  content: z.string(),
  status: z.string().nullable().default("unread"),
});

// Class-specific messages
export const classMessages = pgTable("class_messages", {
  id: serial("id").primaryKey(),
  class_id: integer("class_id")
    .notNull()
    .references(() => classes.id),
  sender_id: integer("sender_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertClassMessageSchema = createInsertSchema(classMessages).omit({
  id: true,
  created_at: true,
});

// Class logs for subject covered updates
export const classLogs = pgTable("class_logs", {
  id: serial("id").primaryKey(),
  class_id: integer("class_id")
    .notNull()
    .references(() => classes.id),
  teacher_id: integer("teacher_id")
    .notNull()
    .references(() => teachers.id),
  subject_id: integer("subject_id")
    .notNull()
    .references(() => subjects.id),
  log_date: date("log_date").notNull(),
  covered_topics: text("covered_topics").notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertClassLogSchema = createInsertSchema(classLogs).omit({
  id: true,
  created_at: true,
});

// Timetable management
export const timetables = pgTable("timetables", {
  id: serial("id").primaryKey(),
  school_id: integer("school_id")
    .notNull()
    .references(() => schools.id),
  class_id: integer("class_id")
    .notNull()
    .references(() => classes.id),
  image_url: text("image_url").notNull(),
  upload_date: date("upload_date").defaultNow().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertTimetableSchema = createInsertSchema(timetables).omit({
  id: true,
  created_at: true,
});

// Export new types
export type ClassLog = typeof classLogs.$inferSelect;
export type InsertClassLog = z.infer<typeof insertClassLogSchema>;

export type Timetable = typeof timetables.$inferSelect;
export type InsertTimetable = z.infer<typeof insertTimetableSchema>;

// Export types for use in the application
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;

export type SchoolAdmin = typeof schoolAdmins.$inferSelect;
export type InsertSchoolAdmin = z.infer<typeof insertSchoolAdminSchema>;

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type ClassSubject = typeof classSubjects.$inferSelect;
export type InsertClassSubject = z.infer<typeof insertClassSubjectSchema>;

export type StudentAttendance = typeof studentAttendance.$inferSelect;
export type InsertStudentAttendance = z.infer<
  typeof insertStudentAttendanceSchema
>;

export type TeacherAttendance = typeof teacherAttendance.$inferSelect;
export type InsertTeacherAttendance = z.infer<
  typeof insertTeacherAttendanceSchema
>;

export type LessonPlan = typeof lessonPlans.$inferSelect;
export type InsertLessonPlan = z.infer<typeof insertLessonPlanSchema>;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type InsertAssignmentSubmission = z.infer<
  typeof insertAssignmentSubmissionSchema
>;

export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;

export type ExamSubject = typeof examSubjects.$inferSelect;
export type InsertExamSubject = z.infer<typeof insertExamSubjectSchema>;

export type Mark = typeof marks.$inferSelect;
export type InsertMark = z.infer<typeof insertMarkSchema>;

export type FeeStructure = typeof feeStructures.$inferSelect;
export type InsertFeeStructure = z.infer<typeof insertFeeStructureSchema>;

export type FeePayment = typeof feePayments.$inferSelect;
export type InsertFeePayment = z.infer<typeof insertFeePaymentSchema>;

export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type ClassMessage = typeof classMessages.$inferSelect;
export type InsertClassMessage = z.infer<typeof insertClassMessageSchema>;
