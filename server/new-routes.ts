import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import schoolRoutes from "./routes/school-routes";
import teacherRoutes from "./routes/teacher-routes";
import classRoutes from "./routes/class-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API Routes - all prefixed with /api
  
  // School management routes
  app.use("/api/schools", schoolRoutes);
  
  // Teacher management routes
  app.use("/api/teachers", teacherRoutes);
  
  // Class management routes
  app.use("/api/classes", classRoutes);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Server is running" });
  });

  // Create server
  const server = createServer(app);

  return server;
}