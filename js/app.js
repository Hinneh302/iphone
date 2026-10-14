/**
 * HostelHub KNUST - Main Application Script
 * 40 Verified Student Hostels across Ayeduase, Kotei, New Site, and Bomso
 * Shared utilities, demo data persistence in LocalStorage,
 * toast notifications, and global UI components.
 */

import { KNUST_HOSTELS, KNUST_ZONES, KNUST_CAMPUS } from "./knust-data.js";
import { HostelApi, BookingApi, InquiryApi, FavouriteApi } from "./api.js";

// ==========================================================================
// 1. Initial KNUST Seed Data (40 Hostels across Ayeduase, Kotei, New Site, Bomso)
// ==========================================================================
const INITIAL_HOSTELS = KNUST_HOSTELS;
const INITIAL_UNIVERSITIES = [KNUST_CAMPUS];
const INITIAL_ZONES = KNUST_ZONES;

const INITIAL_INQUIRIES = [
  {
    id: "inq-01",
    hostelId: "knust-01",
    hostelName: "Brunei Complex (Hall 7)",
    studentName: "Kwame Mensah",
    studentEmail: "kmensah@st.knust.edu.gh",
    studentPhone: "+233 24 333 4455",
    university: "KNUST",
    roomTypeNeeded: "2 in a room",
    message: "Hello Alhaji Yakubu, I am a Level 300 Electrical Engineering student. Do you have a 2 in a room option on the 2nd floor facing the Brunei gate?",
    status: "Replied",
    reply: "Hello Kwame, yes we have 2 rooms on the 2nd floor available. Please call or WhatsApp me on +233 24 333 4455 to arrange room inspection.",
    date: "2026-09-10"
  },
  {
    id: "inq-02",
    hostelId: "knust-11",
    hostelName: "Frontline Executive Hostel",
    studentName: "Abena Serwaa",
    studentEmail: "abena.s@st.knust.edu.gh",
    studentPhone: "+233 50 987 6543",
    university: "KNUST",
    roomTypeNeeded: "1 in a room",
    message: "Good day Dr. Adjei, does the hostel shuttle run every hour during exam periods to the Central Classroom Block (CCB)?",
    status: "Pending Response",
    reply: "",
    date: "2026-09-12"
  },
  {
    id: "inq-03",
    hostelId: "knust-31",
    hostelName: "Supertech Hostel (Bomso Gate)",
    studentName: "Emmanuel Darko",
    studentEmail: "darko.e@st.knust.edu.gh",
    studentPhone: "+233 27 345 6789",
    university: "KNUST",
    roomTypeNeeded: "2 in a room",
    message: "Are executive double rooms still open for CABE Architecture students for 2026/2027?",
    status: "Pending Response",
    reply: "",
    date: "2026-09-13"
  }
];

const INITIAL_BOOKINGS = [
  {
    id: "req-101",
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
    bookingDate: "2026-09-08"
  },
  {
    id: "req-102",
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
    bookingDate: "2026-09-12"
  }
];

const INITIAL_REPORTS = [
  {
    id: "rep-01",
    hostelId: "knust-21",
    hostelName: "Wagyingo Student Lodge",
    studentName: "Kofi Owusu",
    issue: "Water Pump Issue",
    details: "The second floor water tank pump was down for 1 day. The owner fixed it promptly with the technician.",
    status: "Resolved",
    date: "2026-09-05"
  },
  {
    id: "rep-02",
    hostelId: "knust-11",
    hostelName: "Frontline Executive Hostel",
    studentName: "Serwaa Frimpong",
    issue: "Shuttle Schedule Notification",
    details: "Please update the weekend shuttle departure schedule from Kotei to KNUST Commercial Area.",
    status: "Investigating",
    date: "2026-09-11"
  }
];

// ==========================================================================
// 2. LocalStorage Storage Management Functions
// ==========================================================================
const DATA_VERSION = "knust_40_v3";

export function initStorage() {
  const currentVersion = localStorage.getItem("hostelhub_version");

  if (currentVersion !== DATA_VERSION) {
    localStorage.setItem("hostelhub_hostels", JSON.stringify(INITIAL_HOSTELS));
    localStorage.setItem("hostelhub_universities", JSON.stringify(INITIAL_UNIVERSITIES));
    localStorage.setItem("hostelhub_zones", JSON.stringify(INITIAL_ZONES));
    localStorage.setItem("hostelhub_inquiries", JSON.stringify(INITIAL_INQUIRIES));
    localStorage.setItem("hostelhub_bookings", JSON.stringify(INITIAL_BOOKINGS));
    localStorage.setItem("hostelhub_reports", JSON.stringify(INITIAL_REPORTS));
    localStorage.setItem("hostelhub_favorites", JSON.stringify(["knust-01", "knust-11", "knust-21"]));
    localStorage.setItem("hostelhub_recent", JSON.stringify(["knust-01", "knust-11", "knust-21", "knust-31"]));
    localStorage.setItem("hostelhub_user", JSON.stringify({
      id: "usr-student",
      name: "Kwame Mensah",
      email: "kmensah@st.knust.edu.gh",
      phone: "+233 24 333 4455",
      role: "student",
      university: "KNUST",
      studentId: "20874521",
      level: "Level 300 Computer Engineering"
    }));
    localStorage.setItem("hostelhub_version", DATA_VERSION);
    return;
  }

  if (!localStorage.getItem("hostelhub_hostels")) {
    localStorage.setItem("hostelhub_hostels", JSON.stringify(INITIAL_HOSTELS));
  }
  if (!localStorage.getItem("hostelhub_universities")) {
    localStorage.setItem("hostelhub_universities", JSON.stringify(INITIAL_UNIVERSITIES));
  }
  if (!localStorage.getItem("hostelhub_zones")) {
    localStorage.setItem("hostelhub_zones", JSON.stringify(INITIAL_ZONES));
  }
  if (!localStorage.getItem("hostelhub_inquiries")) {
    localStorage.setItem("hostelhub_inquiries", JSON.stringify(INITIAL_INQUIRIES));
  }
  if (!localStorage.getItem("hostelhub_bookings")) {
    localStorage.setItem("hostelhub_bookings", JSON.stringify(INITIAL_BOOKINGS));
  }
  if (!localStorage.getItem("hostelhub_favorites")) {
    localStorage.setItem("hostelhub_favorites", JSON.stringify(["knust-01", "knust-11", "knust-21"]));
  }
  if (!localStorage.getItem("hostelhub_recent")) {
    localStorage.setItem("hostelhub_recent", JSON.stringify(["knust-01", "knust-11", "knust-21", "knust-31"]));
  }
  if (!localStorage.getItem("hostelhub_reports")) {
    localStorage.setItem("hostelhub_reports", JSON.stringify(INITIAL_REPORTS));
  }
  if (!localStorage.getItem("hostelhub_user")) {
    localStorage.setItem("hostelhub_user", JSON.stringify({
      id: "usr-student",
      name: "Kwame Mensah",
      email: "kmensah@st.knust.edu.gh",
      phone: "+233 24 333 4455",
      role: "student",
      university: "KNUST",
      studentId: "20874521",
      level: "Level 300 Computer Engineering"
    }));
  }
}

// Ensure storage initialized on module load
initStorage();

// Fetch latest hostels asynchronously in the background from backend
if (typeof window !== "undefined") {
  HostelApi.getAll().then(res => {
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      localStorage.setItem("hostelhub_hostels", JSON.stringify(res.data));
    }
  }).catch(() => {});
}

export function getHostels() {
  try {
    const data = localStorage.getItem("hostelhub_hostels");
    return data ? JSON.parse(data) : INITIAL_HOSTELS;
  } catch (e) {
    return INITIAL_HOSTELS;
  }
}

export function saveHostels(hostels) {
  localStorage.setItem("hostelhub_hostels", JSON.stringify(hostels));
}

export function updateHostel(id, updatedFields) {
  const hostels = getHostels();
  const index = hostels.findIndex(h => h.id === id);
  if (index !== -1) {
    hostels[index] = { ...hostels[index], ...updatedFields };
    saveHostels(hostels);

    // Sync to backend asynchronously
    HostelApi.update(id, updatedFields).catch(err => {
      console.warn("Backend update error:", err);
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hostelhub:hostel-updated", { detail: { hostel: hostels[index] } }));
    }
    return hostels[index];
  }
  return null;
}

export function resetHostelToDefault(id) {
  const original = INITIAL_HOSTELS.find(h => h.id === id);
  if (original) {
    return updateHostel(id, JSON.parse(JSON.stringify(original)));
  }
  return null;
}

export function getHostelById(id) {
  const hostels = getHostels();
  return hostels.find(h => h.id === id) || null;
}

export function getUniversities() {
  try {
    const data = localStorage.getItem("hostelhub_universities");
    return data ? JSON.parse(data) : INITIAL_UNIVERSITIES;
  } catch (e) {
    return INITIAL_UNIVERSITIES;
  }
}

export function getZones() {
  try {
    const data = localStorage.getItem("hostelhub_zones");
    return data ? JSON.parse(data) : INITIAL_ZONES;
  } catch (e) {
    return INITIAL_ZONES;
  }
}

export function getZoneBySlug(slug) {
  const zones = getZones();
  return zones.find(z => z.slug.toLowerCase() === slug.toLowerCase() || z.name.toLowerCase() === slug.toLowerCase()) || null;
}

export function getFavorites() {
  try {
    const data = localStorage.getItem("hostelhub_favorites");
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function toggleFavorite(hostelId) {
  let favs = getFavorites();
  const exists = favs.includes(hostelId);
  if (exists) {
    favs = favs.filter(id => id !== hostelId);
    showToast("Removed from saved hostels", "info");
    FavouriteApi.remove(hostelId).catch(() => {});
  } else {
    favs.push(hostelId);
    showToast("Saved to your favorites!", "success");
    FavouriteApi.add(hostelId).catch(() => {});
  }
  localStorage.setItem("hostelhub_favorites", JSON.stringify(favs));
  return !exists;
}

export function isFavorite(hostelId) {
  const favs = getFavorites();
  return favs.includes(hostelId);
}

export function getRecentlyViewed() {
  try {
    const data = localStorage.getItem("hostelhub_recent");
    const ids = data ? JSON.parse(data) : [];
    const allHostels = getHostels();
    return ids.map(id => allHostels.find(h => h.id === id)).filter(Boolean);
  } catch (e) {
    return [];
  }
}

export function addRecentlyViewed(hostelId) {
  try {
    let list = JSON.parse(localStorage.getItem("hostelhub_recent") || "[]");
    list = list.filter(id => id !== hostelId);
    list.unshift(hostelId);
    if (list.length > 8) list.pop();
    localStorage.setItem("hostelhub_recent", JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }
}

export function getInquiries() {
  try {
    const data = localStorage.getItem("hostelhub_inquiries");
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveInquiry(inquiry) {
  const inquiries = getInquiries();
  inquiry.id = "inq-" + Date.now();
  inquiry.date = new Date().toISOString().split("T")[0];
  inquiry.status = "Pending Response";
  inquiry.reply = "";
  inquiries.unshift(inquiry);
  localStorage.setItem("hostelhub_inquiries", JSON.stringify(inquiries));
  showToast("Inquiry sent successfully to hostel owner!", "success");

  // Sync to backend
  InquiryApi.create(inquiry).catch(err => console.warn("Backend saveInquiry note:", err));

  return inquiry;
}

export function getBookings() {
  try {
    const data = localStorage.getItem("hostelhub_bookings");
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveBooking(booking) {
  const bookings = getBookings();
  booking.id = "req-" + Date.now().toString().slice(-4);
  booking.bookingDate = new Date().toISOString().split("T")[0];
  booking.status = "Pending Review";
  booking.paymentStatus = "Awaiting Owner Approval";
  bookings.unshift(booking);
  localStorage.setItem("hostelhub_bookings", JSON.stringify(bookings));
  showToast("Room reservation request submitted!", "success");

  // Sync to backend
  BookingApi.create(booking).catch(err => console.warn("Backend saveBooking note:", err));

  return booking;
}

export function getReports() {
  try {
    const data = localStorage.getItem("hostelhub_reports");
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveReports(reports) {
  localStorage.setItem("hostelhub_reports", JSON.stringify(reports));
}

// ==========================================================================
// 3. Currency & Formatting Helpers
// ==========================================================================

export function formatGHS(amount) {
  if (typeof amount !== "number") amount = Number(amount) || 0;
  return "GH₵ " + amount.toLocaleString("en-US");
}

// ==========================================================================
// 4. Toast Notification UI
// ==========================================================================

export function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let icon = "✓";
  if (type === "error") icon = "✕";
  if (type === "info") icon = "ℹ";
  
  toast.innerHTML = `
    <span style="font-size: 1.1rem; font-weight: 700;">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}

// Make showToast accessible globally for inline handlers
if (typeof window !== "undefined") {
  window.showToast = showToast;
}

// ==========================================================================
// 5. Global Navbar & Header Setup
// ==========================================================================

export function setupNavigation(activePage = "") {
  const user = getCurrentUser();
  const navPlaceholder = document.getElementById("main-nav-placeholder");
  
  if (navPlaceholder) {
    const roleDashboardLink = user.role === "admin" 
      ? "admin-dashboard.html" 
      : user.role === "owner" 
        ? "owner-dashboard.html" 
        : "student-dashboard.html";

    const roleDashboardLabel = user.role === "admin"
      ? "Admin Panel"
      : user.role === "owner"
        ? "Owner Dashboard"
        : "Student Dashboard";

    navPlaceholder.innerHTML = `
      <header class="site-header" id="site-header">
        <div class="container navbar">
          <div class="nav-brand-row">
            <a href="index.html" class="brand-logo" id="brand-logo-link">
              <span class="brand-badge">H</span>
              <span>Hostel<span style="color: var(--secondary);">Hub</span></span>
              <span class="brand-tagline">KNUST</span>
            </a>

            <button class="nav-toggle-btn" id="mobile-nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
              <span class="nav-toggle-icon" id="nav-toggle-icon">☰</span>
              <span class="nav-toggle-text">Menu</span>
            </button>
          </div>

          <div class="nav-collapse" id="nav-collapse-menu">
            <ul class="nav-links" id="primary-nav-links">
              <li><a href="index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}" id="nav-link-home">Home</a></li>
              <li><a href="hostels.html" class="nav-link ${activePage === 'hostels' ? 'active' : ''}" id="nav-link-hostels">Find Hostels (40)</a></li>
              <li><a href="universities.html" class="nav-link ${activePage === 'universities' ? 'active' : ''}" id="nav-link-unis">KNUST Zones</a></li>
              <li><a href="contact.html" class="nav-link ${activePage === 'contact' ? 'active' : ''}" id="nav-link-contact">Contact</a></li>
            </ul>

            <div class="nav-actions" id="primary-nav-actions">
              <!-- Quick Demo Role Switcher to easily test all 3 personas! -->
              <div class="role-switcher-dropdown" title="Switch user role for testing" id="demo-role-switcher">
                <span class="role-switcher-label">Testing as:</span>
                <select id="quick-role-select" onchange="window.handleQuickRoleChange(this.value)">
                  <option value="student" ${user.role === 'student' ? 'selected' : ''}>🎓 Student</option>
                  <option value="owner" ${user.role === 'owner' ? 'selected' : ''}>🏢 Hostel Owner</option>
                  <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>🛡️ Admin</option>
                </select>
              </div>

              <a href="${roleDashboardLink}" class="btn btn-outline-primary btn-sm" id="nav-dashboard-btn">
                ${roleDashboardLabel}
              </a>

              <a href="hostels.html" class="btn btn-secondary btn-sm" id="nav-browse-btn">
                Search 40 Hostels
              </a>
            </div>
          </div>
        </div>
      </header>
    `;

    // Mobile nav toggle
    const toggleBtn = document.getElementById("mobile-nav-toggle");
    const navCollapse = document.getElementById("nav-collapse-menu");
    const toggleIcon = document.getElementById("nav-toggle-icon");
    if (toggleBtn && navCollapse) {
      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = navCollapse.classList.toggle("show-mobile");
        toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        if (toggleIcon) {
          toggleIcon.textContent = isOpen ? "✕" : "☰";
        }
      });

      // Close when clicking any nav link
      navCollapse.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", () => {
          navCollapse.classList.remove("show-mobile");
          toggleBtn.setAttribute("aria-expanded", "false");
          if (toggleIcon) toggleIcon.textContent = "☰";
        });
      });
    }
  }

  setupFooter();
}

export function setupFooter() {
  const footerPlaceholder = document.getElementById("main-footer-placeholder");
  if (footerPlaceholder) {
    footerPlaceholder.innerHTML = `
      <footer class="site-footer" id="site-footer">
        <div class="container footer-grid">
          <div class="footer-brand">
            <div class="brand-logo" style="color: white; margin-bottom: 0.85rem;">
              <span class="brand-badge">H</span>
              <span>HostelHub KNUST</span>
            </div>
            <p class="footer-desc">
              KNUST's dedicated student accommodation portal. 40 verified private hostels across Ayeduase, Kotei, New Site, and Bomso with accurate rates, room amenities, and direct manager WhatsApp contacts.
            </p>
            <div style="display: flex; gap: 0.65rem; margin-top: 1rem; flex-wrap: wrap;">
              <span class="badge badge-success">✓ 40 Verified KNUST Hostels</span>
              <span class="badge badge-primary">Direct WhatsApp Booking</span>
            </div>
          </div>

          <div>
            <h4 class="footer-title">KNUST Residential Zones</h4>
            <ul class="footer-links">
              <li><a href="hostels.html?location=Ayeduase">Ayeduase Gate (10 Hostels)</a></li>
              <li><a href="hostels.html?location=Kotei">Kotei Road (10 Hostels)</a></li>
              <li><a href="hostels.html?location=New%20Site">New Site / Gaza (10 Hostels)</a></li>
              <li><a href="hostels.html?location=Bomso">Bomso / Tech Junction (10 Hostels)</a></li>
              <li><a href="universities.html">Zone & Distance Comparison Guide</a></li>
            </ul>
          </div>

          <div>
            <h4 class="footer-title">Student & Owner Hub</h4>
            <ul class="footer-links">
              <li><a href="student-dashboard.html">Saved Hostels</a></li>
              <li><a href="student-dashboard.html">My Booking Requests</a></li>
              <li><a href="owner-dashboard.html">List Your Hostel</a></li>
              <li><a href="admin-dashboard.html">Admin Verification</a></li>
              <li><a href="contact.html">Safety & Fraud Prevention</a></li>
              <li><a href="contact.html">Student Support Desk</a></li>
            </ul>
          </div>

          <div>
            <h4 class="footer-title">KNUST Campus Helpdesk</h4>
            <ul class="footer-links">
              <li>📍 Ayeduase Gate / Commercial Area, KNUST Kumasi</li>
              <li>📞 +233 (0) 32 206 0001</li>
              <li>💬 WhatsApp: +233 24 333 4455</li>
              <li>✉️ knust-support@hostelhub.com.gh</li>
              <li>🕒 Mon - Sat: 8:00 AM - 7:00 PM GMT</li>
            </ul>
          </div>
        </div>

        <div class="container footer-bottom">
          <div>© 2026 HostelHub KNUST. Built for KNUST Kumasi students. All rights reserved.</div>
          <div>Prices quoted in Ghanaian Cedi (GH₵) per academic year.</div>
        </div>
      </footer>
    `;
  }
}

// User state helper
export function getCurrentUser() {
  try {
    const data = localStorage.getItem("hostelhub_user");
    if (data) return JSON.parse(data);
  } catch (e) {}
  
  return {
    id: "usr-student",
    name: "Kwame Mensah",
    email: "kmensah@st.knust.edu.gh",
    phone: "+233 24 333 4455",
    role: "student",
    university: "KNUST",
    studentId: "20874521",
    level: "Level 300 Computer Engineering"
  };
}

export function setCurrentUser(user) {
  localStorage.setItem("hostelhub_user", JSON.stringify(user));
}

// Global Quick Role Switcher for easy demoing
if (typeof window !== "undefined") {
  window.handleQuickRoleChange = function(role) {
    let user = getCurrentUser();
    if (role === "admin") {
      user = {
        id: "usr-admin",
        name: "Ama Serwaa",
        email: "admin@hostelhub.gh",
        phone: "+233 24 999 8888",
        role: "admin",
        university: "KNUST Administration",
        adminLevel: "Super Administrator"
      };
      setCurrentUser(user);
      showToast("Switched to Administrator account", "success");
      setTimeout(() => { window.location.href = "admin-dashboard.html"; }, 400);
    } else if (role === "owner") {
      user = {
        id: "usr-owner",
        name: "Alhaji Yakubu",
        email: "yakubu.hostels@gmail.com",
        phone: "+233 24 333 4455",
        role: "owner",
        university: "KNUST",
        businessName: "Brunei Accommodations Ltd"
      };
      setCurrentUser(user);
      showToast("Switched to Hostel Owner account", "success");
      setTimeout(() => { window.location.href = "owner-dashboard.html"; }, 400);
    } else {
      user = {
        id: "usr-student",
        name: "Kwame Mensah",
        email: "kmensah@st.knust.edu.gh",
        phone: "+233 24 333 4455",
        role: "student",
        university: "KNUST",
        studentId: "20874521",
        level: "Level 300 Computer Engineering"
      };
      setCurrentUser(user);
      showToast("Switched to Student account", "success");
      setTimeout(() => { window.location.href = "student-dashboard.html"; }, 400);
    }
  };
}
