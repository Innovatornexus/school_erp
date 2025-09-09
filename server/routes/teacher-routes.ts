import { Router } from "express";
import { TeacherService } from "../services/teacher-service";
import { UserService } from "../services/user-service";
import { insertTeacherSchema } from "../../shared/mongodb-schemas";
import { z } from "zod";

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
    // Extract password from request body
    const { password, ...teacherData } = req.body;
    const validatedData = insertTeacherSchema.parse(teacherData);
    
    // First create the user account
    const user = await UserService.createUser({
      name: validatedData.fullName,
      email: validatedData.email,
      password: password || "temp123", // Use provided password or default
      role: "teacher",
      schoolId: validatedData.schoolId,
    });

    // Then create the teacher profile
    const teacher = await TeacherService.createTeacher({
      ...validatedData,
      userId: user.id,
    });

    res.status(201).json(teacher);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create teacher", error });
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