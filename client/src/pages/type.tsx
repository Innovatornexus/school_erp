// src/types.ts
export type StudentItem = {
  id: string;
  userId: string;
  schoolId: string;
  classId: string;
  fullName: string;
  email: string;
  gender: "male" | "female" | "other";
  dateOfBirth: Date;
  parentName: string;
  parentContact: string;
  parentId?: string;
  admissionDate: Date;
  status: "Active" | "Inactive";
  address?: string;
  rollNo?: number;
};
// export type ClassItem = {
//   id: number;
//   grade: string;
//   section: string;
// };

// Shared types for the School Management System

// User and Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "school_admin" | "teacher" | "student" | "parent";
  schoolId?: string;
  createdAt: string;
  updatedAt: string;
}

// School Types
export interface School {
  id: string;
  name: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

// Class Types
export interface Class {
  id: string;
  schoolId: string;
  grade: number;
  section: string;
  academicYear: string;
  name?: string;
  classTeacherId?: string;
  studentCount?: number;
  subjects?: ClassSubjectMapping[];
  createdAt: string;
  updatedAt: string;
}

export interface ClassSubjectMapping {
  subjectId: string;
  teacherId?: string | null;
}

// Subject Types
export interface Subject {
  id: string;
  schoolId: string;
  subjectName: string;
  subjectDescription?: string;
  createdAt: string;
  updatedAt: string;
}

// Student Types
export interface Student {
  id: string;
  userId: string;
  schoolId: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  classId: string;
  parentName: string;
  parentContact: string;
  gender: "male" | "female" | "other";
  admissionDate: string;
  status: "Active" | "Inactive";
  rollNo: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy type alias for compatibility

// Teacher Types
export interface Teacher {
  id: string;
  userId: string;
  schoolId: string;
  fullName: string;
  email: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  gender?: "male" | "female" | "other";
  subjectSpecialization?: string;
  joiningDate?: string;
  status?: "Active" | "Inactive";
  subjectsTaught: string[];
  classesAssigned: string[];
  createdAt: string;
  updatedAt: string;
}

// Exam Types
export interface Exam {
  id: string;
  title: string;
  term: string;
  classId: string;
  className: string;
  schoolId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  subjectsCount?: number;
}

export interface ExamSubject {
  id: string;
  subjectId: string;
  subjectName: string;
  examDate: string;
  startTime?: string;
  endTime?: string;
  maxMarks: number;
}

export interface ExamDetails {
  id: string;
  title: string;
  term: string;
  className: string;
  startDate: string;
  endDate: string;
  subjects: ExamSubject[];
}

// Form Schemas Types (for form validation)
export interface CreateStudentForm {
  fullName: string;
  email: string;
  dateOfBirth: string;
  classId: string;
  parentName: string;
  parentContact: string;
  password?: string;
}

export interface CreateTeacherForm {
  fullName: string;
  email: string;
  dateOfBirth: string;
  subjectsTaught: string[];
  classesAssigned: string[];
  password?: string;
}

export interface CreateExamForm {
  title: string;
  term: string;
  classId: string;
  subjects: ExamSubjectForm[];
}

export interface ExamSubjectForm {
  subjectId: string;
  examDate: string;
  startTime: string;
  endTime: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Context Types
export interface SchoolDataContextType {
  schoolData: School | null;
  classes: Class[];
  subjects: Subject[];
  students: Student[];
  teachers: Teacher[];
  loading: boolean;
  fetchData: () => Promise<void>;
}
export type ClassItem = {
  id: number;
  name: string;
  grade: string;
  section: string;
  classTeacherId: number | null;
  studentCount: number;
  subjects?: Array<{
    subjectId: number;
    teacherId: number | null;
  }>;
};
export type SchoolItem = {
  id: number;
  name: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
};
export type ClassItemWithCount = {
  id: number;
  grade: string;
  section: string;
  studentCount: number; // ➡️ newly added
  classTeacherId: number | null;
};

export type SubjectItem = {
  id: number;
  schoolId: number;
  subjectName: string;
  subjectDescription: string;
};

export interface StaffItem {
  id: number;
  schoolId: number;
  fullName: string;
  email: string;
  gender: "male" | "female" | "other";
  joiningDate: Date;
  status: "Active" | "Inactive";
  address: string;
  phoneNumber: string;
  subjectSpecialization: string[];
}

export type ClassMessage = {
  id: number;
  classId: number;
  senderId: number;
  content: string;
  createdAt: Date;
};
