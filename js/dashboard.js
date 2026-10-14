/**
 * HostelHub Ghana - Dashboard Management Script
 * Controls Student, Owner, and Admin Dashboards
 */

import {
  getHostels,
  saveHostels,
  getFavorites,
  toggleFavorite,
  getRecentlyViewed,
  getInquiries,
  getBookings,
  getReports,
  saveReports,
  getUniversities,
  formatGHS,
  showToast,
  getCurrentUser,
  setCurrentUser
} from './app.js';

import { getUsers, saveUsers } from './auth.js';
import { HostelApi, BookingApi, InquiryApi, AdminApi } from './api.js';
import { openHostelEditor } from './hostel-editor.js';


// ==========================================================================
// 1. STUDENT DASHBOARD
// ==========================================================================
export function initStudentDashboard() {
  const user = getCurrentUser();
  populateUserHeader(user);

  // Render Saved Favorites
  renderStudentFavorites();

  // Render Recently Viewed
  renderStudentRecentlyViewed();

  // Render Sent Inquiries
  renderStudentInquiries();

  // Render Room Requests / Bookings
  renderStudentBookings();

  // Setup Profile Form
  setupStudentProfile(user);
}

function populateUserHeader(user) {
  const nameEls = document.querySelectorAll(".current-user-name");
  nameEls.forEach(el => el.textContent = user.name || "Student");

  const roleEls = document.querySelectorAll(".current-user-role");
  roleEls.forEach(el => el.textContent = user.role ? user.role.toUpperCase() : "STUDENT");

  const emailEls = document.querySelectorAll(".current-user-email");
  emailEls.forEach(el => el.textContent = user.email || "");

  const uniEls = document.querySelectorAll(".current-user-uni");
  uniEls.forEach(el => el.textContent = user.university || "University of Ghana");
}

function renderStudentFavorites() {
  const container = document.getElementById("student-favorites-container");
  const countBadge = document.getElementById("fav-count-badge");
  if (!container) return;

  const favIds = getFavorites();
  const allHostels = getHostels();
  const favHostels = allHostels.filter(h => favIds.includes(h.id));

  if (countBadge) countBadge.textContent = favHostels.length;

  if (favHostels.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-state-icon">❤️</div>
        <h4 class="empty-state-title">No Saved Hostels Yet</h4>
        <p class="empty-state-desc">When browsing hostels, click the heart icon on any card to save it for easy comparison.</p>
        <a href="hostels.html" class="btn btn-primary btn-sm">Find Hostels</a>
      </div>
    `;
    return;
  }

  container.innerHTML = favHostels.map(h => `
    <div class="hostel-card" style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; padding: 1.25rem; gap: 1.25rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <img src="${h.image}" alt="${h.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius-md);" />
        <div>
          <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.2rem;">
            <a href="hostel-details.html?id=${h.id}">${h.name}</a>
          </h4>
          <div style="font-size: 0.82rem; color: var(--text-muted);">🏛️ ${h.university} • 📍 ${h.location}</div>
          <div style="font-size: 0.92rem; font-weight: 800; color: var(--primary); margin-top: 0.35rem;">
            ${formatGHS(h.price)} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">/ year</span>
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 0.6rem; align-items: center;">
        <a href="hostel-details.html?id=${h.id}" class="btn btn-outline-primary btn-sm">View Details</a>
        <button class="btn btn-outline btn-sm" onclick="window.removeFavoriteHostel('${h.id}')" style="color: var(--danger); border-color: #fecaca;">
          Remove
        </button>
      </div>
    </div>
  `).join("");
}

if (typeof window !== "undefined") {
  window.removeFavoriteHostel = function(id) {
    toggleFavorite(id);
    renderStudentFavorites();
  };
}

function renderStudentRecentlyViewed() {
  const container = document.getElementById("student-recent-container");
  if (!container) return;

  const recent = getRecentlyViewed();
  if (recent.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.88rem;">No hostels recently viewed yet.</p>`;
    return;
  }

  container.innerHTML = recent.slice(0, 4).map(h => `
    <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0; border-bottom: 1px solid var(--border-color);">
      <img src="${h.image}" alt="${h.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: var(--radius-sm);" />
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 0.88rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          <a href="hostel-details.html?id=${h.id}">${h.name}</a>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${formatGHS(h.price)} / yr</div>
      </div>
      <a href="hostel-details.html?id=${h.id}" class="btn btn-outline-primary btn-sm" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">View</a>
    </div>
  `).join("");
}

function renderStudentInquiries() {
  const tbody = document.getElementById("student-inquiries-tbody");
  if (!tbody) return;

  const inquiries = getInquiries();
  if (inquiries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No inquiries sent yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = inquiries.map(inq => {
    const isReplied = inq.status === "Replied";
    const badge = isReplied 
      ? `<span class="badge badge-success">✓ Replied</span>` 
      : `<span class="badge badge-warning">Pending Response</span>`;

    return `
      <tr>
        <td>
          <strong>${inq.hostelName}</strong><br/>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${inq.university}</span>
        </td>
        <td>${inq.roomTypeNeeded}</td>
        <td>
          <div style="font-size: 0.85rem; max-width: 260px;">${inq.message}</div>
          ${inq.reply ? `<div style="font-size: 0.8rem; background: #ecfdf5; color: #065f46; padding: 6px 10px; border-radius: 6px; margin-top: 5px;"><strong>Owner Reply:</strong> ${inq.reply}</div>` : ''}
        </td>
        <td>${badge}</td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${inq.date}</td>
      </tr>
    `;
  }).join("");
}

function renderStudentBookings() {
  const tbody = document.getElementById("student-bookings-tbody");
  if (!tbody) return;

  const bookings = getBookings();
  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No room booking requests made yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => {
    let badgeClass = "badge-warning";
    if (b.status === "Approved") badgeClass = "badge-success";
    if (b.status === "Rejected") badgeClass = "badge-danger";

    return `
      <tr>
        <td><strong>#${b.id}</strong></td>
        <td>
          <strong>${b.hostelName}</strong><br/>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${b.academicYear}</span>
        </td>
        <td>${b.roomType}</td>
        <td><strong>${formatGHS(b.quotedPrice)}</strong></td>
        <td><span class="badge ${badgeClass}">${b.status}</span><br/><span style="font-size: 0.72rem; color: var(--text-muted);">${b.paymentStatus}</span></td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${b.bookingDate}</td>
      </tr>
    `;
  }).join("");
}

function setupStudentProfile(user) {
  const form = document.getElementById("student-profile-form");
  if (!form) return;

  const nameInput = document.getElementById("profile-name");
  const emailInput = document.getElementById("profile-email");
  const phoneInput = document.getElementById("profile-phone");
  const uniInput = document.getElementById("profile-university");
  const studentIdInput = document.getElementById("profile-student-id");
  const levelInput = document.getElementById("profile-level");

  if (nameInput) nameInput.value = user.name || "";
  if (emailInput) emailInput.value = user.email || "";
  if (phoneInput) phoneInput.value = user.phone || "";
  if (uniInput) uniInput.value = user.university || "University of Ghana";
  if (studentIdInput) studentIdInput.value = user.studentId || "";
  if (levelInput) levelInput.value = user.level || "Level 300";

  form.onsubmit = function(e) {
    e.preventDefault();
    user.name = nameInput?.value.trim() || user.name;
    user.phone = phoneInput?.value.trim() || user.phone;
    user.university = uniInput?.value.trim() || user.university;
    user.studentId = studentIdInput?.value.trim() || user.studentId;
    user.level = levelInput?.value.trim() || user.level;

    setCurrentUser(user);
    populateUserHeader(user);
    showToast("Profile updated successfully!", "success");
  };
}

// ==========================================================================
// 2. HOSTEL OWNER DASHBOARD
// ==========================================================================
export function initOwnerDashboard() {
  const user = getCurrentUser();
  populateUserHeader(user);

  // Render Metrics
  renderOwnerMetrics();

  // Render Owner's Hostels Table
  renderOwnerHostels();

  // Render Inquiries received
  renderOwnerInquiries();

  // Render Room Requests
  renderOwnerBookingRequests();

  // Setup Add Hostel Modal
  setupAddHostelModal();
}

function renderOwnerMetrics() {
  const hostels = getHostels();
  const inquiries = getInquiries();
  const bookings = getBookings();

  const totalHostelsEl = document.getElementById("metric-owner-hostels");
  const activeInquiriesEl = document.getElementById("metric-owner-inquiries");
  const pendingBookingsEl = document.getElementById("metric-owner-bookings");
  const totalRoomsEl = document.getElementById("metric-owner-rooms");

  if (totalHostelsEl) totalHostelsEl.textContent = hostels.length;
  if (activeInquiriesEl) activeInquiriesEl.textContent = inquiries.filter(i => i.status === "Pending Response").length;
  if (pendingBookingsEl) pendingBookingsEl.textContent = bookings.filter(b => b.status === "Pending Review").length;

  const totalVacant = hostels.reduce((acc, h) => acc + (h.availableRooms || 0), 0);
  if (totalRoomsEl) totalRoomsEl.textContent = totalVacant;
}

function renderOwnerHostels() {
  const tbody = document.getElementById("owner-hostels-tbody");
  if (!tbody) return;

  const hostels = getHostels();
  if (hostels.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;">No hostels listed yet. Click "+ Add New Hostel" above.</td></tr>`;
    return;
  }

  tbody.innerHTML = hostels.map(h => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <img src="${h.image}" alt="${h.name}" style="width: 44px; height: 44px; object-fit: cover; border-radius: var(--radius-sm);" />
          <div>
            <strong>${h.name}</strong><br/>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${h.location}</span>
          </div>
        </div>
      </td>
      <td>${h.university}</td>
      <td><strong>${formatGHS(h.price)}</strong> / yr</td>
      <td>
        <span class="badge ${h.availableRooms > 0 ? 'badge-success' : 'badge-danger'}">
          ${h.availableRooms} rooms vacant
        </span>
      </td>
      <td>
        <span class="badge ${h.status === 'approved' ? 'badge-success' : 'badge-warning'}">
          ${h.status === 'approved' ? '✓ Approved' : 'In Review'}
        </span>
      </td>
      <td>★ ${h.rating.toFixed(1)}</td>
      <td>
        <div style="display: flex; gap: 0.4rem;">
          <a href="hostel-details.html?id=${h.id}" class="btn btn-outline btn-sm" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">Preview</a>
          <button class="btn btn-outline btn-sm" onclick="window.editHostelPrompt('${h.id}')" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">Edit</button>
          <button class="btn btn-outline btn-sm" onclick="window.deleteOwnerHostel('${h.id}')" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; color: var(--danger); border-color: #fee2e2;">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

if (typeof window !== "undefined") {
  window.deleteOwnerHostel = function(id) {
    if (confirm("Are you sure you want to delete this hostel listing from HostelHub?")) {
      let hostels = getHostels();
      hostels = hostels.filter(h => h.id !== id);
      saveHostels(hostels);
      showToast("Hostel deleted successfully", "info");
      renderOwnerHostels();
      renderOwnerMetrics();
    }
  };

  window.editHostelPrompt = function(id) {
    // Open full hostel editor modal with room availability, pricing, photos, and locations
    openHostelEditor(id, () => {
      renderOwnerHostels();
      renderOwnerMetrics();
    });
  };
}

function renderOwnerInquiries() {
  const tbody = document.getElementById("owner-inquiries-tbody");
  if (!tbody) return;

  const inquiries = getInquiries();
  tbody.innerHTML = inquiries.map(inq => `
    <tr>
      <td>
        <strong>${inq.studentName}</strong><br/>
        <span style="font-size: 0.75rem; color: var(--text-muted);">${inq.studentPhone}</span>
      </td>
      <td>${inq.hostelName}</td>
      <td>${inq.roomTypeNeeded}</td>
      <td style="max-width: 280px; font-size: 0.85rem;">
        ${inq.message}
        ${inq.reply ? `<div style="font-size: 0.75rem; color: #065f46; margin-top: 4px;"><strong>Your Reply:</strong> ${inq.reply}</div>` : ''}
      </td>
      <td>
        <span class="badge ${inq.status === 'Replied' ? 'badge-success' : 'badge-warning'}">
          ${inq.status}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: 0.35rem;">
          <a 
            href="https://wa.me/${inq.studentPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(inq.studentName)},%20regarding%20your%20inquiry%20for%20${encodeURIComponent(inq.hostelName)}%20on%20HostelHub..." 
            target="_blank" 
            class="btn btn-whatsapp btn-sm"
            style="padding: 0.3rem 0.6rem; font-size: 0.75rem;"
          >
            WhatsApp
          </a>
          <button 
            class="btn btn-outline-primary btn-sm" 
            style="padding: 0.3rem 0.6rem; font-size: 0.75rem;"
            onclick="window.replyInquiryPrompt('${inq.id}')"
          >
            Reply
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

if (typeof window !== "undefined") {
  window.replyInquiryPrompt = function(inqId) {
    const inquiries = getInquiries();
    const inq = inquiries.find(i => i.id === inqId);
    if (!inq) return;

    const reply = prompt(`Reply to inquiry from ${inq.studentName}:`, inq.reply || "Hello, yes this room is available for inspection. Please call me.");
    if (reply) {
      inq.reply = reply;
      inq.status = "Replied";
      localStorage.setItem("hostelhub_inquiries", JSON.stringify(inquiries));

      // Sync with backend API
      InquiryApi.reply(inqId, reply).catch(err => console.warn("Backend InquiryApi.reply:", err));

      showToast("Reply saved and dispatched!", "success");
      renderOwnerInquiries();
    }
  };
}

function renderOwnerBookingRequests() {
  const tbody = document.getElementById("owner-bookings-tbody");
  if (!tbody) return;

  const bookings = getBookings();
  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td>#${b.id}</td>
      <td>
        <strong>${b.studentName}</strong><br/>
        <span style="font-size: 0.75rem; color: var(--text-muted);">${b.studentPhone} • ${b.university}</span>
      </td>
      <td>${b.hostelName}</td>
      <td>${b.roomType} (${formatGHS(b.quotedPrice)})</td>
      <td>
        <span class="badge ${b.status === 'Approved' ? 'badge-success' : 'badge-warning'}">${b.status}</span>
      </td>
      <td>
        ${b.status === 'Pending Review' ? `
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn btn-secondary btn-sm" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="window.updateBookingStatus('${b.id}', 'Approved')">Approve</button>
            <button class="btn btn-outline btn-sm" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; color: var(--danger);" onclick="window.updateBookingStatus('${b.id}', 'Rejected')">Decline</button>
          </div>
        ` : `
          <span style="font-size: 0.8rem; color: var(--text-muted);">Action taken</span>
        `}
      </td>
    </tr>
  `).join("");
}

if (typeof window !== "undefined") {
  window.updateBookingStatus = function(bId, newStatus) {
    const bookings = getBookings();
    const b = bookings.find(item => item.id === bId);
    if (b) {
      b.status = newStatus;
      if (newStatus === "Approved") {
        b.paymentStatus = "Ready for Student Deposit";
      }
      localStorage.setItem("hostelhub_bookings", JSON.stringify(bookings));

      // Sync with backend API
      BookingApi.updateStatus(bId, newStatus, b.paymentStatus).catch(err => console.warn("Backend updateBookingStatus:", err));

      showToast(`Booking request marked as ${newStatus}`, "success");
      renderOwnerBookingRequests();
      renderOwnerMetrics();
    }
  };
}

function setupAddHostelModal() {
  const openBtn = document.getElementById("open-add-hostel-btn");
  const modal = document.getElementById("add-hostel-modal");
  const closeBtn = document.getElementById("close-add-hostel-modal");
  const form = document.getElementById("add-hostel-form");

  if (openBtn && modal) {
    openBtn.onclick = () => modal.classList.add("active");
  }

  if (closeBtn && modal) {
    closeBtn.onclick = () => modal.classList.remove("active");
  }

  // Room pricing card activation
  [1, 2, 3, 4].forEach(n => {
    const cb = document.getElementById(`new-room-enable-${n}`);
    const card = document.getElementById(`new-room-card-${n}`);
    const priceInput = document.getElementById(`new-room-price-${n}`);
    if (cb && card && priceInput) {
      cb.onchange = () => {
        if (cb.checked) {
          card.classList.add("active");
          card.classList.remove("disabled");
          priceInput.disabled = false;
          priceInput.focus();
        } else {
          card.classList.remove("active");
          card.classList.add("disabled");
          priceInput.disabled = true;
        }
      };
    }
  });

  // Multiple Locations toggle & None button in Add Hostel form
  let hasMultiLoc = false;
  const btnNone = document.getElementById("new-loc-btn-none");
  const btnMulti = document.getElementById("new-loc-btn-multiple");
  const btnQuickNone = document.getElementById("new-btn-quick-none");
  const boxNone = document.getElementById("new-loc-none-box");
  const boxMulti = document.getElementById("new-loc-multiple-box");

  const setNone = () => {
    hasMultiLoc = false;
    if (boxNone) boxNone.style.display = "block";
    if (boxMulti) boxMulti.style.display = "none";
    if (btnNone) { btnNone.classList.add("active"); btnNone.classList.remove("btn-outline"); }
    if (btnMulti) { btnMulti.classList.remove("active"); btnMulti.classList.add("btn-outline"); }
  };

  const setMulti = () => {
    hasMultiLoc = true;
    if (boxNone) boxNone.style.display = "none";
    if (boxMulti) boxMulti.style.display = "block";
    if (btnNone) { btnNone.classList.remove("active"); btnNone.classList.add("btn-outline"); }
    if (btnMulti) { btnMulti.classList.add("active"); btnMulti.classList.remove("btn-outline"); }
  };

  if (btnNone) btnNone.onclick = setNone;
  if (btnQuickNone) btnQuickNone.onclick = setNone;
  if (btnMulti) btnMulti.onclick = setMulti;

  // File upload reader for new hostel image with backend upload
  const fileInput = document.getElementById("new-hostel-file-input");
  const hiddenImgInput = document.getElementById("new-hostel-image-data");
  if (fileInput && hiddenImgInput) {
    fileInput.onchange = async () => {
      const file = fileInput.files?.[0];
      if (file) {
        // First try server upload via multipart
        try {
          const res = await HostelApi.uploadImage(file);
          if (res && res.success && res.data && res.data.url) {
            hiddenImgInput.value = res.data.url;
            showToast("✓ Image uploaded to server successfully!", "success");
            return;
          }
        } catch (e) {
          console.warn("Backend image upload notice:", e);
        }

        // Fallback to data URL
        const reader = new FileReader();
        reader.onload = (ev) => {
          hiddenImgInput.value = ev.target?.result || "";
          showToast("✓ Picture loaded successfully", "success");
        };
        reader.readAsDataURL(file);
      }
    };
  }

  if (form) {
    form.onsubmit = function(e) {
      e.preventDefault();
      const user = getCurrentUser();

      const name = document.getElementById("hostel-name-input")?.value.trim();
      const uni = document.getElementById("hostel-uni-select")?.value || "KNUST";
      const location = document.getElementById("hostel-location-input")?.value.trim();
      const rooms = parseInt(document.getElementById("hostel-rooms-input")?.value) || 6;
      const distance = document.getElementById("hostel-distance-input")?.value.trim() || "5 mins walk to campus";
      const desc = document.getElementById("hostel-desc-input")?.value.trim();
      
      const uploadedImg = hiddenImgInput?.value;
      const imgUrl = uploadedImg || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80";

      // Selected room types and stated prices
      const roomTypes = [];
      const roomPricing = {};
      const roomLabels = {
        1: "1 in a room",
        2: "2 in a room",
        3: "3 in a room",
        4: "4 in a room"
      };

      [1, 2, 3, 4].forEach(n => {
        const cb = document.getElementById(`new-room-enable-${n}`);
        const priceInput = document.getElementById(`new-room-price-${n}`);
        if (cb && cb.checked) {
          const typeName = roomLabels[n];
          roomTypes.push(typeName);
          const p = parseInt(priceInput?.value, 10);
          roomPricing[typeName] = (!isNaN(p) && p > 0) ? p : (n === 1 ? 8000 : n === 2 ? 5000 : n === 3 ? 4200 : 3500);
        }
      });

      if (roomTypes.length === 0) {
        roomTypes.push("2 in a room");
        roomPricing["2 in a room"] = 5000;
      }

      const activePrices = Object.values(roomPricing);
      const lowestPrice = activePrices.length > 0 ? Math.min(...activePrices) : 5000;

      // Locations handling (Multiple branches or None)
      let locations = [];
      if (hasMultiLoc) {
        const branchNames = document.querySelectorAll(".new-branch-name");
        const branchAddresses = document.querySelectorAll(".new-branch-address");
        branchNames.forEach((bn, idx) => {
          const bVal = bn.value.trim();
          const aVal = branchAddresses[idx]?.value.trim() || location;
          if (bVal) {
            locations.push({
              name: bVal,
              zone: location,
              address: aVal,
              phone: user.phone || "+233 24 456 7890"
            });
          }
        });
      }

      // Selected amenities
      const amenities = Array.from(document.querySelectorAll("input[name='new-hostel-amenity']:checked")).map(cb => cb.value);
      if (amenities.length === 0) amenities.push("WiFi", "24/7 Security", "Water Tank");

      const newHostel = {
        id: "hh-" + Date.now().toString().slice(-4),
        name: name,
        university: uni,
        uniCode: uni.includes("KNUST") ? "KNUST" : uni.includes("Cape Coast") ? "UCC" : uni.includes("Education") ? "UEW" : uni.includes("Development") ? "UDS" : uni.includes("Professional") ? "UPSA" : uni.includes("Technical") ? "ATU" : "UG",
        location: location,
        zone: location,
        city: location.includes("Kumasi") ? "Kumasi" : location.includes("Cape Coast") ? "Cape Coast" : location.includes("Winneba") ? "Winneba" : location.includes("Tamale") ? "Tamale" : "Accra",
        price: lowestPrice,
        period: "per academic year",
        roomTypes: roomTypes,
        roomPricing: roomPricing,
        hasMultipleLocations: hasMultiLoc && locations.length >= 2,
        locations: hasMultiLoc && locations.length >= 2 ? locations : [],
        distance: distance,
        rating: 4.5,
        reviewsCount: 1,
        availableRooms: rooms,
        totalRooms: rooms * 5,
        status: "approved",
        featured: false,
        amenities: amenities,
        description: desc,
        rules: [
          "Curfew observed at 11:00 PM",
          "Quiet hours after 10:00 PM",
          "No unauthorized guests overnight"
        ],
        ownerName: user.name || "Hostel Owner",
        ownerPhone: user.phone || "+233 24 456 7890",
        ownerWhatsapp: (user.phone || "233244567890").replace(/[^0-9]/g, ''),
        ownerEmail: user.email || "owner@hostels.gh",
        image: imgUrl,
        gallery: [imgUrl]
      };

      const hostels = getHostels();
      hostels.unshift(newHostel);
      saveHostels(hostels);

      // Persist to backend
      HostelApi.create(newHostel).catch(err => console.warn("Backend hostel create:", err));

      showToast("Hostel listing published successfully!", "success");
      modal?.classList.remove("active");
      form.reset();

      renderOwnerHostels();
      renderOwnerMetrics();
    };
  }
}

// ==========================================================================
// 3. ADMIN DASHBOARD
// ==========================================================================
export function initAdminDashboard() {
  const user = getCurrentUser();
  populateUserHeader(user);

  renderAdminMetrics();
  renderAdminHostelsList();
  renderAdminUsers();
  renderAdminComplaints();
  renderAdminUniversities();
}

function renderAdminMetrics() {
  const hostels = getHostels();
  const users = getUsers();
  const reports = getReports();

  const totalHostelsEl = document.getElementById("admin-metric-hostels");
  const pendingApprovalsEl = document.getElementById("admin-metric-pending");
  const totalUsersEl = document.getElementById("admin-metric-users");
  const openReportsEl = document.getElementById("admin-metric-reports");

  if (totalHostelsEl) totalHostelsEl.textContent = hostels.length;
  if (pendingApprovalsEl) pendingApprovalsEl.textContent = hostels.filter(h => h.status !== 'approved').length;
  if (totalUsersEl) totalUsersEl.textContent = users.length;
  if (openReportsEl) openReportsEl.textContent = reports.filter(r => r.status !== 'Resolved').length;
}

function renderAdminHostelsList() {
  const tbody = document.getElementById("admin-hostels-tbody");
  if (!tbody) return;

  const hostels = getHostels();
  tbody.innerHTML = hostels.map(h => `
    <tr>
      <td>
        <strong>${h.name}</strong><br/>
        <span style="font-size: 0.75rem; color: var(--text-muted);">${h.location}</span>
      </td>
      <td>${h.university}</td>
      <td>${h.ownerName}<br/><span style="font-size: 0.72rem; color: var(--text-muted);">${h.ownerPhone}</span></td>
      <td><strong>${formatGHS(h.price)}</strong></td>
      <td>
        <span class="badge ${h.status === 'approved' ? 'badge-success' : 'badge-warning'}">
          ${h.status === 'approved' ? '✓ Verified' : 'Pending'}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: 0.35rem;">
          ${h.status !== 'approved' ? `
            <button class="btn btn-secondary btn-sm" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="window.adminApproveHostel('${h.id}')">Approve</button>
          ` : `
            <button class="btn btn-outline btn-sm" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="window.adminToggleFeatured('${h.id}')">${h.featured ? 'Unfeature' : 'Feature'}</button>
          `}
          <button class="btn btn-outline btn-sm" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--danger); border-color: #fee2e2;" onclick="window.adminDeleteFakeHostel('${h.id}')">Remove</button>
        </div>
      </td>
    </tr>
  `).join("");
}

if (typeof window !== "undefined") {
  window.adminApproveHostel = function(id) {
    const hostels = getHostels();
    const h = hostels.find(item => item.id === id);
    if (h) {
      h.status = "approved";
      saveHostels(hostels);
      AdminApi.verifyHostel(id, true, "approved").catch(err => console.warn("Backend verifyHostel:", err));
      showToast(`${h.name} approved and live for students!`, "success");
      renderAdminHostelsList();
      renderAdminMetrics();
    }
  };

  window.adminToggleFeatured = function(id) {
    const hostels = getHostels();
    const h = hostels.find(item => item.id === id);
    if (h) {
      h.featured = !h.featured;
      saveHostels(hostels);
      HostelApi.update(id, { featured: h.featured }).catch(err => console.warn("Backend update featured:", err));
      showToast(`${h.name} featured status updated!`, "info");
      renderAdminHostelsList();
    }
  };

  window.adminDeleteFakeHostel = function(id) {
    if (confirm("Permanently remove this hostel listing? This action cannot be undone.")) {
      let hostels = getHostels();
      hostels = hostels.filter(h => h.id !== id);
      saveHostels(hostels);
      HostelApi.delete(id).catch(err => console.warn("Backend delete hostel:", err));
      showToast("Hostel listing purged from database.", "info");
      renderAdminHostelsList();
      renderAdminMetrics();
    }
  };
}

function renderAdminUsers() {
  const tbody = document.getElementById("admin-users-tbody");
  if (!tbody) return;

  const users = getUsers();
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>
        <strong>${u.name}</strong>
      </td>
      <td>${u.email}</td>
      <td>${u.phone}</td>
      <td>
        <span class="badge ${u.role === 'admin' ? 'badge-dark' : u.role === 'owner' ? 'badge-primary' : 'badge-success'}">
          ${u.role.toUpperCase()}
        </span>
      </td>
      <td>${u.university || 'N/A'}</td>
      <td>
        <span style="font-size: 0.78rem; color: #16a34a;">● Active</span>
      </td>
    </tr>
  `).join("");
}

function renderAdminComplaints() {
  const tbody = document.getElementById("admin-complaints-tbody");
  if (!tbody) return;

  const reports = getReports();
  tbody.innerHTML = reports.map(r => `
    <tr>
      <td>
        <strong>${r.studentName}</strong>
      </td>
      <td>${r.hostelName}</td>
      <td><strong>${r.issue}</strong></td>
      <td style="font-size: 0.82rem; max-width: 250px;">${r.details}</td>
      <td>
        <span class="badge ${r.status === 'Resolved' ? 'badge-success' : 'badge-warning'}">
          ${r.status}
        </span>
      </td>
      <td>
        ${r.status !== 'Resolved' ? `
          <button class="btn btn-outline-primary btn-sm" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="window.adminResolveReport('${r.id}')">Resolve</button>
        ` : `<span style="font-size: 0.75rem; color: var(--text-muted);">Completed</span>`}
      </td>
    </tr>
  `).join("");
}

if (typeof window !== "undefined") {
  window.adminResolveReport = function(id) {
    const reports = getReports();
    const r = reports.find(item => item.id === id);
    if (r) {
      r.status = "Resolved";
      saveReports(reports);
      showToast("Complaint marked as resolved.", "success");
      renderAdminComplaints();
      renderAdminMetrics();
    }
  };
}

function renderAdminUniversities() {
  const tbody = document.getElementById("admin-unis-tbody");
  if (!tbody) return;

  const unis = getUniversities();
  tbody.innerHTML = unis.map(u => `
    <tr>
      <td><strong>${u.name} (${u.code})</strong></td>
      <td>${u.location}</td>
      <td>${u.hostelsCount} hostels</td>
      <td><strong>${formatGHS(u.avgPrice)}</strong></td>
      <td>${u.popularAreas.slice(0, 3).join(", ")}</td>
    </tr>
  `).join("");
}

// Bind to window for HTML page execution
if (typeof window !== "undefined") {
  window.initStudentDashboard = initStudentDashboard;
  window.initOwnerDashboard = initOwnerDashboard;
  window.initAdminDashboard = initAdminDashboard;
}
