// Shared types for the School Management System

// User and Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent';
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

// Legacy type alias for compatibility
export type ClassItem = Class;

export interface ClassSubjectMapping {
  subjectId: string;
  teacherId?: string;
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
  gender: 'male' | 'female' | 'other';
  admissionDate: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

// Legacy type alias for compatibility
export type StudentItem = Student;

// Teacher Types  
export interface Teacher {
  id: string;
  userId: string;
  schoolId: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
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