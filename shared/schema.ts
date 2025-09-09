import mongoose, { Schema, Document } from 'mongoose';
import { z } from "zod";

// MongoDB Schema Definitions

// User Schema
export interface IUser extends Document {
  school_id?: mongoose.Types.ObjectId;
  class_id?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent';
  created_at: Date;
}

const userSchema = new Schema<IUser>({
  school_id: { type: Schema.Types.ObjectId, ref: 'School' },
  class_id: { type: Schema.Types.ObjectId, ref: 'Class' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['super_admin', 'school_admin', 'teacher', 'student', 'parent']
  },
  created_at: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>('User', userSchema);

// School Schema
export interface ISchool extends Document {
  name: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  created_at: Date;
}

const schoolSchema = new Schema<ISchool>({
  name: { type: String, required: true },
  address: { type: String, default: "" },
  contact_email: { type: String, required: true },
  contact_phone: { type: String, default: "" },
  created_at: { type: Date, default: Date.now }
});

export const School = mongoose.model<ISchool>('School', schoolSchema);

// School Admin Schema
export interface ISchoolAdmin extends Document {
  user_id: mongoose.Types.ObjectId;
  school_id: mongoose.Types.ObjectId;
  full_name: string;
  phone_number: string;
}

const schoolAdminSchema = new Schema<ISchoolAdmin>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  school_id: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  full_name: { type: String, required: true },
  phone_number: { type: String, required: true }
});

export const SchoolAdmin = mongoose.model<ISchoolAdmin>('SchoolAdmin', schoolAdminSchema);

// Teacher Schema
export interface ITeacher extends Document {
  user_id: mongoose.Types.ObjectId;
  school_id: mongoose.Types.ObjectId;
  full_name: string;
  email: string;
  gender: string;
  joining_date: Date;
  phone_number: string;
  status: string;
  subject_specialization?: string[];
}

const teacherSchema = new Schema<ITeacher>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  school_id: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  full_name: { type: String, required: true },
  email: { type: String, required: true },
  gender: { type: String, required: true },
  joining_date: { type: Date, required: true },
  phone_number: { type: String, required: true },
  status: { type: String, required: true },
  subject_specialization: [{ type: String }]
});

export const Teacher = mongoose.model<ITeacher>('Teacher', teacherSchema);

// Student Schema
export interface IStudent extends Document {
  user_id: mongoose.Types.ObjectId;
  roll_no?: number;
  school_id: mongoose.Types.ObjectId;
  class_id?: mongoose.Types.ObjectId;
  full_name: string;
  student_email: string;
  password: string;
  dob: Date;
  gender: string;
  admission_date: Date;
  parent_name?: string;
  parent_contact?: string;
  parent_address?: string;
  status: string;
}

const studentSchema = new Schema<IStudent>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  roll_no: { type: Number },
  school_id: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  class_id: { type: Schema.Types.ObjectId, ref: 'Class' },
  full_name: { type: String, required: true },
  student_email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  admission_date: { type: Date, required: true },
  parent_name: { type: String },
  parent_contact: { type: String },
  parent_address: { type: String },
  status: { type: String, required: true }
});

export const Student = mongoose.model<IStudent>('Student', studentSchema);

// Class Schema
export interface IClass extends Document {
  school_id: mongoose.Types.ObjectId;
  grade: string;
  section: string;
  class_teacher_id?: mongoose.Types.ObjectId;
  class_teacher_name?: string;
}

const classSchema = new Schema<IClass>({
  school_id: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  grade: { type: String, required: true },
  section: { type: String, required: true },
  class_teacher_id: { type: Schema.Types.ObjectId, ref: 'Teacher' },
  class_teacher_name: { type: String }
});

export const Class = mongoose.model<IClass>('Class', classSchema);

// Subject Schema
export interface ISubject extends Document {
  school_id: mongoose.Types.ObjectId;
  subject_name: string;
  subject_description?: string;
}

const subjectSchema = new Schema<ISubject>({
  school_id: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  subject_name: { type: String, required: true },
  subject_description: { type: String }
});

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);

// Class Subject Schema
export interface IClassSubject extends Document {
  class_id: mongoose.Types.ObjectId;
  subject_id: mongoose.Types.ObjectId;
  teacher_id?: mongoose.Types.ObjectId;
}

const classSubjectSchema = new Schema<IClassSubject>({
  class_id: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher_id: { type: Schema.Types.ObjectId, ref: 'Teacher' }
});

export const ClassSubject = mongoose.model<IClassSubject>('ClassSubject', classSubjectSchema);

// Teacher Subject Schema
export interface ITeacherSubject extends Document {
  teacher_id: mongoose.Types.ObjectId;
  subject_id: mongoose.Types.ObjectId;
}

const teacherSubjectSchema = new Schema<ITeacherSubject>({
  teacher_id: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true }
});

export const TeacherSubject = mongoose.model<ITeacherSubject>('TeacherSubject', teacherSubjectSchema);

// Student Attendance Schema
export interface IStudentAttendance extends Document {
  student_id: mongoose.Types.ObjectId;
  class_id: mongoose.Types.ObjectId;
  roll_no?: number;
  date: Date;
  day: string;
  status: 'present' | 'absent' | 'late';
  entry_id: mongoose.Types.ObjectId;
  entry_name: string;
  notes?: string;
}

const studentAttendanceSchema = new Schema<IStudentAttendance>({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  class_id: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  roll_no: { type: Number },
  date: { type: Date, required: true },
  day: { type: String, required: true },
  status: { type: String, required: true, enum: ['present', 'absent', 'late'] },
  entry_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  entry_name: { type: String, required: true },
  notes: { type: String }
});

export const StudentAttendance = mongoose.model<IStudentAttendance>('StudentAttendance', studentAttendanceSchema);

// Teacher Attendance Schema
export interface ITeacherAttendance extends Document {
  teacher_id: mongoose.Types.ObjectId;
  teacher_name: string;
  school_id: mongoose.Types.ObjectId;
  date: Date;
  day: string;
  status: 'present' | 'absent' | 'leave';
}

const teacherAttendanceSchema = new Schema<ITeacherAttendance>({
  teacher_id: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  teacher_name: { type: String, required: true },
  school_id: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  date: { type: Date, required: true },
  day: { type: String, required: true },
  status: { type: String, required: true, enum: ['present', 'absent', 'leave'] }
});

export const TeacherAttendance = mongoose.model<ITeacherAttendance>('TeacherAttendance', teacherAttendanceSchema);

// Exam Schema
export interface IExam extends Document {
  school_id: mongoose.Types.ObjectId;
  title: string;
  start_date: Date;
  end_date: Date;
  term: string;
  class_id: mongoose.Types.ObjectId;
  class_name?: string;
}

const examSchema = new Schema<IExam>({
  school_id: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  term: { type: String, required: true },
  class_id: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  class_name: { type: String }
});

export const Exam = mongoose.model<IExam>('Exam', examSchema);

// Message Schema
export interface IMessage extends Document {
  sender_id: number;
  sender_role?: string;
  receiver_role?: string;
  receiver_id?: number;
  school_id: number;
  message_type: string;
  content: string;
  status?: string;
  created_at: Date;
}

const messageSchema = new Schema<IMessage>({
  sender_id: { type: Number, required: true },
  sender_role: { type: String },
  receiver_role: { type: String },
  receiver_id: { type: Number },
  school_id: { type: Number, required: true },
  message_type: { type: String, required: true },
  content: { type: String, required: true },
  status: { type: String, default: "unread" },
  created_at: { type: Date, default: Date.now }
});

export const Message = mongoose.model<IMessage>('Message', messageSchema);

// Homework Schema
export interface IHomework extends Document {
  teacher_id: mongoose.Types.ObjectId;
  teacher_name?: string;
  school_id: mongoose.Types.ObjectId;
  class_id: mongoose.Types.ObjectId;
  class_name?: string;
  subject_id: mongoose.Types.ObjectId;
  subject_name?: string;
  title: string;
  description: string;
  assigned_date: Date;
  due_date: Date;
  instructions?: string;
  attachment_url?: string;
  status?: string;
  created_at: Date;
}

const homeworkSchema = new Schema<IHomework>({
  teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teacher_name: { type: String },
  school_id: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  class_id: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  class_name: { type: String },
  subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  subject_name: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  assigned_date: { type: Date, required: true },
  due_date: { type: Date, required: true },
  instructions: { type: String },
  attachment_url: { type: String },
  status: { type: String, default: "active" },
  created_at: { type: Date, default: Date.now }
});

export const Homework = mongoose.model<IHomework>('Homework', homeworkSchema);

// Material Schema
export interface IMaterial extends Document {
  teacher_id: mongoose.Types.ObjectId;
  teacher_name?: string;
  class_id: mongoose.Types.ObjectId;
  class_name?: string;
  subject_id: mongoose.Types.ObjectId;
  subject_name?: string;
  title: string;
  description: string;
  material_type: 'notes' | 'presentation' | 'video' | 'document' | 'link';
  file_url?: string;
  content?: string;
  created_at: Date;
}

const materialSchema = new Schema<IMaterial>({
  teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teacher_name: { type: String },
  class_id: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  class_name: { type: String },
  subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  subject_name: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  material_type: { 
    type: String, 
    required: true,
    enum: ['notes', 'presentation', 'video', 'document', 'link']
  },
  file_url: { type: String },
  content: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const Material = mongoose.model<IMaterial>('Material', materialSchema);

// Test Schema
export interface ITest extends Document {
  teacher_id: mongoose.Types.ObjectId;
  teacher_name?: string;
  class_id: mongoose.Types.ObjectId;
  class_name?: string;
  subject_id: mongoose.Types.ObjectId;
  subject_name?: string;
  title: string;
  description: string;
  test_date: Date;
  duration: number;
  max_marks: number;
  test_type: 'quiz' | 'unit_test' | 'class_test' | 'mock_exam';
  created_at: Date;
}

const testSchema = new Schema<ITest>({
  teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teacher_name: { type: String },
  class_id: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  class_name: { type: String },
  subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  subject_name: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  test_date: { type: Date, required: true },
  duration: { type: Number, required: true },
  max_marks: { type: Number, required: true },
  test_type: { 
    type: String, 
    required: true,
    enum: ['quiz', 'unit_test', 'class_test', 'mock_exam']
  },
  created_at: { type: Date, default: Date.now }
});

export const Test = mongoose.model<ITest>('Test', testSchema);

// Zod Validation Schemas
export const insertUserSchema = z.object({
  school_id: z.string().optional(),
  class_id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['super_admin', 'school_admin', 'teacher', 'student', 'parent'])
});

export const insertSchoolSchema = z.object({
  name: z.string().min(1),
  address: z.string().default(""),
  contact_email: z.string().email(),
  contact_phone: z.string().default("")
});

export const insertSchoolAdminSchema = z.object({
  user_id: z.string(),
  school_id: z.string(),
  full_name: z.string().min(1),
  phone_number: z.string()
});

export const insertTeacherSchema = z.object({
  user_id: z.string(),
  school_id: z.string(),
  full_name: z.string().min(1),
  email: z.string().email(),
  gender: z.string(),
  joining_date: z.date(),
  phone_number: z.string(),
  status: z.string(),
  subject_specialization: z.array(z.string()).optional()
});

export const insertStudentSchema = z.object({
  user_id: z.string(),
  roll_no: z.number().optional(),
  school_id: z.string(),
  class_id: z.string().optional(),
  full_name: z.string().min(1),
  student_email: z.string().email(),
  password: z.string().min(6),
  dob: z.date(),
  gender: z.string(),
  admission_date: z.date(),
  parent_name: z.string().optional(),
  parent_contact: z.string().optional(),
  parent_address: z.string().optional(),
  status: z.string()
});

export const insertClassSchema = z.object({
  school_id: z.string(),
  grade: z.string().min(1),
  section: z.string().min(1),
  class_teacher_id: z.string().optional(),
  class_teacher_name: z.string().optional()
});

export const insertSubjectSchema = z.object({
  school_id: z.string(),
  subject_name: z.string().min(1),
  subject_description: z.string().optional()
});

export const insertClassSubjectSchema = z.object({
  class_id: z.string(),
  subject_id: z.string(),
  teacher_id: z.string().optional()
});

export const insertTeacherSubjectSchema = z.object({
  teacher_id: z.string(),
  subject_id: z.string()
});

export const insertHomeworkSchema = z.object({
  teacher_id: z.string(),
  teacher_name: z.string().optional(),
  school_id: z.string(),
  class_id: z.string(),
  class_name: z.string().optional(),
  subject_id: z.string(),
  subject_name: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  assigned_date: z.date(),
  due_date: z.date(),
  instructions: z.string().optional(),
  attachment_url: z.string().optional(),
  status: z.string().optional()
});

export const insertMaterialSchema = z.object({
  teacher_id: z.string(),
  teacher_name: z.string().optional(),
  class_id: z.string(),
  class_name: z.string().optional(),
  subject_id: z.string(),
  subject_name: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  material_type: z.enum(['notes', 'presentation', 'video', 'document', 'link']),
  file_url: z.string().optional(),
  content: z.string().optional()
});

export const insertTestSchema = z.object({
  teacher_id: z.string(),
  teacher_name: z.string().optional(),
  class_id: z.string(),
  class_name: z.string().optional(),
  subject_id: z.string(),
  subject_name: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  test_date: z.date(),
  duration: z.number().positive(),
  max_marks: z.number().positive(),
  test_type: z.enum(['quiz', 'unit_test', 'class_test', 'mock_exam'])
});

export const insertExamSchema = z.object({
  school_id: z.string(),
  title: z.string().min(1),
  start_date: z.date(),
  end_date: z.date(),
  term: z.string().min(1),
  class_id: z.string(),
  class_name: z.string().optional()
});

export const insertMessageSchema = z.object({
  sender_id: z.number(),
  sender_role: z.string(),
  receiver_role: z.string().nullable(),
  receiver_id: z.union([z.number(), z.array(z.number())]),
  school_id: z.number(),
  message_type: z.string(),
  content: z.string(),
  status: z.string().nullable().default("unread")
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type InsertSchoolAdmin = z.infer<typeof insertSchoolAdminSchema>;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type InsertClassSubject = z.infer<typeof insertClassSubjectSchema>;
export type InsertTeacherSubject = z.infer<typeof insertTeacherSubjectSchema>;
export type InsertHomework = z.infer<typeof insertHomeworkSchema>;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type InsertTest = z.infer<typeof insertTestSchema>;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;