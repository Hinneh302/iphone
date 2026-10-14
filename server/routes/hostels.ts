import { Router, Request, Response } from "express";
import { HostelRepo, ReviewRepo } from "../models/store";
import { authenticate, authorizeRole, optionalAuth, AuthRequest } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

// GET /api/hostels - Search and filter
router.get("/", async (req: Request, res: Response) => {
  try {
    const { search, location, zone, university, minPrice, maxPrice, roomType, ownerId } = req.query;
    const hostels = await HostelRepo.findAll({
      search,
      location,
      zone,
      university,
      minPrice,
      maxPrice,
      roomType,
      ownerId
    });

    return res.json({
      success: true,
      message: `Found ${hostels.length} hostels`,
      data: hostels
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve hostels"
    });
  }
});

// GET /api/hostels/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const hostel = await HostelRepo.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel property not found"
      });
    }

    const reviews = await ReviewRepo.findByHostelId(req.params.id);

    return res.json({
      success: true,
      message: "Hostel retrieved successfully",
      data: {
        ...hostel,
        reviews
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch hostel details"
    });
  }
});

// POST /api/hostels - Add new hostel listing (Owner or Admin)
router.post("/", authenticate, authorizeRole(["owner", "admin"]), async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const body = req.body;

    if (!body.name || !body.location || !body.price) {
      return res.status(400).json({
        success: false,
        message: "Hostel name, location and pricing are required."
      });
    }

    const hostel = await HostelRepo.create({
      ...body,
      ownerId: body.ownerId || ownerId,
      ownerName: body.ownerName || req.user!.name,
      ownerPhone: body.ownerPhone || "+233 24 000 0000",
      ownerWhatsapp: body.ownerWhatsapp || "+233240000000"
    });

    return res.status(201).json({
      success: true,
      message: "Hostel listed successfully!",
      data: hostel
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create hostel listing"
    });
  }
});

// PUT /api/hostels/:id - Update hostel (Owner or Admin)
router.put("/:id", authenticate, authorizeRole(["owner", "admin"]), async (req: AuthRequest, res: Response) => {
  try {
    const hostel = await HostelRepo.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    // Check ownership if not admin
    if (req.user!.role !== "admin" && hostel.ownerId && hostel.ownerId !== req.user!.id) {
      return res.status(403).json({ success: false, message: "Not authorized to update this hostel listing" });
    }

    const updated = await HostelRepo.update(req.params.id, req.body);
    return res.json({
      success: true,
      message: "Hostel listing updated successfully",
      data: updated
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update hostel"
    });
  }
});

// DELETE /api/hostels/:id - Delete hostel (Owner or Admin)
router.delete("/:id", authenticate, authorizeRole(["owner", "admin"]), async (req: AuthRequest, res: Response) => {
  try {
    const hostel = await HostelRepo.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    if (req.user!.role !== "admin" && hostel.ownerId && hostel.ownerId !== req.user!.id) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this hostel" });
    }

    const deleted = await HostelRepo.delete(req.params.id);
    return res.json({
      success: true,
      message: "Hostel deleted successfully"
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to delete hostel"
    });
  }
});

// POST /api/hostels/upload - Upload hostel image file
router.post("/upload", authenticate, authorizeRole(["owner", "admin"]), upload.single("image"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No image file provided"
    });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({
    success: true,
    message: "Image uploaded successfully",
    data: {
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    }
  });
});

// Reviews endpoints
// GET /api/hostels/:id/reviews
router.get("/:id/reviews", async (req: Request, res: Response) => {
  try {
    const reviews = await ReviewRepo.findByHostelId(req.params.id);
    return res.json({
      success: true,
      message: `Retrieved ${reviews.length} reviews`,
      data: reviews
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/hostels/:id/reviews
router.post("/:id/reviews", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: "Rating and comment are required" });
    }

    const review = await ReviewRepo.create({
      hostelId: req.params.id,
      studentId: req.user!.id,
      studentName: req.user!.name,
      rating,
      comment
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully!",
      data: review
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
