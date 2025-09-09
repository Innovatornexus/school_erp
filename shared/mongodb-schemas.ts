import mongoose, { Schema, Document } from 'mongoose';
import { z } from "zod";

// MongoDB Schema Definitions with camelCase naming

// User Schema
export interface IUser extends Document {
  schoolId?: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent';
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
  classId: { type: Schema.Types.ObjectId, ref: 'Class' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['super_admin', 'school_admin', 'teacher', 'student', 'parent']
  },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>('User', userSchema);

// School Schema
export interface ISchool extends Document {
  name: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: Date;
}

const schoolSchema = new Schema<ISchool>({
  name: { type: String, required: true },
  address: { type: String, default: "" },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export const School = mongoose.model<ISchool>('School', schoolSchema);

// School Admin Schema
export interface ISchoolAdmin extends Document {
  userId: mongoose.Types.ObjectId;
  schoolId: mongoose.Types.ObjectId;
  fullName: string;
  phoneNumber: string;
}

const schoolAdminSchema = new Schema<ISchoolAdmin>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  fullName: { type: String, required: true },
  phoneNumber: { type: String, default: "" }
});

export const SchoolAdmin = mongoose.model<ISchoolAdmin>('SchoolAdmin', schoolAdminSchema);

// Teacher Schema
export interface ITeacher extends Document {
  userId: mongoose.Types.ObjectId;
  schoolId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  gender: string;
  joiningDate: Date;
  phoneNumber: string;
  status: string;
  subjectSpecialization?: string[];
}

const teacherSchema = new Schema<ITeacher>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  gender: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  phoneNumber: { type: String, required: true },
  status: { type: String, required: true },
  subjectSpecialization: [{ type: String }]
});

export const Teacher = mongoose.model<ITeacher>('Teacher', teacherSchema);

// Subject Schema
export interface ISubject extends Document {
  schoolId: mongoose.Types.ObjectId;
  subjectName: string;
  subjectDescription?: string;
}

const subjectSchema = new Schema<ISubject>({
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  subjectName: { type: String, required: true },
  subjectDescription: { type: String }
});

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);

// Class Schema
export interface IClass extends Document {
  schoolId: mongoose.Types.ObjectId;
  grade: string;
  section: string;
  classTeacherId?: mongoose.Types.ObjectId;
  classTeacherName?: string;
}

const classSchema = new Schema<IClass>({
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  grade: { type: String, required: true },
  section: { type: String, required: true },
  classTeacherId: { type: Schema.Types.ObjectId, ref: 'Teacher' },
  classTeacherName: { type: String }
});

export const Class = mongoose.model<IClass>('Class', classSchema);

// Zod Validation Schemas (camelCase)
export const insertUserSchema = z.object({
  schoolId: z.string().optional(),
  classId: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['super_admin', 'school_admin', 'teacher', 'student', 'parent'])
});

export const insertSchoolSchema = z.object({
  name: z.string().min(1),
  address: z.string().default(""),
  contactEmail: z.string().email(),
  contactPhone: z.string().default("")
});

export const insertSchoolAdminSchema = z.object({
  userId: z.string(),
  schoolId: z.string(),
  fullName: z.string().min(1),
  phoneNumber: z.string().default("")
});

export const insertTeacherSchema = z.object({
  userId: z.string(),
  schoolId: z.string(),
  fullName: z.string().min(1),
  email: z.string().email(),
  gender: z.string(),
  joiningDate: z.date(),
  phoneNumber: z.string(),
  status: z.string(),
  subjectSpecialization: z.array(z.string()).optional()
});

export const insertClassSchema = z.object({
  schoolId: z.string(),
  grade: z.string().min(1),
  section: z.string().min(1),
  classTeacherId: z.string().optional(),
  classTeacherName: z.string().optional()
});

export const insertSubjectSchema = z.object({
  schoolId: z.string(),
  subjectName: z.string().min(1),
  subjectDescription: z.string().optional()
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type InsertSchoolAdmin = z.infer<typeof insertSchoolAdminSchema>;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;