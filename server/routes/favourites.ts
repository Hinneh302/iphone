import { Router, Response } from "express";
import { FavouriteRepo } from "../models/store";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/favourites - List current user's favourite hostels
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const list = await FavouriteRepo.getUserFavourites(req.user!.id);
    return res.json({
      success: true,
      message: `Retrieved ${list.length} favourite hostels`,
      data: list
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/favourites - Add hostel to favourites
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { hostelId } = req.body;
    if (!hostelId) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }
    await FavouriteRepo.add(req.user!.id, hostelId);
    return res.json({
      success: true,
      message: "Hostel added to your favourites!"
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/favourites/:hostelId - Remove hostel from favourites
router.delete("/:hostelId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await FavouriteRepo.remove(req.user!.id, req.params.hostelId);
    return res.json({
      success: true,
      message: "Hostel removed from favourites"
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
