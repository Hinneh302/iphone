import { Router, Response } from "express";
import { UserRepo, HostelRepo, BookingRepo, InquiryRepo } from "../models/store";
import { authenticate, authorizeRole, AuthRequest } from "../middleware/auth";

const router = Router();

// Only admin can access these endpoints
router.use(authenticate, authorizeRole(["admin"]));

// GET /api/admin/stats - Overview statistics
router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const allUsers = await UserRepo.findAll();
    const allHostels = await HostelRepo.findAll();
    const allBookings = await BookingRepo.findAll();
    const allInquiries = await InquiryRepo.findAll();

    return res.json({
      success: true,
      message: "Admin statistics retrieved",
      data: {
        totalUsers: allUsers.length,
        studentsCount: allUsers.filter(u => u.role === "student").length,
        ownersCount: allUsers.filter(u => u.role === "owner").length,
        totalHostels: allHostels.length,
        pendingVerification: allHostels.filter(h => h.status === "pending").length,
        totalBookings: allBookings.length,
        pendingBookings: allBookings.filter(b => b.status === "Pending Review").length,
        totalInquiries: allInquiries.length
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users - Get all registered accounts
router.get("/users", async (req: AuthRequest, res: Response) => {
  try {
    const users = await UserRepo.findAll();
    return res.json({
      success: true,
      message: `Retrieved ${users.length} registered accounts`,
      data: users
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id/status - Suspend or activate user
router.put("/users/:id/status", async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status || !["active", "suspended"].includes(status)) {
      return res.status(400).json({ success: false, message: "Valid status (active, suspended) is required" });
    }
    const updated = await UserRepo.updateStatus(req.params.id, status);
    return res.json({
      success: true,
      message: `User status changed to ${status}`,
      data: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/hostels/:id/verify - Approve or reject hostel
router.put("/hostels/:id/verify", async (req: AuthRequest, res: Response) => {
  try {
    const { verified, status } = req.body;
    const updated = await HostelRepo.update(req.params.id, {
      verified: verified !== undefined ? verified : true,
      status: status || "approved"
    });
    return res.json({
      success: true,
      message: "Hostel verification status updated",
      data: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
