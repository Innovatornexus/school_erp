import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { z } from "zod";
import type { User as AppUser } from "../shared/schema";

declare global {
  namespace Express {
    interface User extends AppUser {}
    interface Request {
      user?: User;
    }
  }
}

const scryptAsync = promisify(scrypt);

// Password hashing function
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Password comparison function
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// User registration schema with validation
const registrationSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters"),
    role: z.enum(["super_admin", "school_admin"]),
    schoolName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => !(data.role === "school_admin" && !data.schoolName), {
    message: "School name is required for school admin registration",
    path: ["schoolName"],
  });

// User registration schema with validation
const UserregistrationSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters"),
    role: z.enum(["super_admin", "school_admin", "student", "staff"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Set up authentication middleware and routes
export function setupAuth(app: Express) {
  // Configure session middleware
  const sessionSecret =
    process.env.SESSION_SECRET || "school-management-system-secret";
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport to use local strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Serialize user to the session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user && user.role === "school_admin") {
        const schoolAdmin = await storage.getSchoolAdminByUserId(user._id.toString());
        if (schoolAdmin) {
          (user as any).school_id = user.schoolId;
        }
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // New API route handler for user registration
  // app.post("/api/register/user_student", async (req, res, next) => {
  //   try {
  //     console.log("calling POST /api/register...");
  //     // 1. Validate input
  //     const validatedData = UserregistrationSchema.parse(req.body);
  //     console.log("validation user student ::", validatedData);

  //     const { confirmPassword, ...userData } = validatedData;

  //     // 2. Check if user already exists
  //     const existingUser = await storage.getUserByEmail(userData.email);
  //     if (existingUser) {
  //       return res.status(400).json({ message: "Email already exists" });
  //     }

  //     // 3. Hash password
  //     const hashedPassword = await hashPassword(userData.password);

  //     // Call the updated storage function
  //     const newUser = await storage.createUser(userData);
  //     res.status(201).json(newUser);
  //   } catch (err) {
  //     if (err instanceof z.ZodError) {
  //       // Return validation errors
  //       console.log("api/register/user_student error log ::", err.errors);
  //       return res.status(400).json({
  //         message: "Validation failed",
  //         errors: err.errors,
  //       });
  //     }

  //     // Check for the specific error message from the storage layer
  //     if (
  //       typeof err === "object" &&
  //       err !== null &&
  //       "message" in err &&
  //       typeof (err as any).message === "string" &&
  //       (err as any).message.includes("User with this email already exists")
  //     ) {
  //       return res.status(409).json({ message: (err as any).message });
  //     }

  //     next(err);
  //   }
  // });  not in use

  app.post("/api/register/user", async (req, res, next) => {
    try {
      console.log("calling POST /api/register/user_staff...");

      // 1. Validate input
      const validatedData = UserregistrationSchema.parse(req.body);
      console.log("validation user staff/student ::", validatedData);

      const { confirmPassword, ...userData } = validatedData;

      // 2. Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // 3. Hash password
      const hashedPassword = await hashPassword(userData.password);

      // 4. Create user with hashed password
      const newUser = await storage.createUser({
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        name: userData.name,
      });

      console.log("new user ::", newUser);
      res.status(201).json(newUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.log("api/register/user_staff error log ::", err.errors);
        return res.status(400).json({
          message: "Validation failed",
          errors: err.errors,
        });
      }

      next(err);
    }
  });

  // User registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("calling POST /api/register...");
      // Validate registration data
      const validatedData = registrationSchema.parse(req.body);
      console.log("validation user ::", validatedData);
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);

      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Remove confirmPassword as it's not needed in the database
      const { confirmPassword, schoolName, ...userData } = validatedData;

      // Create new user with hashed password
      const hashedPassword = await hashPassword(userData.password);
      const newUser = await storage.createUser({
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        name: userData.name,
      });

      console.log("new user ::", newUser);

      // Handle school admin registration with school creation
      if (userData.role === "school_admin" && schoolName) {
        // Create a new school for the school admin
        const school = await storage.createSchool({
          name: schoolName,
          address: "", // These will be updated later by the admin
          contact_email: userData.email,
          contact_phone: "",
        });

        // Create school_admin record linking the user and school
        await storage.createSchoolAdmin({
          user_id: newUser._id.toString(),
          school_id: school._id.toString(),
          full_name: userData.name,
          phone_number: "", // This will be updated later
        });
      }

      // Auto-login after registration
      req.login(newUser, (err) => {
        if (err) return next(err);
        // Return user data without password
        const { password, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Return validation errors
        console.log("api/register error log ::", err.errors);
        return res.status(400).json({
          message: "Validation failed",
          errors: err.errors,
        });
      }
      next(err);
    }
  });

  // User login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res
          .status(401)
          .json({ message: info?.message || "Invalid email or password" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user data without password
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // User logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user data endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Return user data without password
    const { password, ...userWithoutPassword } = req.user as AppUser;
    res.json(userWithoutPassword);
  });

  // Middleware for role-based access control
  const requireRole = (roles: string[]) => {
    return (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user as AppUser;
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      next();
    };
  };

  // Export the role-based middleware
  app.locals.requireRole = requireRole;
}
