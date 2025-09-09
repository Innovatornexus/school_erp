import { Router } from "express";
// import { StudentService } from "../services/student-service";
// Student schema not yet defined
import { z } from "zod";

const router = Router();

// Get all students for a school
router.get("/school/:schoolId", async (req, res) => {
  try {
    // TODO: Implement when student service is ready
    const students = []; // Placeholder
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
    const validatedData = req.body; // TODO: Add validation when schema is ready
    const student = await StudentService.createStudent(validatedData);
    res.status(201).json(student);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create student", error });
  }
});

// Update student
router.put("/:id", async (req, res) => {
  try {
    const updateData = req.body; // TODO: Add validation when schema is ready
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
    const student = await StudentService.updateStudentStatus(req.params.id, status);
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