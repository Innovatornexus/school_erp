// src/types.ts
export type StudentItem = {
  student_email: string | undefined;
  id: number;
  full_name: string;

  gender: "male" | "female" | "other";
  dob: Date;
  class_id: number;
  parent_name: string;
  parent_contact: string;
  admissionDate: Date;
  status: "Active" | "Inactive";
  address: string;
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
  class_teacher_id: number | null;
  studentCount: number;
};
export type SchoolItem = {
  id: number;
  name: string;
  address: string;
  contact_email: string;
  contact_phone: string;
};
export type ClassItemWithCount = {
  id: number;
  grade: string;
  section: string;
  studentCount: number; // ➡️ newly added
  class_teacher_id: number | null;
};

export type SubjectItem = {
  id: number;
  school_id: number;
  subject_name: string;
  subject_description: string;
};

export interface StaffItem {
  id: number;
  school_id: number;
  full_name: string;
  email: string;
  gender: "male" | "female" | "other";
  joining_date: Date;
  status: "Active" | "Inactive";
  address: string;
  phone_number: string;
  subject_specialization: string[];
}

export type ClassMessage = {
  id: number;
  class_id: number;
  sender_id: number;
  content: string;
  created_at: Date;
};
