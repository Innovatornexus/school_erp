import { Router } from "express";
import { ClassService } from "../services/class-service";
import { insertClassSchema } from "../../shared/mongodb-schemas";
import { z } from "zod";

const router = Router();

// Get all classes for a school
router.get("/school/:schoolId", async (req, res) => {
  try {
    const classes = await ClassService.getClassesBySchool(req.params.schoolId);
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch classes", error });
  }
});

// Get class by ID
router.get("/:id", async (req, res) => {
  try {
    const classItem = await ClassService.getClass(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.json(classItem);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch class", error });
  }
});

// Create a new class
router.post("/", async (req, res) => {
  try {
    const validatedData = insertClassSchema.parse(req.body);
    const classItem = await ClassService.createClass(validatedData);
    res.status(201).json(classItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create class", error });
  }
});

// Update class
router.put("/:id", async (req, res) => {
  try {
    const updateData = insertClassSchema.partial().parse(req.body);
    const classItem = await ClassService.updateClass(req.params.id, updateData);
    if (!classItem) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.json(classItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update class", error });
  }
});

// Delete class
router.delete("/:id", async (req, res) => {
  try {
    const success = await ClassService.deleteClass(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.json({ message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete class", error });
  }
});

export default router;