import { Router } from "express";
import { SubjectService } from "../services/subject-service";
import { insertSubjectSchema } from "../../shared/mongodb-schemas";
import { z } from "zod";

const router = Router();

// Get all subjects for a school
router.get("/school/:schoolId", async (req, res) => {
  try {
    const subjects = await SubjectService.getSubjectsBySchool(req.params.schoolId);
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subjects", error });
  }
});

// Get subject by ID
router.get("/:id", async (req, res) => {
  try {
    const subject = await SubjectService.getSubject(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subject", error });
  }
});

// Create a new subject
router.post("/", async (req, res) => {
  try {
    const validatedData = insertSubjectSchema.parse(req.body);
    const subject = await SubjectService.createSubject(validatedData);
    res.status(201).json(subject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create subject", error });
  }
});

// Update subject
router.put("/:id", async (req, res) => {
  try {
    const updateData = insertSubjectSchema.partial().parse(req.body);
    const subject = await SubjectService.updateSubject(req.params.id, updateData);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.json(subject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update subject", error });
  }
});

// Delete subject
router.delete("/:id", async (req, res) => {
  try {
    const success = await SubjectService.deleteSubject(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.json({ message: "Subject deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete subject", error });
  }
});

export default router;