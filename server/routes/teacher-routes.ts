import { Router } from "express";
import { TeacherService } from "../services/teacher-service";
import { UserService } from "../services/user-service";
import { insertTeacherSchema } from "../../shared/mongodb-schemas";
import { z } from "zod";

// Schema for teacher creation request (without userId)
const createTeacherRequestSchema = insertTeacherSchema.omit({ userId: true });

const router = Router();

// Get all teachers for a school
router.get("/school/:schoolId", async (req, res) => {
  try {
    const teachers = await TeacherService.getTeachersBySchool(req.params.schoolId);
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch teachers", error });
  }
});

// Get teacher by ID
router.get("/:id", async (req, res) => {
  try {
    const teacher = await TeacherService.getTeacher(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch teacher", error });
  }
});

// Create a new teacher
router.post("/", async (req, res) => {
  try {
    console.log("=== Teacher Creation Request ===");
    console.log("Request body:", req.body);
    
    // Extract password from request body
    const { password, ...teacherData } = req.body;
    console.log("Extracted password:", password ? "[PROVIDED]" : "[NOT PROVIDED]");
    console.log("Teacher data:", teacherData);
    
    // Validate teacher data without userId first
    const validatedData = createTeacherRequestSchema.parse(teacherData);
    console.log("Validated teacher data (without userId):", validatedData);
    
    // First create the user account
    const userData = {
      name: validatedData.fullName,
      email: validatedData.email,
      password: password || "temp123",
      role: "teacher",
      schoolId: validatedData.schoolId,
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
    console.log("Using userId for teacher:", userId);

    // Now create complete teacher data with userId
    const completeTeacherData = {
      ...validatedData,
      userId: userId,
    };
    
    // Validate complete teacher data with userId
    const validatedTeacherData = insertTeacherSchema.parse(completeTeacherData);
    console.log("Final validated teacher data:", validatedTeacherData);
    
    const teacher = await TeacherService.createTeacher(validatedTeacherData);
    console.log("Teacher created successfully:", teacher);

    res.status(201).json(teacher);
  } catch (error) {
    console.error("=== Teacher Creation Error ===");
    console.error("Error details:", error);
    
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors);
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    
    res.status(500).json({ message: "Failed to create teacher", error: error.message || error });
  }
});

// Update teacher
router.put("/:id", async (req, res) => {
  try {
    const updateData = insertTeacherSchema.partial().parse(req.body);
    const teacher = await TeacherService.updateTeacher(req.params.id, updateData);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json(teacher);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update teacher", error });
  }
});

// Delete teacher
router.delete("/:id", async (req, res) => {
  try {
    const success = await TeacherService.deleteTeacher(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete teacher", error });
  }
});

export default router;