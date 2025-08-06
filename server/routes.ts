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
  insertStudentAttendanceSchema,
  insertTeacherAttendanceSchema,
  insertMessageSchema,
  insertClassMessageSchema,
  insertExamSchema,
  insertFeeStructureSchema,
  insertFeePaymentSchema,
  insertBillSchema,
  insertClassLogSchema,
  insertLessonPlanSchema,
  insertAssignmentSchema,
  insertAssignmentSubmissionSchema,
  insertExamSubjectSchema,
  insertMarkSchema,
  insertTimetableSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Get the middleware for role-based access control
  const requireRole = app.locals.requireRole;

  // API Routes
  // All routes are prefixed with /api

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
        res.status(500).json({ message: "Failed to delete teacher", error });
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
        console.log("✅ [POST] /api/bulk-student-attendance - Route hit");

        const user = req.user as Express.User;
        console.log("👤 Authenticated user:", {
          id: user.id,
          name: user.name,
          role: user.role,
        });

        const attendanceData = z
          .array(insertStudentAttendanceSchema)
          .parse(req.body);
        console.log(`📦 Received ${attendanceData.length} attendance records`);

        // Role-based validation for staff
        if (user?.role === "staff") {
          console.log("🔒 Role is staff. Validating teacher access...");

          const teacher = await storage.getTeacherByUserId(user.id);
          if (!teacher) {
            console.warn("❌ No teacher found for user");
            return res.status(403).json({ message: "Forbidden" });
          }

          const classIds = await storage.getClassesByTeacherId(teacher.id);
          const classIdSet = new Set(classIds.map((c) => c.id));
          console.log("🧾 Staff has access to class IDs:", [...classIdSet]);

          for (const attendance of attendanceData) {
            if (!classIdSet.has(attendance.class_id)) {
              console.warn(
                "🚫 Forbidden class ID in attendance:",
                attendance.class_id
              );
              return res.status(403).json({ message: "Forbidden" });
            }
          }

          console.log("✅ Staff role validation passed.");
        }

        // Add metadata to each attendance record
        const attendanceWithMeta = attendanceData.map((record) => ({
          ...record,
          entry_id: user.id,
          entry_name: user.name || "Unknown",
        }));
        console.log(
          "📝 Final attendance data with metadata:",
          attendanceWithMeta
        );

        const newAttendances = await storage.createStudentAttendances(
          attendanceWithMeta
        );
        console.log("✅ Attendance records successfully stored.");

        res.status(201).json(newAttendances);
      } catch (error) {
        console.error(
          "❌ Error occurred in bulk-student-attendance route:",
          error
        );
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  );

  // Mark teacher attendance in bulk
  app.post(
    "/api/bulk-teacher-attendance",
    requireRole(["school_admin"]),
    async (req, res) => {
      try {
        const user = req.user as Express.User;
        if (user.role !== "school_admin") {
          return res.status(403).json({ message: "Forbidden" });
        }
        const attendanceData = z
          .array(insertTeacherAttendanceSchema)
          .parse(
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
            message: "Failed to fetch teachers for class",
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

  return createServer(app);
}
