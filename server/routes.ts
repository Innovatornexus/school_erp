import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  insertSchoolSchema,
  insertSchoolAdminSchema,
  insertTeacherSchema,
  insertStudentSchema,
  insertClassSchema,
  insertSubjectSchema,
  insertClassSubjectSchema,
  insertTeacherAttendanceSchema,
  insertMessageSchema,
  insertClassMessageSchema,
  insertExamSchema,
  insertFeeStructureSchema,
  insertFeePaymentSchema,
  insertBillSchema,
  insertClassLogSchema,
  insertLessonPlanSchema,
  insertExamSubjectSchema,
  insertMarkSchema,
  insertTimetableSchema,
  messages,
  users,
  studentAttendanceInputSchema,
  studentAttendanceApiSchema,
  updateStudentAttendanceApiSchema,
  updateTeacherAttendanceApiSchema,
  generateReportQuerySchema,
  addHolidaysSchema,
  insertMaterialSchema,
  insertTestSchema,
  insertHomeworkSchema,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Get the middleware for role-based access control
  const requireRole = app.locals.requireRole;

  // API Routes
  // All routes are prefixed with /api

  // Teacher Messages Routes
  app.get(
    "/api/teachers/:teacherId/messages",
    requireRole(["teacher"]),
    async (req, res) => {
      try {
        const teacherId = parseInt(req.params.teacherId);
        const messages = await storage.getMessagesByTeacherId(teacherId);
        res.json(messages);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch teacher messages", error });
      }
    }
  );

  app.put(
    "/api/teachers/:teacherId/messages/:messageId/read",
    requireRole(["teacher"]),
    async (req, res) => {
      try {
        const teacherId = parseInt(req.params.teacherId);
        const messageId = parseInt(req.params.messageId);
        const success = await storage.markMessageAsRead(messageId, teacherId);
        if (!success) {
          return res.status(404).json({ message: "Message not found" });
        }
        res.json({ success: true });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to mark message as read", error });
      }
    }
  );

  // ============ School Routes ============

  // Get all schools
  app.get("/api/schools", requireRole(["super_admin"]), async (_req, res) => {
    try {
      const schools = await storage.getSchools();
      res.json(schools);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schools", error });
    }
  });

  // Get a specific school by school id
  app.get(
    "/api/schools/:id",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const school = await storage.getSchool(id);

        if (!school) {
          return res.status(404).json({ message: "School not found" });
        }

        res.json(school);
      } catch (error) {
        console.log("error while fetching school by id", error);
        res.status(500).json({ message: "Failed to fetch school", error });
      }
    }
  );

  // Get a specific school by school admin
  app.get(
    "/api/school/:contact_email",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        let contact_email = req.params.contact_email.replace(/^:/, "").trim();
        console.log("Fetching school for cleaned email:", contact_email);

        const school = await storage.getSchoolByEmail(contact_email);

        if (!school) {
          return res.status(404).json({ message: "School not found" });
        }

        res.json(school);
      } catch (error) {
        console.error("Error fetching school by email:", error);
        res.status(500).json({ message: "Failed to fetch school", error });
      }
    }
  );

  // Create a new school
  app.post("/api/schools", requireRole(["super_admin"]), async (req, res) => {
    try {
      const schoolData = insertSchoolSchema.parse(req.body);
      const newSchool = await storage.createSchool(schoolData);
      res.status(201).json(newSchool);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create school", error });
    }
  });

  // Update a school
  app.put(
    "/api/schools/:id",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const schoolData = insertSchoolSchema.partial().parse(req.body);

        const updatedSchool = await storage.updateSchool(id, schoolData);
        if (!updatedSchool) {
          return res.status(404).json({ message: "School not found" });
        }

        res.json(updatedSchool);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update school", error });
      }
    }
  );

  // Delete a school
  app.delete(
    "/api/schools/:id",
    requireRole(["super_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteSchool(id);

        if (!success) {
          return res.status(404).json({ message: "School not found" });
        }

        res.status(204).end();
      } catch (error) {
        res.status(500).json({ message: "Failed to delete school", error });
      }
    }
  );

  // ============ School Admin Routes ============

  // Get school admins by school
  app.get(
    "/api/schools/:schoolId/admins",
    requireRole(["super_admin"]),
    async (req, res) => {
      try {
        const schoolId = parseInt(req.params.schoolId);
        const admins = await storage.getSchoolAdminsBySchoolId(schoolId);
        res.json(admins);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch school admins", error });
      }
    }
  );

  // Create a school admin
  app.post(
    "/api/school-admins",
    requireRole(["super_admin"]),
    async (req, res) => {
      try {
        const adminData = insertSchoolAdminSchema.parse(req.body);
        const newAdmin = await storage.createSchoolAdmin(adminData);
        res.status(201).json(newAdmin);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res
          .status(500)
          .json({ message: "Failed to create school admin", error });
      }
    }
  );

  // Update a school admin
  app.put(
    "/api/school-admins/:id",
    requireRole(["super_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const adminData = insertSchoolAdminSchema.partial().parse(req.body);

        const updatedAdmin = await storage.updateSchoolAdmin(id, adminData);
        if (!updatedAdmin) {
          return res.status(404).json({ message: "School admin not found" });
        }

        res.json(updatedAdmin);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res
          .status(500)
          .json({ message: "Failed to update school admin", error });
      }
    }
  );

  // Delete a school admin
  app.delete(
    "/api/school-admins/:id",
    requireRole(["super_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteSchoolAdmin(id);

        if (!success) {
          return res.status(404).json({ message: "School admin not found" });
        }

        res.status(204).end();
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to delete school admin", error });
      }
    }
  );

  // ============ Teacher Routes ============

  //get staff detail from staff email
  app.get(
    "/api/Teachers/:TeacherEmail/staff",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const TeacherEmail = req.params.TeacherEmail;
        console.log("test staff:", req.params);
        console.log("storage object:", storage);
        const teachers = await storage.getTeacherByTeacherEmail(TeacherEmail);
        console.log("teacher data fetched ::", teachers);
        res.json(teachers);
      } catch (error) {
        console.log(
          "error fetch staffs  /api/Teachers/:TeacherEmail/staff: ",
          error
        );
        res.status(500).json({ message: "Failed to fetch teachers", error });
      }
    }
  );

  // Get teachers by school
  app.get(
    "/api/schools/:schoolId/teachers",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const schoolId = parseInt(req.params.schoolId);
        console.log("test staff:", req.params);
        const teachers = await storage.getTeachersBySchoolId(schoolId);
        console.log("teacher data fetched ::", teachers);
        res.json(teachers);
      } catch (error) {
        console.log(
          "error fetch staffs /api/schools/:schoolId/teachers: ",
          error
        );
        res.status(500).json({ message: "Failed to fetch teachers", error });
      }
    }
  );

  // Create a teacher
  app.post(
    "/api/teachers",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        // The request body already contains `subject_specialization` as an array.
        // We don't need to perform any string manipulation.

        // We assume insertTeacherSchema has been updated to expect an array of strings.
        const teacherData = insertTeacherSchema.parse(req.body);

        // The `teacherData` object now correctly contains the `subject_specialization` field as an array.
        const newTeacher = await storage.createTeacher(teacherData);

        console.log("newteacher ::", newTeacher);
        res.status(201).json(newTeacher);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.log("error on api/teacher :", error.errors);
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        console.log("error on api/teacher :", error);
        res.status(500).json({ message: "Failed to create teacher", error });
      }
    }
  );
  // Update a teacher
  app.put(
    "/api/teachers/:id",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const teacherData = insertTeacherSchema.partial().parse(req.body);

        const updatedTeacher = await storage.updateTeacher(id, teacherData);
        if (!updatedTeacher) {
          return res.status(404).json({ message: "Teacher not found" });
        }

        res.json(updatedTeacher);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update teacher", error });
      }
    }
  );

  //toggle teacher status

  app.put(
    "/api/teachers/:id/status",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const teacherData = insertTeacherSchema.partial().parse(req.body);

        const updatedTeacher = await storage.updateTeacher(id, teacherData);
        if (!updatedTeacher) {
          return res.status(404).json({ message: "Teacher not found" });
        }

        res.json(updatedTeacher);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update teacher", error });
      }
    }
  );

  // Delete a teacher
  app.delete(
    "/api/teachers/:id",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteTeacher(id);

        if (!success) {
          return res.status(404).json({ message: "Teacher not found" });
        }

        res.status(204).end();
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Full zod error:", error);
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }

        // Narrow error type safely
        if (error instanceof Error) {
          console.error("Full error:", error);
          return res.status(500).json({
            message: "Failed to delete teacher",
            error: error.message,
            stack: error.stack,
          });
        }

        // fallback if it's not an instance of Error
        return res.status(500).json({
          message: "Unknown error occurred",
          error: JSON.stringify(error),
        });
      }
    }
  );

  // Get classes assigned to a teacher
  app.get(
    "/api/teachers/:teacherId/classes",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const teacherId = parseInt(req.params.teacherId);
        const classes = await storage.getClassesByTeacherId(teacherId);
        res.json(classes);
      } catch (error) {
        console.error("Error fetching classes for teacher:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch classes for teacher", error });
      }
    }
  );

  // ============ Student Routes ============

  // Get students by school
  app.get(
    "/api/schools/all-students/:schoolId",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        console.log("fetching student by schoolID..");
        const schoolId = parseInt(req.params.schoolId);
        const students = await storage.getStudentsBySchoolId(schoolId);
        res.json(students);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch students", error });
      }
    }
  );

  // Get students by class
  app.get(
    "/api/classes/:classId/students",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const classId = parseInt(req.params.classId);
        const students = await storage.getStudentsByClassId(classId);
        console.log("students data::", students);
        res.json(students);
      } catch (error) {
        console.log("Error on get students by class", error);
        res
          .status(500)
          .json({ message: "Failed to fetch students for class", error });
      }
    }
  );

  // Create a student
  app.post(
    "/api/students",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const studentData = insertStudentSchema.parse(req.body);
        console.log(" student Data:", studentData);
        const newStudent = await storage.createStudent(studentData);
        res.status(201).json(newStudent);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.log("student create error:", error.errors);
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }

        // Check for the specific error message from the storage layer
        if (
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as any).message === "string" &&
          (error as any).message.includes(
            "Student with this email already exists"
          )
        ) {
          return res.status(409).json({ message: (error as any).message });
        }

        console.log("student create error:", error);
        res.status(500).json({ message: "Failed to create student", error });
      }
    }
  );

  // Update a student
  app.put(
    "/api/students/:id",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const studentData = insertStudentSchema.partial().parse(req.body);

        const updatedStudent = await storage.updateStudent(id, studentData);
        if (!updatedStudent) {
          return res.status(404).json({ message: "Student not found" });
        }

        res.json(updatedStudent);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.log("error on editing student ::", error.errors);
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        console.log("error on editing student ::", error);
        res.status(500).json({ message: "Failed to update student", error });
      }
    }
  );

  //update student status
  app.put(
    "/api/students/:id/status",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const studentData = insertStudentSchema.partial().parse(req.body);

        const updatedStudent = await storage.updateStudent(id, studentData);
        if (!updatedStudent) {
          return res.status(404).json({ message: "Student not found" });
        }

        res.json(updatedStudent);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.log("error on editing student status ::", error.errors);
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        console.log("error on editing student status::", error);
        res.status(500).json({ message: "Failed to update student", error });
      }
    }
  );

  // Delete a student
  app.delete(
    "/api/students/:id",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteStudent(id);

        if (!success) {
          return res.status(404).json({ message: "Student not found" });
        }

        res.status(204).end();
      } catch (error) {
        res.status(500).json({ message: "Failed to delete student", error });
      }
    }
  );

  // ============ Parent Routes ============

  // ============ Class Routes ============

  // Get classes by school
  app.get("/api/schools/:schoolId/classes", async (req, res) => {
    try {
      console.log("fetching class");
      const schoolId = parseInt(req.params.schoolId, 10);

      if (isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }

      const classes = await storage.getClassesBySchool(schoolId);
      console.log("classes fetche ::", classes);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Failed to fetch classes", error });
    }
  });

  // Create a class
  app.post(
    "/api/classes",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        // Assuming insertClassSchema and z are from zod
        const classData = insertClassSchema.parse(req.body);

        // Call the updated storage function
        const newClass = await storage.createClass(classData);

        res.status(201).json(newClass);
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Handle validation errors from Zod
          console.log("class create error:", error.errors);
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }

        // Check for the specific error message from the storage layer
        if (
          error instanceof Error &&
          error.message.includes(
            "Class with this grade and section already exists"
          )
        ) {
          // Return a 409 Conflict status code for a duplicate resource
          return res.status(409).json({ message: error.message });
        }

        // Handle other unknown errors
        console.error("class create error:", error);
        res.status(500).json({ message: "Failed to create class", error });
      }
    }
  );

  // Update a class
  app.put(
    "/api/classes/:id",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const classData = insertClassSchema.partial().parse(req.body);

        const updatedClass = await storage.updateClass(id, classData);
        if (!updatedClass) {
          return res.status(404).json({ message: "Class not found" });
        }

        res.json(updatedClass);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update class", error });
      }
    }
  );

  // Delete a class
  app.delete(
    "/api/classes/:id",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteClass(id);

        if (!success) {
          return res.status(404).json({ message: "Class not found" });
        }

        res.status(204).end();
      } catch (error) {
        res.status(500).json({ message: "Failed to delete class", error });
      }
    }
  );

  // ============ Subject Routes ============

  // Get subjects by school
  app.get(
    "/api/schools/:schoolId/subjects",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const schoolId = parseInt(req.params.schoolId);
        const subjects = await storage.getSubjectsBySchoolId(schoolId);
        res.json(subjects);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch subjects", error });
      }
    }
  );

  // Create a subject
  app.post(
    "/api/subjects",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const subjectData = insertSubjectSchema.parse(req.body);
        const newSubject = await storage.createSubject(subjectData);
        res.status(201).json(newSubject);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to create subject", error });
      }
    }
  );

  // Update a subject
  app.put(
    "/api/subjects/:id",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const subjectData = insertSubjectSchema.partial().parse(req.body);

        const updatedSubject = await storage.updateSubject(id, subjectData);
        if (!updatedSubject) {
          return res.status(404).json({ message: "Subject not found" });
        }

        res.json(updatedSubject);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update subject", error });
      }
    }
  );

  // Delete a subject
  app.delete(
    "/api/subjects/:id",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteSubject(id);

        if (!success) {
          return res.status(404).json({ message: "Subject not found" });
        }

        res.status(204).end();
      } catch (error) {
        res.status(500).json({ message: "Failed to delete subject", error });
      }
    }
  );

  // ============ Class Subject Mapping Routes ============

  // Assign teacher to a class-subject
  app.post(
    "/api/class-subjects",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const mappingData = insertClassSubjectSchema.parse(req.body);
        const newMapping = await storage.createClassSubject(mappingData);
        res.status(201).json(newMapping);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res
          .status(500)
          .json({ message: "Failed to create class-subject mapping", error });
      }
    }
  );

  // Get subjects for a class
  app.get(
    "/api/classes/:classId/subjects",
    requireRole(["super_admin", "school_admin", "staff", "student", "parent"]),
    async (req, res) => {
      try {
        const classId = parseInt(req.params.classId);
        const mappings = await storage.getClassSubjectsByClassId(classId);
        res.json(mappings);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch class subjects", error });
      }
    }
  );

  // Update a class-subject mapping
  app.put(
    "/api/class-subjects/:id",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const mappingData = insertClassSubjectSchema.partial().parse(req.body);

        const updatedMapping = await storage.updateClassSubject(
          id,
          mappingData
        );
        if (!updatedMapping) {
          return res
            .status(404)
            .json({ message: "Class-subject mapping not found" });
        }

        res.json(updatedMapping);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res
          .status(500)
          .json({ message: "Failed to update class-subject mapping", error });
      }
    }
  );

  // ============ Attendance Routes ============

  // Mark student attendance in bulk
  app.post(
    "/api/bulk-student-attendance",
    requireRole(["school_admin", "staff"]),
    async (req, res) => {
      try {
        console.log(
          "incominig data for /api/bulk-student-attendance ::",
          req.body
        );
        const user = req.user as Express.User;

        // FIX: Parse the request body using the new, less strict schema.
        const incomingData = z
          .array(studentAttendanceInputSchema)
          .parse(req.body);

        // Now, add the metadata that the server is responsible for.
        const attendanceWithMeta = incomingData.map((record) => ({
          ...record,
          entry_id: user.id,
          entry_name: user.name || "Unknown",
        }));

        // The 'attendanceWithMeta' array now matches the full database schema.
        const newAttendances = await storage.createStudentAttendances(
          attendanceWithMeta
        );

        //this error due to demanding id , but id incremented

        res.status(201).json(newAttendances);
      } catch (error) {
        console.error(
          "❌ Error occurred in bulk-student-attendance route:",
          error
        );
        // Return a more specific error message for Zod issues
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid data format", errors: error.errors });
        }
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  );
  //update student
  app.put(
    "/api/bulk-student-attendance",
    requireRole(["school_admin", "staff"]),
    async (req, res) => {
      try {
        const user = req.user as Express.User;

        // FIX: Use the new, correct schema to validate the array from the request body.
        const incomingData = z
          .array(updateStudentAttendanceApiSchema)
          .parse(req.body);

        // Prepare the data for the database update operation by adding server-side metadata.
        const attendanceToUpdate = incomingData.map((record) => ({
          ...record,
          entry_id: user.id,
          entry_name: user.name || "Unknown",
        }));

        // Call the storage method to perform the bulk update.
        const updatedAttendances = await storage.updateStudentAttendances(
          attendanceToUpdate
        );

        res.status(200).json(updatedAttendances);
      } catch (error) {
        console.error("❌ Error in PUT /api/bulk-student-attendance:", error);
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update attendance" });
      }
    }
  );
  // Mark teacher attendance in bulk
  app.post(
    "/api/bulk-teacher-attendance",
    requireRole(["school_admin"]),
    async (req, res) => {
      try {
        console.log(
          "incominig data for /api/bulk-teacher-attendance ::",
          req.body
        );
        const user = req.user as Express.User;
        if (user.role !== "school_admin") {
          return res.status(403).json({ message: "Forbidden" });
        }
        const attendanceData = z.array(insertTeacherAttendanceSchema).parse(
          req.body.map((record: any) => ({
            ...record,
            school_id: user.school_id,
          }))
        );
        const newAttendances = await storage.createTeacherAttendances(
          attendanceData
        );
        res.status(201).json(newAttendances);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Full zod error:", error);
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }

        // Narrow error type safely
        if (error instanceof Error) {
          console.error("Full error:", error);
          return res.status(500).json({
            message: "Failed to mark teacher attendance",
            error: error.message,
            stack: error.stack,
          });
        }

        // fallback if it's not an instance of Error
        return res.status(500).json({
          message: "Unknown error occurred",
          error: JSON.stringify(error),
        });
      }
    }
  );

  // update teacher attendance
  app.put(
    "/api/bulk-teacher-attendance",
    requireRole(["school_admin"]),
    async (req, res) => {
      try {
        const user = req.user as Express.User; // Get the authenticated user

        // STEP 1: Map over the incoming request body to add the required fields
        const processedData = req.body.map((record: any) => ({
          ...record,
          school_id: user.school_id,
        }));

        // STEP 2: Now, validate the processed data that includes school_id
        const attendanceToUpdate = z
          .array(updateTeacherAttendanceApiSchema)
          .parse(processedData);

        // Call the storage method to perform the bulk update.
        const updatedAttendances = await storage.updateTeacherAttendances(
          attendanceToUpdate
        );

        res.status(200).json(updatedAttendances);
      } catch (error) {
        console.error("❌ Error in PUT /api/bulk-teacher-attendance:", error);
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update attendance" });
      }
    }
  );

  // Get teacher attendance by school and date
  app.get(
    "/api/schools/:schoolId/teacher-attendance",
    requireRole(["school_admin"]),
    async (req, res) => {
      try {
        const schoolId = parseInt(req.params.schoolId);
        const dateStr = req.query.date as string;
        const date = dateStr ? new Date(dateStr) : new Date();

        const attendance = await storage.getTeacherAttendanceBySchoolId(
          schoolId,
          date
        );
        res.json(attendance);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }

        // Narrow error type safely
        if (error instanceof Error) {
          console.error("Full error:", error);
          return res.status(500).json({
            message: "Failed fetch teacher attendance by school",
            error: error.message,
            stack: error.stack,
          });
        }

        // fallback if it's not an instance of Error
        return res.status(500).json({
          message: "Unknown error occurred",
          error: JSON.stringify(error),
        });
      }
    }
  );

  // Get attendance by student
  app.get(
    "/api/students/:studentId/attendance",
    requireRole(["super_admin", "school_admin", "staff", "student", "parent"]),
    async (req, res) => {
      try {
        const studentId = parseInt(req.params.studentId);
        const attendance = await storage.getStudentAttendanceByStudentId(
          studentId
        );
        res.json(attendance);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }

        // Narrow error type safely
        if (error instanceof Error) {
          console.error("Full error:", error);
          return res.status(500).json({
            message: "Failed to fetch attendance by student",
            error: error.message,
            stack: error.stack,
          });
        }

        // fallback if it's not an instance of Error
        return res.status(500).json({
          message: "Unknown error occurred",
          error: JSON.stringify(error),
        });
      }
    }
  );

  // Get attendance by class and date
  app.get(
    "/api/classes/:classId/attendance",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const classId = parseInt(req.params.classId);
        const dateStr = req.query.date as string;
        const date = dateStr ? new Date(dateStr) : new Date();

        const user = req.user as Express.User;

        if (user.role === "staff") {
          const teacher = await storage.getTeacherByUserId(user.id);
          if (!teacher) {
            return res.status(403).json({ message: "Forbidden" });
          }
          const classesAssigned = await storage.getAllClassesByTeacherId(
            teacher.id
          );
          const isAssignedToClass = classesAssigned.some(
            (c) => c.id === classId
          );
          if (!isAssignedToClass) {
            return res.status(403).json({ message: "Forbidden" });
          }
        }

        const attendance = await storage.getStudentAttendanceByClassId(
          classId,
          date
        );
        res.json(attendance);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }

        // Narrow error type safely
        if (error instanceof Error) {
          console.error("Full error:", error);
          return res.status(500).json({
            message: "Failed to fetch class attendance",
            error: error.message,
            stack: error.stack,
          });
        }

        // fallback if it's not an instance of Error
        return res.status(500).json({
          message: "Unknown error occurred",
          error: JSON.stringify(error),
        });
      }
    }
  );

  // Get all student attendance by school and date (for school_admin)
  app.get(
    "/api/schools/:schoolId/student-attendance",
    requireRole(["school_admin"]),
    async (req, res) => {
      try {
        const schoolId = parseInt(req.params.schoolId);
        const dateStr = req.query.date as string;
        const date = dateStr ? new Date(dateStr) : new Date();

        const attendance = await storage.getStudentAttendanceBySchoolId(
          schoolId,
          date
        );
        res.json(attendance);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }

        if (error instanceof Error) {
          console.error("Full error:", error);
          return res.status(500).json({
            message: "Failed to fetch student attendance by school",
            error: error.message,
            stack: error.stack,
          });
        }

        return res.status(500).json({
          message: "Unknown error occurred",
          error: JSON.stringify(error),
        });
      }
    }
  );

  // Get teachers by class (for staff/class teachers)
  app.get(
    "/api/classes/:classId/teachers",
    requireRole(["staff"]),
    async (req, res) => {
      try {
        const classId = parseInt(req.params.classId);
        const user = req.user as Express.User;

        if (user.role === "staff") {
          const teacher = await storage.getTeacherByUserId(user.id);
          if (!teacher) {
            return res.status(403).json({ message: "Forbidden" });
          }
          const classesAssigned = await storage.getClassesByTeacherId(
            teacher.id
          );
          const isAssignedToClass = classesAssigned.some(
            (c) => c.id === classId
          );
          if (!isAssignedToClass) {
            return res.status(403).json({ message: "Forbidden" });
          }
        }

        const teachersInClass = await storage.getTeachersByClassId(classId);
        res.json(teachersInClass);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }

        if (error instanceof Error) {
          console.error("Full error:", error);
          return res.status(500).json({
            message: "Failed to fetch student attendance by class id",
            error: error.message,
            stack: error.stack,
          });
        }

        return res.status(500).json({
          message: "Unknown error occurred",
          error: JSON.stringify(error),
        });
      }
    }
  );

  // Helper function to transform flat records into a grid structure for the frontend table
  const transformRecordsToGrid = (records: any[], type: string) => {
    if (!records || records.length === 0) {
      return { headers: [], rows: [] };
    }

    // 1. Create a sorted, unique list of dates for the table headers
    const dateSet = new Set(records.map((r: { date: any }) => r.date));
    // FIX: Explicitly convert Date objects to numbers for sorting
    const headers = Array.from(dateSet).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    const groupedData = new Map();

    // 2. Group records by the appropriate ID (student, teacher, or class)
    for (const record of records) {
      let key;
      let name;

      switch (type) {
        case "student":
          key = record.student_id;
          name = record.full_name;
          break;
        case "teacher":
          key = record.teacher_id;
          name = record.full_name;
          break;
        case "class":
          key = record.class_id;
          name = `${record.grade} ${record.section}`;
          break;
        default:
          continue; // Skip if type is unknown
      }

      // If we haven't seen this student/teacher/class before, initialize it
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          id: key,
          name: name,
          // The attendance object will store date-status pairs
          attendance: {},
        });
      }

      // 3. Handle data differently for class reports (calculate percentages)
      if (type === "class") {
        // Initialize daily stats if not present
        const dailyStats = groupedData.get(key).attendance[record.date] || {
          present: 0,
          total: 0,
        };

        dailyStats.total += 1;
        if (record.status === "present") {
          dailyStats.present += 1;
        }

        groupedData.get(key).attendance[record.date] = dailyStats;
      } else {
        // For students and teachers, just record the status
        groupedData.get(key).attendance[record.date] = record.status;
      }
    }

    // 4. Convert the Map into the final array of rows
    const rows = Array.from(groupedData.values());

    // 5. Final processing step for class reports to convert stats to percentages
    if (type === "class") {
      for (const row of rows) {
        for (const date in row.attendance) {
          const stats = row.attendance[date];
          // Calculate percentage and round it
          row.attendance[date] =
            stats.total > 0
              ? Math.round((stats.present / stats.total) * 100)
              : 0;
        }
      }
    }

    // 6. Ensure every row has a value (or null) for every date in the header
    for (const row of rows) {
      for (const headerDate of headers) {
        if (!row.attendance.hasOwnProperty(headerDate)) {
          row.attendance[headerDate] = null; // Indicates no record for this day
        }
      }
    }

    return { headers, rows };
  };

  // The main API route handler
  app.get(
    "/api/attendance-report",
    requireRole(["school_admin", "staff"]),
    async (req, res) => {
      try {
        const { type, period, month, year, class_id } = req.query;
        const user = req.user as Express.User;

        if (typeof user.school_id !== "number") {
          return res
            .status(400)
            .json({ message: "User is not associated with a school." });
        }

        if (!type || !period || !month || !year) {
          return res
            .status(400)
            .json({ message: "Missing required query parameters" });
        }

        const yearNum = parseInt(year as string);
        const monthNum = parseInt(month as string);
        const startDate = new Date(yearNum, monthNum, 1);
        const endDate = new Date(yearNum, monthNum + 1, 0);

        let records = [];

        // Fetch the raw, flat data from your storage/database
        if (type === "student" || type === "class") {
          records = await storage.getStudentAttendanceByDateRange({
            school_id: user.school_id,
            class_id: class_id ? parseInt(class_id as string) : undefined,
            startDate,
            endDate,
          });
        } else if (type === "teacher") {
          records = await storage.getTeacherAttendanceByDateRange({
            school_id: user.school_id,
            startDate,
            endDate,
          });
        }

        // Calculate the summary from the raw data
        const total_present = records.filter(
          (r) => r.status === "present"
        ).length;
        const total_absent = records.filter(
          (r) => r.status === "absent"
        ).length;
        const total_records = records.length;
        const attendance_percentage =
          total_records > 0
            ? Math.round((total_present / total_records) * 100)
            : 0;

        const summary = {
          total_present,
          total_absent,
          total_records,
          attendance_percentage,
        };

        // **NEW**: Transform the flat data into the grid structure
        const { headers, rows } = transformRecordsToGrid(
          records,
          type as string
        );
        console.log("Headers:", headers);
        console.log("Rows:", rows);
        console.log("Summary:", summary);
        // Send the new, structured response
        res.json({
          summary,
          headers,
          rows,
        });
      } catch (error) {
        console.error("❌ Error generating attendance report:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  );

  app.post("/api/holidays", requireRole(["school_admin"]), async (req, res) => {
    try {
      const user = req.user as Express.User;
      const { year, holidays } = addHolidaysSchema.parse(req.body);
      if (!user.school_id) {
        return res
          .status(400)
          .json({ message: "User is not associated with a school." });
      }
      const savedHolidays = await storage.createOrUpdateHolidays(
        user.school_id,
        year,
        holidays
      );
      res.status(201).json({
        message: `${savedHolidays.length} holidays saved for ${year}.`,
        data: savedHolidays,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Full zod error:", error);
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors,
        });
      }

      // Narrow error type safely
      if (error instanceof Error) {
        console.error("Full error:", error);
        return res.status(500).json({
          message: "Failed to add holidays ",
          error: error.message,
          stack: error.stack,
        });
      }

      // fallback if it's not an instance of Error
      return res.status(500).json({
        message: "Unknown error occurred",
        error: JSON.stringify(error),
      });
    }
  });

  // New, powerful endpoint for generating reports
  app.get(
    "/api/reports/attendance",
    requireRole(["school_admin", "staff"]),
    async (req, res) => {
      try {
        const user = req.user as Express.User;
        // Validate query parameters
        const queryParams = generateReportQuerySchema.parse(req.query);
        if (user.school_id === null || user.school_id === undefined) {
          return res
            .status(400)
            .json({ message: "User is not associated with a school." });
        }
        const report = await storage.generateAttendanceReport({
          ...queryParams,
          schoolId: user.school_id,
        });
        console.log("Report:", report);
        res.status(200).json(report);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Full zod error:", error);
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }

        // Narrow error type safely
        if (error instanceof Error) {
          console.error("Full error:", error);
          return res.status(500).json({
            message: "Failed to get holidays",
            error: error.message,
            stack: error.stack,
          });
        }

        // fallback if it's not an instance of Error
        return res.status(500).json({
          message: "Unknown error occurred",
          error: JSON.stringify(error),
        });
      }
    }
  );

  // ============ Exam Routes ============

  // Create an exam
  app.post(
    "/api/exams",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const examData = insertExamSchema.parse(req.body);
        const newExam = await storage.createExam(examData);
        res.status(201).json(newExam);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to create exam", error });
      }
    }
  );

  // Get exams by school
  app.get(
    "/api/schools/:schoolId/exams",
    requireRole([
      "super_admin",
      "school_admin",
      "teacher",
      "student",
      "parent",
    ]),
    async (req, res) => {
      try {
        const schoolId = parseInt(req.params.schoolId);
        const exams = await storage.getExamsBySchoolId(schoolId);
        res.json(exams);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch exams", error });
      }
    }
  );

  // Get exams by class
  app.get(
    "/api/classes/:classId/exams",
    requireRole([
      "super_admin",
      "school_admin",
      "teacher",
      "student",
      "parent",
    ]),
    async (req, res) => {
      try {
        const classId = parseInt(req.params.classId);
        const exams = await storage.getExamsByClassId(classId);
        res.json(exams);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch class exams", error });
      }
    }
  );

  // ============ Fee Routes ============

  // Create fee structure
  app.post(
    "/api/fee-structures",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const feeData = insertFeeStructureSchema.parse(req.body);
        const newFeeStructure = await storage.createFeeStructure(feeData);
        res.status(201).json(newFeeStructure);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res
          .status(500)
          .json({ message: "Failed to create fee structure", error });
      }
    }
  );

  // Get fee structures by class
  app.get(
    "/api/classes/:classId/fee-structures",
    requireRole([
      "super_admin",
      "school_admin",
      "teacher",
      "student",
      "parent",
    ]),
    async (req, res) => {
      try {
        const classId = parseInt(req.params.classId);
        const feeStructures = await storage.getFeeStructuresByClassId(classId);
        res.json(feeStructures);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch fee structures", error });
      }
    }
  );

  // Record fee payment
  app.post(
    "/api/fee-payments",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      try {
        const paymentData = insertFeePaymentSchema.parse(req.body);
        const newPayment = await storage.createFeePayment(paymentData);
        res.status(201).json(newPayment);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res
          .status(500)
          .json({ message: "Failed to record fee payment", error });
      }
    }
  );

  // ============ Message Routes ============

  // Get messages by school
  app.get(
    "/api/schools/:schoolId/messages",
    requireRole(["super_admin", "school_admin", "staff", "teacher", "student"]),
    async (req, res) => {
      try {
        const schoolId = parseInt(req.params.schoolId);
        const messages = await storage.getMessagesBySchoolId(schoolId);
        res.json(messages);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch messages", error });
      }
    }
  );

  // // Get messages by sender
  // app.get(
  //   "/api/messages/sent/:senderId",
  //   requireRole(["super_admin", "school_admin", "staff", "teacher"]),
  //   async (req, res) => {
  //     try {
  //       const senderId = parseInt(req.params.senderId);
  //       const messages = await storage.getMessagesBySenderId(senderId);
  //       res.json(messages);
  //     } catch (error) {
  //       res
  //         .status(500)
  //         .json({ message: "Failed to fetch sent messages", error });
  //     }
  //   }
  // );

  // // Get messages by receiver
  // app.get(
  //   "/api/messages/received/:receiverId/:receiverRole",
  //   requireRole(["super_admin", "school_admin", "staff", "teacher", "student"]),
  //   async (req, res) => {
  //     try {
  //       const receiverId = parseInt(req.params.receiverId);
  //       const receiverRole = req.params.receiverRole;
  //       const messages = await storage.getMessagesByReceiverId(
  //         receiverId,
  //         receiverRole
  //       );
  //       res.json(messages);
  //     } catch (error) {
  //       res
  //         .status(500)
  //         .json({ message: "Failed to fetch received messages", error });
  //     }
  //   }
  // );

  // // Create a new message
  // app.post(
  //   "/api/messages",
  //   requireRole(["super_admin", "school_admin", "staff", "teacher"]),
  //   async (req, res) => {
  //     try {
  //       const messageData = insertMessageSchema.parse(req.body);
  //       const newMessage = await storage.createMessage(messageData);
  //       res.status(201).json(newMessage);
  //     } catch (error) {
  //       if (error instanceof z.ZodError) {
  //         return res
  //           .status(400)
  //           .json({ message: "Validation failed", errors: error.errors });
  //       }
  //       res.status(500).json({ message: "Failed to create message", error });
  //     }
  //   }
  // );

  // // Update a message
  // app.put(
  //   "/api/messages/:id",
  //   requireRole(["super_admin", "school_admin", "staff", "teacher"]),
  //   async (req, res) => {
  //     try {
  //       const id = parseInt(req.params.id);
  //       const messageData = insertMessageSchema.partial().parse(req.body);

  //       const updatedMessage = await storage.updateMessage(id, messageData);
  //       if (!updatedMessage) {
  //         return res.status(404).json({ message: "Message not found" });
  //       }

  //       res.json(updatedMessage);
  //     } catch (error) {
  //       if (error instanceof z.ZodError) {
  //         return res
  //           .status(400)
  //           .json({ message: "Validation failed", errors: error.errors });
  //       }
  //       res.status(500).json({ message: "Failed to update message", error });
  //     }
  //   }
  // );

  // // Delete a message
  // app.delete(
  //   "/api/messages/:id",
  //   requireRole(["super_admin", "school_admin", "staff", "teacher"]),
  //   async (req, res) => {
  //     try {
  //       const id = parseInt(req.params.id);
  //       const success = await storage.deleteMessage(id);

  //       if (!success) {
  //         return res.status(404).json({ message: "Message not found" });
  //       }

  //       res.status(204).end();
  //     } catch (error) {
  //       res.status(500).json({ message: "Failed to delete message", error });
  //     }
  //   }
  // );

  // // Get a specific message
  // app.get(
  //   "/api/messages/:id",
  //   requireRole(["super_admin", "school_admin", "staff", "teacher", "student"]),
  //   async (req, res) => {
  //     try {
  //       const id = parseInt(req.params.id);
  //       const message = await storage.getMessage(id);

  //       if (!message) {
  //         return res.status(404).json({ message: "Message not found" });
  //       }

  //       res.json(message);
  //     } catch (error) {
  //       res.status(500).json({ message: "Failed to fetch message", error });
  //     }
  //   }
  // );

  //chatgpt

  app.get(
    "/api/messages",
    requireRole(["super_admin", "school_admin", "teacher", "student"]),
    async (req, res) => {
      try {
        const schoolId = req.user?.school_id;
        if (!schoolId)
          return res.status(400).json({ message: "Missing school ID" });

        const messages = await storage.getMessagesWithUserInfo(schoolId);
        res.json(messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.post(
    "/api/messages/send",
    requireRole(["super_admin", "school_admin"]),
    async (req, res) => {
      const sender_id = req.user?.id;
      const sender_role = req.user?.role;
      const school_id = req.user?.school_id;

      const { content, message_type, receiver_role, receiver_ids } = req.body;

      // Validate required values
      if (
        !sender_id ||
        !sender_role ||
        !school_id ||
        !content ||
        !message_type ||
        !receiver_role ||
        !Array.isArray(receiver_ids) ||
        receiver_ids.length === 0
      ) {
        return res.status(400).json({ error: "Missing or invalid fields" });
      }

      try {
        // Prepare message entries
        const messagesToInsert = receiver_ids.map((receiver_id: number) => ({
          sender_id,
          sender_role,
          receiver_id,
          receiver_role,
          school_id,
          content,
          message_type,
        }));

        // Insert all messages
        await db.insert(messages).values(messagesToInsert);

        res.json({ success: true, count: messagesToInsert.length });
      } catch (err) {
        console.error("Error sending messages:", err);
        res.status(500).json({
          error: "Failed to send messages",
          details: err instanceof Error ? err.message : String(err),
        });
      }
    }
  );

  app.get(
    "/api/users/:userId/messages",
    requireRole([
      "super_admin",
      "school_admin",
      "teacher",
      "student",
      "parent",
    ]),
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        const userMessages = await storage.getMessagesForUser(userId);
        res.json(userMessages);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch messages", error });
      }
    }
  );

  app.get(
    "/api/users/:userId/messages/sent",
    requireRole(["super_admin", "school_admin", "teacher", "student"]),
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        const sent = await storage.getMessagesSentByUser(userId);
        res.json(sent);
      } catch (err) {
        res
          .status(500)
          .json({ message: "Failed to fetch sent messages", error: err });
      }
    }
  );

  app.get(
    "/api/classes/:classId/messages",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const classId = parseInt(req.params.classId);
        if (isNaN(classId)) {
          return res.status(400).json({ error: "Invalid class ID" });
        }

        const messages = await storage.getMessagesByClass(classId);

        res.json({ messages });
      } catch (error) {
        console.error("Error fetching class messages:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  // Get all materials
  app.get(
    "/api/materials",
    requireRole(["super_admin", "school_admin", "staff", "student"]),
    async (req, res) => {
      try {
        const materials = await storage.getMaterials();
        res.json(materials);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch materials", error });
      }
    }
  );

  // Get a specific material
  app.get(
    "/api/materials/:id",
    requireRole(["super_admin", "school_admin", "staff", "student"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const material = await storage.getMaterial(id);

        if (!material) {
          return res.status(404).json({ message: "Material not found" });
        }

        res.json(material);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch material", error });
      }
    }
  );

  // Create a new material
  app.post(
    "/api/materials",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        console.log("material data :: ", req.body);
        const materialData = insertMaterialSchema.parse(req.body);
        const newMaterial = await storage.createMaterial(materialData);
        res.status(201).json(newMaterial);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Full zod error:", error);
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }

        // Narrow error type safely
        if (error instanceof Error) {
          console.error("Full error:", error);
          return res.status(500).json({
            message: "Failed to create material",
            error: error.message,
            stack: error.stack,
          });
        }

        // fallback if it's not an instance of Error
        return res.status(500).json({
          message: "Unknown error occurred",
          error: JSON.stringify(error),
        });
      }
    }
  );

  // Update a material
  app.put(
    "/api/materials/:id",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const materialData = insertMaterialSchema.partial().parse(req.body);

        const updatedMaterial = await storage.updateMaterial(id, materialData);
        if (!updatedMaterial) {
          return res.status(404).json({ message: "Material not found" });
        }

        res.json(updatedMaterial);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update material", error });
      }
    }
  );

  // Delete a material
  app.delete(
    "/api/materials/:id",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteMaterial(id);

        if (!success) {
          return res.status(404).json({ message: "Material not found" });
        }

        res.status(204).end();
      } catch (error) {
        res.status(500).json({ message: "Failed to delete material", error });
      }
    }
  );

  // ============ Tests Routes ============

  // Get all tests
  app.get(
    "/api/tests",
    requireRole(["super_admin", "school_admin", "staff", "student"]),
    async (req, res) => {
      try {
        const tests = await storage.getTests();
        res.json(tests);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Full zod error:", error);
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }

        // Narrow error type safely
        if (error instanceof Error) {
          console.error("Full error:", error);
          return res.status(500).json({
            message: "Failed to fetch all test",
            error: error.message,
            stack: error.stack,
          });
        }

        // fallback if it's not an instance of Error
        return res.status(500).json({
          message: "Unknown error occurred",
          error: JSON.stringify(error),
        });
      }
    }
  );

  // Get a specific test
  app.get(
    "/api/tests/:id",
    requireRole(["super_admin", "school_admin", "staff", "student"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const test = await storage.getTest(id);

        if (!test) {
          return res.status(404).json({ message: "Test not found" });
        }

        res.json(test);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Full zod error:", error);
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }

        // Narrow error type safely
        if (error instanceof Error) {
          console.error("Full error:", error);
          return res.status(500).json({
            message: "Failed to fetch specific test",
            error: error.message,
            stack: error.stack,
          });
        }

        // fallback if it's not an instance of Error
        return res.status(500).json({
          message: "Unknown error occurred",
          error: JSON.stringify(error),
        });
      }
    }
  );

  // Create a new test
  app.post(
    "/api/tests",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const testData = insertTestSchema.parse(req.body);
        const newTest = await storage.createTest(testData);
        res.status(201).json(newTest);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Full zod error:", error);
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }

        // Narrow error type safely
        if (error instanceof Error) {
          console.error("Full error:", error);
          return res.status(500).json({
            message: "Failed to create a new test",
            error: error.message,
            stack: error.stack,
          });
        }

        // fallback if it's not an instance of Error
        return res.status(500).json({
          message: "Unknown error occurred",
          error: JSON.stringify(error),
        });
      }
    }
  );

  // Update a test
  app.put(
    "/api/tests/:id",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const testData = insertTestSchema.partial().parse(req.body);

        const updatedTest = await storage.updateTest(id, testData);
        if (!updatedTest) {
          return res.status(404).json({ message: "Test not found" });
        }

        res.json(updatedTest);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Full zod error:", error);
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }

        // Narrow error type safely
        if (error instanceof Error) {
          console.error("Full error:", error);
          return res.status(500).json({
            message: "Failed to update test",
            error: error.message,
            stack: error.stack,
          });
        }

        // fallback if it's not an instance of Error
        return res.status(500).json({
          message: "Unknown error occurred",
          error: JSON.stringify(error),
        });
      }
    }
  );

  // Delete a test
  app.delete(
    "/api/tests/:id",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteTest(id);

        if (!success) {
          return res.status(404).json({ message: "Test not found" });
        }

        res.status(204).end();
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Full zod error:", error);
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }

        // Narrow error type safely
        if (error instanceof Error) {
          console.error("Full error:", error);
          return res.status(500).json({
            message: "Failed to delete test",
            error: error.message,
            stack: error.stack,
          });
        }

        // fallback if it's not an instance of Error
        return res.status(500).json({
          message: "Unknown error occurred",
          error: JSON.stringify(error),
        });
      }
    }
  );

  // ============ Homework Routes ============

  // Get all homework
  app.get(
    "/api/homework",
    requireRole(["super_admin", "school_admin", "staff", "student"]),
    async (req, res) => {
      try {
        const homework = await storage.getHomeworkList();
        res.json(homework);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch homework", error });
      }
    }
  );

  // Get a specific homework
  app.get(
    "/api/homework/:id",
    requireRole(["super_admin", "school_admin", "staff", "student"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const homework = await storage.getHomework(id);

        if (!homework) {
          return res.status(404).json({ message: "Homework not found" });
        }

        res.json(homework);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch homework", error });
      }
    }
  );

  // Create a new homework
  app.post(
    "/api/homework",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const homeworkData = insertHomeworkSchema.parse(req.body);
        const newHomework = await storage.createHomework(homeworkData);
        res.status(201).json(newHomework);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to create homework", error });
      }
    }
  );

  // Update a homework
  app.put(
    "/api/homework/:id",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const homeworkData = insertHomeworkSchema.partial().parse(req.body);

        const updatedHomework = await storage.updateHomework(id, homeworkData);
        if (!updatedHomework) {
          return res.status(404).json({ message: "Homework not found" });
        }

        res.json(updatedHomework);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update homework", error });
      }
    }
  );

  // Delete a homework
  app.delete(
    "/api/homework/:id",
    requireRole(["super_admin", "school_admin", "staff"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteHomework(id);

        if (!success) {
          return res.status(404).json({ message: "Homework not found" });
        }

        res.status(204).end();
      } catch (error) {
        res.status(500).json({ message: "Failed to delete homework", error });
      }
    }
  );

  // Get teacher's classes with subjects (for filtering)
  app.get("/api/teacher-classes", requireRole(["staff"]), async (req, res) => {
    try {
      const user = req.user as Express.User;
      if (!user || user.role !== "staff") {
        return res.status(403).json({ message: "Access denied" });
      }

      const teacherClassSubjects = await storage.getClassSubjectsByTeacherId(
        user.id
      );
      res.json(teacherClassSubjects);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch teacher classes", error });
    }
  });

  // Get current teacher data
  app.get("/api/teachers/current", requireRole(["staff"]), async (req, res) => {
    try {
      const user = req.user as Express.User;
      if (!user || user.role !== "staff") {
        return res.status(403).json({ message: "Access denied" });
      }

      const teacher = await storage.getTeacherByUserId(user.id);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      res.json(teacher);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teacher data", error });
    }
  });
  return createServer(app);
}
