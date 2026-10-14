import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserRepo } from "../models/store";
import { generateToken, authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, university, studentId, level, businessName, password, confirmPassword, role } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, phone, and password are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long."
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match."
      });
    }

    const existing = await UserRepo.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = (role === "owner" || role === "admin") ? role : "student";

    const user = await UserRepo.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: assignedRole,
      university: university || "KNUST",
      studentId: assignedRole === "student" ? (studentId || "GH-" + Math.floor(100000 + Math.random() * 900000)) : null,
      level: assignedRole === "student" ? (level || "Level 100") : null,
      businessName: assignedRole === "owner" ? (businessName || `${name} Properties`) : null
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful!",
      data: {
        token,
        user
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to register user."
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const user = await UserRepo.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Account not found."
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "This account has been suspended by system administration."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Please try again."
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    const { password: _, ...safeUser } = user;

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      data: {
        token,
        user: safeUser
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Login failed."
    });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserRepo.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const { password, ...safeUser } = user;
    return res.json({
      success: true,
      message: "Current user profile retrieved",
      data: safeUser
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
