import mongoose from 'mongoose';
import { 
  School, User, Class, Academic, Attendance, Communication,
  ISchool, IUser, IClass, IAcademic, IAttendance, ICommunication 
} from '../shared/mongodb-schemas';
import session from 'express-session';
import MemoryStore from 'memorystore';

// Create memory store for sessions
const SessionStore = MemoryStore(session);

export class MongoDBStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new SessionStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: string): Promise<IUser | null> {
    return await User.findById(id).exec();
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email }).exec();
  }

  async getUserByUsername(username: string): Promise<IUser | null> {
    return this.getUserByEmail(username);
  }

  async createUser(userData: {
    email: string;
    password: string;
    role: 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent';
    name: string;
    schoolId?: string;
  }): Promise<IUser> {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error("User with this email already exists.");
    }

    // For super_admin, we might not have a schoolId initially
    const defaultSchoolId = userData.schoolId || new mongoose.Types.ObjectId().toString();

    const newUser = new User({
      email: userData.email,
      password: userData.password,
      schoolId: new mongoose.Types.ObjectId(defaultSchoolId),
      role: userData.role,
      profile: {
        fullName: userData.name,
      },
    });

    return await newUser.save();
  }

  async updateUser(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id).exec();
    return !!result;
  }

  // School operations
  async getSchool(id: string): Promise<ISchool | null> {
    return await School.findById(id).exec();
  }

  async getSchoolByEmail(contactEmail: string): Promise<ISchool | null> {
    return await School.findOne({ 'contact.email': contactEmail }).exec();
  }

  async getSchools(): Promise<ISchool[]> {
    return await School.find({}).exec();
  }

  async createSchool(schoolData: {
    name: string;
    address: string;
    contact_email: string;
    contact_phone: string;
  }): Promise<ISchool> {
    const newSchool = new School({
      name: schoolData.name,
      address: schoolData.address,
      contact: {
        email: schoolData.contact_email,
        phone: schoolData.contact_phone,
      },
    });

    return await newSchool.save();
  }

  async updateSchool(id: string, data: Partial<ISchool>): Promise<ISchool | null> {
    return await School.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteSchool(id: string): Promise<boolean> {
    const result = await School.findByIdAndDelete(id).exec();
    return !!result;
  }

  // SchoolAdmin operations (using User collection with role filtering)
  async getSchoolAdminByUserId(userId: string): Promise<IUser | null> {
    return await User.findOne({ _id: userId, role: 'school_admin' }).exec();
  }

  async getSchoolAdminsBySchoolId(schoolId: string): Promise<IUser[]> {
    return await User.find({ schoolId: new mongoose.Types.ObjectId(schoolId), role: 'school_admin' }).exec();
  }

  async createSchoolAdmin(data: {
    user_id: string;
    school_id: string;
    full_name: string;
    phone_number: string;
  }): Promise<IUser | null> {
    // Update the existing user to set their school and profile info
    return await User.findByIdAndUpdate(
      data.user_id,
      {
        schoolId: new mongoose.Types.ObjectId(data.school_id),
        'profile.fullName': data.full_name,
        'profile.phone': data.phone_number,
      },
      { new: true }
    ).exec();
  }

  // Teacher operations (using User collection with role filtering)
  async getTeacherByUserId(userId: string): Promise<IUser | null> {
    return await User.findOne({ _id: userId, role: 'teacher' }).exec();
  }

  async getTeachersBySchoolId(schoolId: string): Promise<IUser[]> {
    return await User.find({ schoolId: new mongoose.Types.ObjectId(schoolId), role: 'teacher' }).exec();
  }

  async createTeacher(teacherData: {
    user_id?: string;
    email: string;
    school_id: string;
    full_name: string;
    gender?: string;
    joining_date?: Date;
    phone_number?: string;
    status?: string;
    subject_specialization?: string;
  }): Promise<IUser> {
    if (teacherData.user_id) {
      // Update existing user
      const updated = await User.findByIdAndUpdate(
        teacherData.user_id,
        {
          schoolId: new mongoose.Types.ObjectId(teacherData.school_id),
          role: 'teacher',
          'profile.fullName': teacherData.full_name,
          'profile.phone': teacherData.phone_number,
          'profile.joiningDate': teacherData.joining_date,
          'profile.subjectSpecialization': teacherData.subject_specialization ? [teacherData.subject_specialization] : [],
        },
        { new: true }
      ).exec();
      if (!updated) throw new Error('User not found');
      return updated;
    } else {
      // Create new teacher user
      const newTeacher = new User({
        email: teacherData.email,
        password: 'temp123', // Should be set by the teacher on first login
        schoolId: new mongoose.Types.ObjectId(teacherData.school_id),
        role: 'teacher',
        profile: {
          fullName: teacherData.full_name,
          phone: teacherData.phone_number,
          joiningDate: teacherData.joining_date || new Date(),
          subjectSpecialization: teacherData.subject_specialization ? [teacherData.subject_specialization] : [],
        },
      });
      return await newTeacher.save();
    }
  }

  // Student operations (using User collection with role filtering)
  async getStudentByUserId(userId: string): Promise<IUser | null> {
    return await User.findOne({ _id: userId, role: 'student' }).exec();
  }

  async getStudentsBySchoolId(schoolId: string): Promise<IUser[]> {
    return await User.find({ schoolId: new mongoose.Types.ObjectId(schoolId), role: 'student' }).exec();
  }

  async getStudentsByClassId(classId: string): Promise<IUser[]> {
    return await User.find({ classId: new mongoose.Types.ObjectId(classId), role: 'student' }).exec();
  }

  async createStudent(studentData: {
    user_id?: string;
    student_email: string;
    school_id: string;
    class_id: string;
    full_name: string;
    dob?: Date;
    roll_no?: number;
  }): Promise<IUser> {
    // Auto-generate roll number if not provided
    let rollNo = studentData.roll_no;
    if (!rollNo) {
      const classInfo = await Class.findById(studentData.class_id);
      if (!classInfo) throw new Error('Class not found');
      
      const existingStudents = await User.countDocuments({ 
        classId: new mongoose.Types.ObjectId(studentData.class_id), 
        role: 'student' 
      });
      
      const sectionNumber = classInfo.section.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0) + 1;
      const ascendingOrder = (existingStudents + 1).toString().padStart(2, '0');
      rollNo = parseInt(`${classInfo.grade}${sectionNumber}${ascendingOrder}`);
    }

    if (studentData.user_id) {
      // Update existing user
      const updated = await User.findByIdAndUpdate(
        studentData.user_id,
        {
          email: studentData.student_email,
          schoolId: new mongoose.Types.ObjectId(studentData.school_id),
          classId: new mongoose.Types.ObjectId(studentData.class_id),
          role: 'student',
          'profile.fullName': studentData.full_name,
          'profile.dob': studentData.dob,
          rollNo: rollNo,
        },
        { new: true }
      ).exec();
      if (!updated) throw new Error('User not found');
      return updated;
    } else {
      // Create new student user
      const newStudent = new User({
        email: studentData.student_email,
        password: 'temp123', // Should be set by the student on first login
        schoolId: new mongoose.Types.ObjectId(studentData.school_id),
        classId: new mongoose.Types.ObjectId(studentData.class_id),
        role: 'student',
        profile: {
          fullName: studentData.full_name,
          dob: studentData.dob,
        },
        rollNo: rollNo,
      });
      return await newStudent.save();
    }
  }

  // Class operations
  async getClass(id: string): Promise<IClass | null> {
    return await Class.findById(id).exec();
  }

  async getClassesBySchoolId(schoolId: string): Promise<IClass[]> {
    return await Class.find({ schoolId: new mongoose.Types.ObjectId(schoolId) }).exec();
  }

  async getClassesBySchool(schoolId: string): Promise<any[]> {
    const classes = await Class.find({ schoolId: new mongoose.Types.ObjectId(schoolId) }).exec();
    
    const classesWithCount = await Promise.all(
      classes.map(async (classItem) => {
        const studentCount = await User.countDocuments({ 
          classId: classItem._id, 
          role: 'student' 
        });
        
        return {
          id: classItem._id,
          grade: classItem.grade,
          section: classItem.section,
          studentCount,
          class_teacher_id: classItem.classTeacherId,
          class_teacher_name: '', // You might want to populate this
        };
      })
    );
    
    return classesWithCount;
  }

  async createClass(classData: {
    school_id: string;
    grade: string;
    section: string;
    class_teacher_id?: string;
    class_teacher_name?: string;
  }): Promise<IClass> {
    const existingClass = await Class.findOne({
      schoolId: new mongoose.Types.ObjectId(classData.school_id),
      grade: classData.grade,
      section: classData.section,
    });

    if (existingClass) {
      throw new Error("Class with this grade and section already exists for this school.");
    }

    const newClass = new Class({
      schoolId: new mongoose.Types.ObjectId(classData.school_id),
      grade: classData.grade,
      section: classData.section,
      classTeacherId: classData.class_teacher_id ? new mongoose.Types.ObjectId(classData.class_teacher_id) : undefined,
      subjects: [],
    });

    return await newClass.save();
  }

  // Academic operations (consolidated homework, tests, materials, lesson plans)
  async createHomework(homeworkData: {
    class_id: string;
    subject_id: string;
    teacher_id: string;
    school_id: string;
    title: string;
    description?: string;
    assigned_date: Date;
    due_date?: Date;
    attachment_url?: string;
  }): Promise<IAcademic> {
    const newHomework = new Academic({
      schoolId: new mongoose.Types.ObjectId(homeworkData.school_id),
      classId: new mongoose.Types.ObjectId(homeworkData.class_id),
      subjectId: new mongoose.Types.ObjectId(homeworkData.subject_id),
      teacherId: new mongoose.Types.ObjectId(homeworkData.teacher_id),
      type: 'homework',
      title: homeworkData.title,
      description: homeworkData.description,
      assignedDate: homeworkData.assigned_date,
      dueDate: homeworkData.due_date,
      attachmentUrl: homeworkData.attachment_url,
    });

    return await newHomework.save();
  }

  async getHomeworkByClassId(classId: string): Promise<IAcademic[]> {
    return await Academic.find({ 
      classId: new mongoose.Types.ObjectId(classId), 
      type: 'homework' 
    }).exec();
  }

  async createTest(testData: {
    class_id: string;
    subject_id: string;
    teacher_id: string;
    school_id: string;
    title: string;
    description?: string;
    test_date: Date;
    max_marks?: number;
  }): Promise<IAcademic> {
    const newTest = new Academic({
      schoolId: new mongoose.Types.ObjectId(testData.school_id),
      classId: new mongoose.Types.ObjectId(testData.class_id),
      subjectId: new mongoose.Types.ObjectId(testData.subject_id),
      teacherId: new mongoose.Types.ObjectId(testData.teacher_id),
      type: 'test',
      title: testData.title,
      description: testData.description,
      assignedDate: testData.test_date,
      maxMarks: testData.max_marks,
    });

    return await newTest.save();
  }

  async getTestsByClassId(classId: string): Promise<IAcademic[]> {
    return await Academic.find({ 
      classId: new mongoose.Types.ObjectId(classId), 
      type: 'test' 
    }).exec();
  }

  async createMaterial(materialData: {
    class_id: string;
    subject_id: string;
    teacher_id: string;
    school_id: string;
    title: string;
    description?: string;
    upload_date: Date;
    file_url?: string;
    material_type?: string;
  }): Promise<IAcademic> {
    const newMaterial = new Academic({
      schoolId: new mongoose.Types.ObjectId(materialData.school_id),
      classId: new mongoose.Types.ObjectId(materialData.class_id),
      subjectId: new mongoose.Types.ObjectId(materialData.subject_id),
      teacherId: new mongoose.Types.ObjectId(materialData.teacher_id),
      type: 'material',
      title: materialData.title,
      description: materialData.description,
      assignedDate: materialData.upload_date,
      attachmentUrl: materialData.file_url,
      materialType: materialData.material_type,
    });

    return await newMaterial.save();
  }

  async getMaterialsByClassId(classId: string): Promise<IAcademic[]> {
    return await Academic.find({ 
      classId: new mongoose.Types.ObjectId(classId), 
      type: 'material' 
    }).exec();
  }

  // Attendance operations
  async createStudentAttendance(attendanceData: {
    school_id: string;
    class_id: string;
    date: Date;
    records: Array<{
      student_id: string;
      status: 'present' | 'absent' | 'late';
    }>;
  }): Promise<IAttendance> {
    // Check if attendance already exists for this date and class
    const existingAttendance = await Attendance.findOne({
      schoolId: new mongoose.Types.ObjectId(attendanceData.school_id),
      classId: new mongoose.Types.ObjectId(attendanceData.class_id),
      date: attendanceData.date,
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.records = attendanceData.records.map(record => ({
        studentId: new mongoose.Types.ObjectId(record.student_id),
        status: record.status,
      }));
      return await existingAttendance.save();
    } else {
      // Create new attendance record
      const newAttendance = new Attendance({
        schoolId: new mongoose.Types.ObjectId(attendanceData.school_id),
        classId: new mongoose.Types.ObjectId(attendanceData.class_id),
        date: attendanceData.date,
        records: attendanceData.records.map(record => ({
          studentId: new mongoose.Types.ObjectId(record.student_id),
          status: record.status,
        })),
      });
      return await newAttendance.save();
    }
  }

  async getStudentAttendanceByClassAndDate(classId: string, date: Date): Promise<IAttendance | null> {
    return await Attendance.findOne({
      classId: new mongoose.Types.ObjectId(classId),
      date: date,
    }).exec();
  }

  // Message operations (using Communication collection)
  async createMessage(messageData: {
    sender_id: string;
    content: string;
    recipients: Array<{
      type: 'user' | 'class' | 'role';
      id: string;
    }>;
  }): Promise<ICommunication> {
    const newMessage = new Communication({
      senderId: new mongoose.Types.ObjectId(messageData.sender_id),
      content: messageData.content,
      recipients: messageData.recipients.map(recipient => ({
        type: recipient.type,
        id: recipient.type === 'role' ? recipient.id : new mongoose.Types.ObjectId(recipient.id),
      })),
    });

    return await newMessage.save();
  }

  async getMessagesByTeacherId(teacherId: string): Promise<ICommunication[]> {
    return await Communication.find({
      senderId: new mongoose.Types.ObjectId(teacherId),
    }).exec();
  }

  // Generic getter methods for backward compatibility
  async getTeacher(id: string): Promise<IUser | null> {
    return await User.findOne({ _id: id, role: 'teacher' }).exec();
  }

  async getStudent(id: string): Promise<IUser | null> {
    return await User.findOne({ _id: id, role: 'student' }).exec();
  }

  async updateClass(id: string, data: Partial<IClass>): Promise<IClass | null> {
    return await Class.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteClass(id: string): Promise<boolean> {
    const result = await Class.findByIdAndDelete(id).exec();
    return !!result;
  }

  async updateTeacher(id: string, data: any): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, {
      'profile.fullName': data.full_name,
      'profile.phone': data.phone_number,
      'profile.joiningDate': data.joining_date,
      'profile.subjectSpecialization': data.subject_specialization ? [data.subject_specialization] : [],
    }, { new: true }).exec();
  }

  async deleteTeacher(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id).exec();
    return !!result;
  }

  async updateStudent(id: string, data: any): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, {
      email: data.student_email,
      'profile.fullName': data.full_name,
      'profile.dob': data.dob,
      classId: data.class_id ? new mongoose.Types.ObjectId(data.class_id) : undefined,
    }, { new: true }).exec();
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id).exec();
    return !!result;
  }
}

export const storage = new MongoDBStorage();