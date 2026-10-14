import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { isUsingMySql, getMySqlPool } from "../config/db";

const DATA_DIR = path.resolve(process.cwd(), "server", "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const UPLOADS_DIR = path.resolve(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory / JSON persistence stores
let users: any[] = [];
let hostels: any[] = [];
let bookings: any[] = [];
let inquiries: any[] = [];
let favourites: any[] = [];
let reviews: any[] = [];
let rooms: any[] = [];

const USERS_FILE = path.join(DATA_DIR, "users.json");
const HOSTELS_FILE = path.join(DATA_DIR, "hostels.json");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const INQUIRIES_FILE = path.join(DATA_DIR, "inquiries.json");
const FAVOURITES_FILE = path.join(DATA_DIR, "favourites.json");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");
const ROOMS_FILE = path.join(DATA_DIR, "rooms.json");

function loadJson(filePath: string, defaultVal: any) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (err) {
    console.warn(`Could not read ${filePath}, using defaults:`, err);
  }
  return defaultVal;
}

function saveJson(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Failed to save ${filePath}:`, err);
  }
}

// Default Seed Data
const DEFAULT_USERS = [
  {
    id: "usr-student",
    name: "Kwame Boateng",
    email: "student@ug.edu.gh",
    password: bcrypt.hashSync("password123", 10),
    phone: "+233 24 123 4567",
    role: "student",
    university: "KNUST",
    studentId: "10982344",
    level: "Level 300",
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-owner",
    name: "Mr. Kofi Mensah",
    email: "owner@hostels.gh",
    password: bcrypt.hashSync("password123", 10),
    phone: "+233 24 456 7890",
    role: "owner",
    university: "KNUST",
    businessName: "Mensah Hostels & Accommodations",
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-admin",
    name: "Ama Serwaa",
    email: "admin@hostelhub.gh",
    password: bcrypt.hashSync("adminpassword", 10),
    phone: "+233 24 999 8888",
    role: "admin",
    status: "active",
    createdAt: new Date().toISOString()
  }
];

export async function initStorageEngine() {
  users = loadJson(USERS_FILE, DEFAULT_USERS);
  
  // Seed hostels from seed-hostels.json if hostels.json doesn't exist
  let seedHostels: any[] = [];
  const seedFile = path.join(DATA_DIR, "seed-hostels.json");
  if (fs.existsSync(seedFile)) {
    seedHostels = loadJson(seedFile, []);
  }

  hostels = loadJson(HOSTELS_FILE, seedHostels);
  if (hostels.length === 0 && seedHostels.length > 0) {
    hostels = seedHostels;
    saveJson(HOSTELS_FILE, hostels);
  }

  // Ensure ownerId is attached to seed hostels
  hostels = hostels.map((h, i) => {
    if (!h.ownerId) {
      h.ownerId = "usr-owner";
    }
    if (!h.status) {
      h.status = "approved";
    }
    return h;
  });

  bookings = loadJson(BOOKINGS_FILE, [
    {
      id: "req-101",
      studentId: "usr-student",
      hostelId: "knust-01",
      hostelName: "Brunei Complex (Hall 7)",
      studentName: "Kwame Mensah",
      studentEmail: "kmensah@st.knust.edu.gh",
      studentPhone: "+233 24 333 4455",
      university: "KNUST",
      roomType: "2 in a room",
      quotedPrice: 5800,
      academicYear: "2026 / 2027",
      status: "Approved",
      paymentStatus: "Deposit Paid (GH₵ 2,000)",
      bookingDate: "2026-09-08",
      createdAt: new Date("2026-09-08").toISOString()
    },
    {
      id: "req-102",
      studentId: "usr-student",
      hostelId: "knust-21",
      hostelName: "Wagyingo Student Lodge",
      studentName: "Kwame Mensah",
      studentEmail: "kmensah@st.knust.edu.gh",
      studentPhone: "+233 24 333 4455",
      university: "KNUST",
      roomType: "1 in a room",
      quotedPrice: 9000,
      academicYear: "2026 / 2027",
      status: "Pending Review",
      paymentStatus: "Awaiting Owner Approval",
      bookingDate: "2026-09-12",
      createdAt: new Date("2026-09-12").toISOString()
    }
  ]);

  inquiries = loadJson(INQUIRIES_FILE, [
    {
      id: "inq-01",
      hostelId: "knust-01",
      hostelName: "Brunei Complex (Hall 7)",
      studentId: "usr-student",
      studentName: "Kwame Mensah",
      studentEmail: "kmensah@st.knust.edu.gh",
      studentPhone: "+233 24 333 4455",
      university: "KNUST",
      roomTypeNeeded: "2 in a room",
      message: "Hello Alhaji Yakubu, I am a Level 300 Electrical Engineering student. Do you have a 2 in a room option on the 2nd floor facing the Brunei gate?",
      status: "Replied",
      reply: "Hello Kwame, yes we have 2 rooms on the 2nd floor available. Please call or WhatsApp me on +233 24 333 4455 to arrange room inspection.",
      date: "2026-09-10",
      createdAt: new Date("2026-09-10").toISOString()
    }
  ]);

  favourites = loadJson(FAVOURITES_FILE, [
    { studentId: "usr-student", hostelId: "knust-01" },
    { studentId: "usr-student", hostelId: "knust-11" },
    { studentId: "usr-student", hostelId: "knust-21" }
  ]);

  reviews = loadJson(REVIEWS_FILE, [
    {
      id: "rev-01",
      hostelId: "knust-01",
      studentId: "usr-student",
      studentName: "Kwame Boateng",
      rating: 5,
      comment: "Super close to Brunei gate and Engineering faculty. Constant water supply and great security.",
      date: "2026-09-01",
      createdAt: new Date("2026-09-01").toISOString()
    }
  ]);

  rooms = loadJson(ROOMS_FILE, []);

  // Save all back to ensure files exist
  saveJson(USERS_FILE, users);
  saveJson(HOSTELS_FILE, hostels);
  saveJson(BOOKINGS_FILE, bookings);
  saveJson(INQUIRIES_FILE, inquiries);
  saveJson(FAVOURITES_FILE, favourites);
  saveJson(REVIEWS_FILE, reviews);
  saveJson(ROOMS_FILE, rooms);

  // If MySQL is active, sync database tables
  if (isUsingMySql()) {
    await syncToMySql();
  }
}

async function syncToMySql() {
  const pool = getMySqlPool();
  if (!pool) return;
  try {
    console.log("[Database] Synchronizing data schema with MySQL...");
    // Read schema file if exists and execute
    const schemaPath = path.resolve(process.cwd(), "database.sql");
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, "utf-8");
      const statements = sql
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith("--") && !s.toLowerCase().startsWith("create database") && !s.toLowerCase().startsWith("use "));
      
      for (const st of statements) {
        try {
          await pool.query(st);
        } catch (e) {
          // ignore already exists errors
        }
      }
    }
  } catch (err) {
    console.warn("[Database] MySQL sync note:", err.message);
  }
}

// ----------------- USER REPOSITORY -----------------
export const UserRepo = {
  findAll: async () => {
    if (isUsingMySql()) {
      try {
        const [rows] = await getMySqlPool()!.query("SELECT id, name, email, phone, role, university, student_id as studentId, level, business_name as businessName, status, created_at as createdAt FROM users");
        return rows as any[];
      } catch (err) {
        console.warn("MySql query failed, falling back to local store:", err);
      }
    }
    return users.map(u => ({ ...u, password: "[PROTECTED]" }));
  },

  findById: async (id: string) => {
    if (isUsingMySql()) {
      try {
        const [rows]: any = await getMySqlPool()!.query("SELECT id, name, email, phone, role, university, student_id as studentId, level, business_name as businessName, status, created_at as createdAt FROM users WHERE id = ?", [id]);
        return rows[0] || null;
      } catch (err) {
        console.warn(err);
      }
    }
    return users.find(u => u.id === id) || null;
  },

  findByEmail: async (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    if (isUsingMySql()) {
      try {
        const [rows]: any = await getMySqlPool()!.query("SELECT * FROM users WHERE LOWER(email) = ?", [cleanEmail]);
        if (rows[0]) {
          return {
            id: rows[0].id,
            name: rows[0].name,
            email: rows[0].email,
            password: rows[0].password,
            phone: rows[0].phone,
            role: rows[0].role,
            university: rows[0].university,
            studentId: rows[0].student_id,
            level: rows[0].level,
            businessName: rows[0].business_name,
            status: rows[0].status,
            createdAt: rows[0].created_at
          };
        }
      } catch (err) {
        console.warn(err);
      }
    }
    return users.find(u => u.email.toLowerCase() === cleanEmail) || null;
  },

  create: async (userData: any) => {
    const id = userData.id || ("usr-" + Date.now());
    const newUser = {
      id,
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      phone: userData.phone,
      role: userData.role || "student",
      university: userData.university || "KNUST",
      studentId: userData.studentId || null,
      level: userData.level || "Level 100",
      businessName: userData.businessName || null,
      status: "active",
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveJson(USERS_FILE, users);

    if (isUsingMySql()) {
      try {
        await getMySqlPool()!.query(
          "INSERT INTO users (id, name, email, password, phone, role, university, student_id, level, business_name, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [newUser.id, newUser.name, newUser.email, newUser.password, newUser.phone, newUser.role, newUser.university, newUser.studentId, newUser.level, newUser.businessName, newUser.status]
        );
      } catch (e) {
        console.warn("MySql insert user error:", e);
      }
    }

    const { password, ...safeUser } = newUser;
    return safeUser;
  },

  updateStatus: async (id: string, status: string) => {
    const user = users.find(u => u.id === id);
    if (user) {
      user.status = status;
      saveJson(USERS_FILE, users);
    }
    if (isUsingMySql()) {
      try {
        await getMySqlPool()!.query("UPDATE users SET status = ? WHERE id = ?", [status, id]);
      } catch (e) {
        console.warn(e);
      }
    }
    return user;
  }
};

// ----------------- HOSTEL REPOSITORY -----------------
export const HostelRepo = {
  findAll: async (filters: any = {}) => {
    let list = [...hostels];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(h => 
        (h.name && h.name.toLowerCase().includes(q)) ||
        (h.location && h.location.toLowerCase().includes(q)) ||
        (h.zone && h.zone.toLowerCase().includes(q)) ||
        (h.description && h.description.toLowerCase().includes(q))
      );
    }

    if (filters.location) {
      const loc = filters.location.toLowerCase();
      list = list.filter(h => 
        (h.location && h.location.toLowerCase().includes(loc)) ||
        (h.zone && h.zone.toLowerCase().includes(loc)) ||
        (h.city && h.city.toLowerCase().includes(loc))
      );
    }

    if (filters.zone) {
      const z = filters.zone.toLowerCase();
      list = list.filter(h => h.zone && h.zone.toLowerCase() === z);
    }

    if (filters.university) {
      const u = filters.university.toLowerCase();
      list = list.filter(h => 
        (h.university && h.university.toLowerCase().includes(u)) ||
        (h.uniCode && h.uniCode.toLowerCase() === u)
      );
    }

    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      if (!isNaN(min)) list = list.filter(h => h.price >= min);
    }

    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      if (!isNaN(max)) list = list.filter(h => h.price <= max);
    }

    if (filters.roomType) {
      const rt = filters.roomType.toLowerCase();
      list = list.filter(h => 
        (h.roomTypes && h.roomTypes.some((t: string) => t.toLowerCase().includes(rt)))
      );
    }

    if (filters.ownerId) {
      list = list.filter(h => h.ownerId === filters.ownerId);
    }

    return list;
  },

  findById: async (id: string) => {
    return hostels.find(h => h.id === id) || null;
  },

  create: async (data: any) => {
    const id = data.id || ("hostel-" + Date.now());
    const newHostel = {
      ...data,
      id,
      rating: data.rating || 4.5,
      reviewsCount: data.reviewsCount || 1,
      availableRooms: data.availableRooms !== undefined ? parseInt(data.availableRooms, 10) : 6,
      totalRooms: data.totalRooms ? parseInt(data.totalRooms, 10) : 40,
      verified: true,
      status: "approved",
      createdAt: new Date().toISOString()
    };

    hostels.unshift(newHostel);
    saveJson(HOSTELS_FILE, hostels);
    return newHostel;
  },

  update: async (id: string, updates: any) => {
    const idx = hostels.findIndex(h => h.id === id);
    if (idx === -1) return null;
    hostels[idx] = { ...hostels[idx], ...updates, updatedAt: new Date().toISOString() };
    saveJson(HOSTELS_FILE, hostels);
    return hostels[idx];
  },

  delete: async (id: string) => {
    const initialLen = hostels.length;
    hostels = hostels.filter(h => h.id !== id);
    if (hostels.length !== initialLen) {
      saveJson(HOSTELS_FILE, hostels);
      return true;
    }
    return false;
  }
};

// ----------------- BOOKINGS REPOSITORY -----------------
export const BookingRepo = {
  findAll: async (filters: any = {}) => {
    let list = [...bookings];
    if (filters.studentId) list = list.filter(b => b.studentId === filters.studentId);
    if (filters.hostelId) list = list.filter(b => b.hostelId === filters.hostelId);
    if (filters.ownerId) {
      // Find hostels owned by ownerId
      const ownerHostelIds = hostels.filter(h => h.ownerId === filters.ownerId).map(h => h.id);
      list = list.filter(b => ownerHostelIds.includes(b.hostelId));
    }
    return list;
  },

  findById: async (id: string) => {
    return bookings.find(b => b.id === id) || null;
  },

  create: async (data: any) => {
    const id = data.id || ("req-" + Date.now().toString().slice(-4));
    const newBooking = {
      id,
      studentId: data.studentId || null,
      hostelId: data.hostelId,
      hostelName: data.hostelName || "Hostel",
      studentName: data.studentName,
      studentEmail: data.studentEmail,
      studentPhone: data.studentPhone,
      university: data.university || "KNUST",
      roomType: data.roomType,
      quotedPrice: data.quotedPrice || 5000,
      academicYear: data.academicYear || "2026/2027",
      preferredMoveInDate: data.preferredMoveInDate || null,
      notes: data.notes || "",
      status: "Pending Review",
      paymentStatus: "Awaiting Owner Approval",
      bookingDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString()
    };
    bookings.unshift(newBooking);
    saveJson(BOOKINGS_FILE, bookings);
    return newBooking;
  },

  updateStatus: async (id: string, status: string, paymentStatus?: string) => {
    const item = bookings.find(b => b.id === id);
    if (!item) return null;
    item.status = status;
    if (paymentStatus) item.paymentStatus = paymentStatus;
    saveJson(BOOKINGS_FILE, bookings);
    return item;
  },

  delete: async (id: string) => {
    const prev = bookings.length;
    bookings = bookings.filter(b => b.id !== id);
    if (bookings.length !== prev) {
      saveJson(BOOKINGS_FILE, bookings);
      return true;
    }
    return false;
  }
};

// ----------------- FAVOURITES REPOSITORY -----------------
export const FavouriteRepo = {
  getUserFavourites: async (studentId: string) => {
    const userFavs = favourites.filter(f => f.studentId === studentId);
    const hostelIds = userFavs.map(f => f.hostelId);
    return hostels.filter(h => hostelIds.includes(h.id));
  },

  add: async (studentId: string, hostelId: string) => {
    const exists = favourites.some(f => f.studentId === studentId && f.hostelId === hostelId);
    if (!exists) {
      favourites.push({ studentId, hostelId, createdAt: new Date().toISOString() });
      saveJson(FAVOURITES_FILE, favourites);
    }
    return true;
  },

  remove: async (studentId: string, hostelId: string) => {
    favourites = favourites.filter(f => !(f.studentId === studentId && f.hostelId === hostelId));
    saveJson(FAVOURITES_FILE, favourites);
    return true;
  },

  isFavourite: async (studentId: string, hostelId: string) => {
    return favourites.some(f => f.studentId === studentId && f.hostelId === hostelId);
  }
};

// ----------------- REVIEWS REPOSITORY -----------------
export const ReviewRepo = {
  findByHostelId: async (hostelId: string) => {
    return reviews.filter(r => r.hostelId === hostelId);
  },

  create: async (data: any) => {
    const id = "rev-" + Date.now();
    const newRev = {
      id,
      hostelId: data.hostelId,
      studentId: data.studentId || null,
      studentName: data.studentName || "Verified Student",
      rating: parseInt(data.rating, 10) || 5,
      comment: data.comment || "",
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString()
    };
    reviews.unshift(newRev);
    saveJson(REVIEWS_FILE, reviews);

    // Recalculate average rating on the hostel
    const hostelRevs = reviews.filter(r => r.hostelId === data.hostelId);
    const avg = hostelRevs.reduce((acc, r) => acc + r.rating, 0) / hostelRevs.length;
    const hostel = hostels.find(h => h.id === data.hostelId);
    if (hostel) {
      hostel.rating = parseFloat(avg.toFixed(1));
      hostel.reviewsCount = hostelRevs.length;
      saveJson(HOSTELS_FILE, hostels);
    }

    return newRev;
  }
};

// ----------------- INQUIRIES REPOSITORY -----------------
export const InquiryRepo = {
  findAll: async (filters: any = {}) => {
    let list = [...inquiries];
    if (filters.studentId) list = list.filter(i => i.studentId === filters.studentId);
    if (filters.hostelId) list = list.filter(i => i.hostelId === filters.hostelId);
    if (filters.ownerId) {
      const ownerHostelIds = hostels.filter(h => h.ownerId === filters.ownerId).map(h => h.id);
      list = list.filter(i => ownerHostelIds.includes(i.hostelId));
    }
    return list;
  },

  create: async (data: any) => {
    const id = "inq-" + Date.now();
    const newInq = {
      id,
      hostelId: data.hostelId,
      hostelName: data.hostelName,
      studentId: data.studentId || null,
      studentName: data.studentName,
      studentEmail: data.studentEmail,
      studentPhone: data.studentPhone,
      university: data.university || "KNUST",
      roomTypeNeeded: data.roomTypeNeeded || "2 in a room",
      message: data.message,
      status: "Pending Response",
      reply: "",
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString()
    };
    inquiries.unshift(newInq);
    saveJson(INQUIRIES_FILE, inquiries);
    return newInq;
  },

  reply: async (id: string, replyText: string) => {
    const inq = inquiries.find(i => i.id === id);
    if (!inq) return null;
    inq.reply = replyText;
    inq.status = "Replied";
    saveJson(INQUIRIES_FILE, inquiries);
    return inq;
  }
};
