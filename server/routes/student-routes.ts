import { Router } from "express";
import { StudentService } from "../services/student-service";
import { UserService } from "../services/user-service";
import { insertStudentSchema } from "../../shared/mongodb-schemas";
import { z } from "zod";

// Schema for student creation request (without userId)
const createStudentRequestSchema = insertStudentSchema.omit({ userId: true });

const router = Router();

// Get all students for a school
router.get("/school/:schoolId", async (req, res) => {
  try {
    const students = await StudentService.getStudentsBySchool(req.params.schoolId);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch students", error });
  }
});

// Get student by ID
router.get("/:id", async (req, res) => {
  try {
    const student = await StudentService.getStudent(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch student", error });
  }
});

// Create a new student
router.post("/", async (req, res) => {
  try {
    console.log("=== Student Creation Request ===");
    console.log("Request body:", req.body);
    
    // Extract password from request body
    const { password, ...studentData } = req.body;
    console.log("Extracted password:", password ? "[PROVIDED]" : "[NOT PROVIDED]");
    console.log("Student data:", studentData);
    
    // Validate student data without userId first
    const validatedData = createStudentRequestSchema.parse(studentData);
    console.log("Validated student data (without userId):", validatedData);
    
    // First create the user account
    const userData = {
      name: validatedData.fullName,
      email: validatedData.email,
      password: password || "temp123",
      role: "student" as const,
      schoolId: validatedData.schoolId,
      classId: validatedData.classId,
    };
    console.log("Creating user with data:", { ...userData, password: "[HIDDEN]" });
    
    const user = await UserService.createUser(userData);
    console.log("User created successfully:", user);
    
    if (!user || (!user.id && !user._id)) {
      console.error("User creation returned invalid user object:", user);
      throw new Error("User creation failed - no valid user ID returned");
    }
    
    // UserService returns transformed user with 'id' field (not '_id')
    const userId = user.id;
    console.log("Using userId for student:", userId);

    // Now create complete student data with userId
    const completeStudentData = {
      ...validatedData,
      userId: userId,
    };
    
    // Validate complete student data with userId
    const validatedStudentData = insertStudentSchema.parse(completeStudentData);
    console.log("Final validated student data:", validatedStudentData);
    
    const student = await StudentService.createStudent(validatedStudentData);
    console.log("Student created successfully:", student);

    res.status(201).json(student);
  } catch (error) {
    console.error("=== Student Creation Error ===");
    console.error("Error details:", error);
    
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors);
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    
    res.status(500).json({ message: "Failed to create student", error: error.message || error });
  }
});

// Update student
router.put("/:id", async (req, res) => {
  try {
    const updateData = createStudentRequestSchema.partial().parse(req.body);
    const student = await StudentService.updateStudent(req.params.id, updateData);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update student", error });
  }
});

// Update student status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: "Valid status is required (Active or Inactive)" });
    }
    const student = await StudentService.updateStudent(req.params.id, { status });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: "Failed to update student status", error });
  }
});

// Delete student
router.delete("/:id", async (req, res) => {
  try {
    const success = await StudentService.deleteStudent(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete student", error });
  }
});

export default router;