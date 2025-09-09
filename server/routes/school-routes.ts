import { Router } from "express";
import { SchoolService } from "../services/school-service";
import { insertSchoolSchema } from "../../shared/mongodb-schemas";
import { z } from "zod";

const router = Router();

// Get all schools (super admin only)
router.get("/", async (req, res) => {
  try {
    const schools = await SchoolService.getSchools();
    res.json(schools);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch schools", error });
  }
});

// Get school by ID
router.get("/:id", async (req, res) => {
  try {
    const school = await SchoolService.getSchool(req.params.id);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }
    res.json(school);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch school", error });
  }
});

// Create a new school
router.post("/", async (req, res) => {
  try {
    const validatedData = insertSchoolSchema.parse(req.body);
    const school = await SchoolService.createSchool(validatedData);
    res.status(201).json(school);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create school", error });
  }
});

// Update school
router.put("/:id", async (req, res) => {
  try {
    const updateData = insertSchoolSchema.partial().parse(req.body);
    const school = await SchoolService.updateSchool(req.params.id, updateData);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }
    res.json(school);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update school", error });
  }
});

export default router;