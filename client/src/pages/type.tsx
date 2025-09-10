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
