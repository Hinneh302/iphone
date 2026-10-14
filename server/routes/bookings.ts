import { Router, Request, Response } from "express";
import { BookingRepo, HostelRepo } from "../models/store";
import { authenticate, authorizeRole, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/bookings - Filter by role: student gets theirs, owner gets for their hostels, admin gets all
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    let bookings = [];

    if (user.role === "admin") {
      bookings = await BookingRepo.findAll();
    } else if (user.role === "owner") {
      bookings = await BookingRepo.findAll({ ownerId: user.id });
    } else {
      bookings = await BookingRepo.findAll({ studentId: user.id });
    }

    return res.json({
      success: true,
      message: `Retrieved ${bookings.length} bookings`,
      data: bookings
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bookings/:id
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await BookingRepo.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking request not found" });
    }
    return res.json({
      success: true,
      message: "Booking retrieved successfully",
      data: booking
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/bookings - Student submits booking request
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { hostelId, roomType, quotedPrice, academicYear, preferredMoveInDate, notes } = req.body;
    if (!hostelId || !roomType) {
      return res.status(400).json({
        success: false,
        message: "Hostel ID and room type are required."
      });
    }

    const hostel = await HostelRepo.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    const newBooking = await BookingRepo.create({
      studentId: req.user!.id,
      hostelId: hostel.id,
      hostelName: hostel.name,
      studentName: req.body.studentName || req.user!.name,
      studentEmail: req.body.studentEmail || req.user!.email,
      studentPhone: req.body.studentPhone || "+233 24 000 0000",
      university: hostel.university,
      roomType,
      quotedPrice: quotedPrice || hostel.price,
      academicYear: academicYear || "2026/2027",
      preferredMoveInDate,
      notes
    });

    return res.status(201).json({
      success: true,
      message: "Room booking request submitted successfully!",
      data: newBooking
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/bookings/:id - Owner or Admin updates status (Approved, Rejected, Cancelled)
router.put("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, paymentStatus } = req.body;
    const booking = await BookingRepo.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Students can cancel their own pending booking
    if (req.user!.role === "student" && booking.studentId === req.user!.id) {
      if (status !== "Cancelled") {
        return res.status(403).json({ success: false, message: "Students can only cancel their booking" });
      }
    }

    const updated = await BookingRepo.updateStatus(req.params.id, status, paymentStatus);
    return res.json({
      success: true,
      message: `Booking request marked as ${status}`,
      data: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/bookings/:id
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await BookingRepo.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (req.user!.role !== "admin" && booking.studentId !== req.user!.id) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this booking" });
    }

    await BookingRepo.delete(req.params.id);
    return res.json({
      success: true,
      message: "Booking record deleted successfully"
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
