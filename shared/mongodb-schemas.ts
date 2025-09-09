import mongoose, { Schema, Document } from 'mongoose';

// Interface definitions
export interface ISchool extends Document {
  name: string;
  address: string;
  contact: {
    email: string;
    phone: string;
  };
  createdAt: Date;
}

export interface IUser extends Document {
  email: string;
  password: string;
  schoolId: mongoose.Types.ObjectId;
  role: 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent';
  profile: {
    fullName: string;
    phone?: string;
    joiningDate?: Date;
    subjectSpecialization?: string[];
    dob?: Date;
  };
  classId?: mongoose.Types.ObjectId; // Only for students
}

export interface IClass extends Document {
  schoolId: mongoose.Types.ObjectId;
  grade: string;
  section: string;
  classTeacherId: mongoose.Types.ObjectId;
  subjects: Array<{
    subjectId: mongoose.Types.ObjectId;
    subjectName: string;
    teacherId: mongoose.Types.ObjectId;
  }>;
}

export interface IAcademic extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  type: 'homework' | 'test' | 'material' | 'lesson_plan';
  title: string;
  description?: string;
  assignedDate: Date;
  dueDate?: Date;
  attachmentUrl?: string;
  maxMarks?: number; // For tests
  materialType?: string; // For materials
}

export interface IAttendance extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  date: Date;
  records: Array<{
    studentId: mongoose.Types.ObjectId;
    status: 'present' | 'absent' | 'late';
  }>;
}

export interface ICommunication extends Document {
  senderId: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  recipients: Array<{
    type: 'user' | 'class' | 'role';
    id: mongoose.Types.ObjectId | string;
  }>;
}

// Schema definitions
const schoolSchema = new Schema<ISchool>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  contact: {
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  role: { 
    type: String, 
    enum: ['super_admin', 'school_admin', 'teacher', 'student', 'parent'],
    required: true 
  },
  profile: {
    fullName: { type: String, required: true },
    phone: { type: String },
    joiningDate: { type: Date },
    subjectSpecialization: [{ type: String }],
    dob: { type: Date }
  },
  classId: { type: Schema.Types.ObjectId, ref: 'Class' }
});

const classSchema = new Schema<IClass>({
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  grade: { type: String, required: true },
  section: { type: String, required: true },
  classTeacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subjects: [{
    subjectId: { type: Schema.Types.ObjectId, required: true },
    subjectName: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  }]
});

const academicSchema = new Schema<IAcademic>({
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  subjectId: { type: Schema.Types.ObjectId, required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['homework', 'test', 'material', 'lesson_plan'],
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String },
  assignedDate: { type: Date, required: true },
  dueDate: { type: Date },
  attachmentUrl: { type: String },
  maxMarks: { type: Number }, // For tests
  materialType: { type: String } // For materials
});

const attendanceSchema = new Schema<IAttendance>({
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  records: [{
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
      type: String, 
      enum: ['present', 'absent', 'late'],
      required: true 
    }
  }]
});

const communicationSchema = new Schema<ICommunication>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  recipients: [{
    type: { 
      type: String, 
      enum: ['user', 'class', 'role'],
      required: true 
    },
    id: { type: Schema.Types.Mixed, required: true }
  }]
});

// Create and export models
export const School = mongoose.model<ISchool>('School', schoolSchema);
export const User = mongoose.model<IUser>('User', userSchema);
export const Class = mongoose.model<IClass>('Class', classSchema);
export const Academic = mongoose.model<IAcademic>('Academic', academicSchema);
export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
export const Communication = mongoose.model<ICommunication>('Communication', communicationSchema);