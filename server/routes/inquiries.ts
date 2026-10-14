import { Router, Request, Response } from "express";
import { InquiryRepo, HostelRepo } from "../models/store";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/inquiries
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    let list = [];
    if (user.role === "admin") {
      list = await InquiryRepo.findAll();
    } else if (user.role === "owner") {
      list = await InquiryRepo.findAll({ ownerId: user.id });
    } else {
      list = await InquiryRepo.findAll({ studentId: user.id });
    }
    return res.json({
      success: true,
      message: `Retrieved ${list.length} inquiries`,
      data: list
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/inquiries
router.post("/", async (req: Request, res: Response) => {
  try {
    const { hostelId, studentName, studentEmail, studentPhone, roomTypeNeeded, message } = req.body;
    if (!hostelId || !studentName || !message) {
      return res.status(400).json({ success: false, message: "Hostel, your name, and message are required" });
    }

    const hostel = await HostelRepo.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    const newInq = await InquiryRepo.create({
      hostelId,
      hostelName: hostel.name,
      studentName,
      studentEmail,
      studentPhone,
      roomTypeNeeded,
      message,
      university: hostel.university
    });

    return res.status(201).json({
      success: true,
      message: "Inquiry sent to hostel owner!",
      data: newInq
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/inquiries/:id/reply - Owner or Admin reply
router.put("/:id/reply", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { reply } = req.body;
    if (!reply) {
      return res.status(400).json({ success: false, message: "Reply message is required" });
    }
    const updated = await InquiryRepo.reply(req.params.id, reply);
    return res.json({
      success: true,
      message: "Reply sent to student!",
      data: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
