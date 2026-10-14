/**
 * HostelHub Ghana - Hostels Search, Filtering & Details Script
 * Powers hostels.html, hostel-details.html, modals, and similar hostels
 */

import {
  getHostels,
  getHostelById,
  toggleFavorite,
  isFavorite,
  formatGHS,
  addRecentlyViewed,
  saveInquiry,
  saveBooking,
  showToast,
  getCurrentUser
} from './app.js';

import { openHostelEditor, initHostelEditorListeners } from './hostel-editor.js';

// ==========================================================================
// 1. Find Hostels Search & Filtering Page (hostels.html)
// ==========================================================================

export function initHostelsPage() {
  const container = document.getElementById("hostels-list-container");
  if (!container) return;

  // Read URL search query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const initialSearch = urlParams.get("search") || "";
  const initialUni = urlParams.get("uni") || "";
  const initialLocation = urlParams.get("location") || "";
  const initialMaxPrice = urlParams.get("maxPrice") || "";
  const initialRoomType = urlParams.get("roomType") || "";

  // Populate inputs if values present
  const searchInput = document.getElementById("filter-search-name");
  const uniSelect = document.getElementById("filter-university");
  const locationSelect = document.getElementById("filter-location");
  const minPriceInput = document.getElementById("filter-min-price");
  const maxPriceInput = document.getElementById("filter-max-price");
  const sortSelect = document.getElementById("sort-by-select");
  const availableOnlyCheckbox = document.getElementById("filter-available-only");

  if (searchInput && initialSearch) searchInput.value = initialSearch;
  if (uniSelect && initialUni) uniSelect.value = initialUni;
  if (locationSelect && initialLocation) locationSelect.value = initialLocation;
  if (maxPriceInput && initialMaxPrice) maxPriceInput.value = initialMaxPrice;

  // Filter change event listeners
  const filterInputs = [
    searchInput,
    uniSelect,
    locationSelect,
    minPriceInput,
    maxPriceInput,
    sortSelect,
    availableOnlyCheckbox
  ];

  filterInputs.forEach(input => {
    if (input) {
      input.addEventListener("input", applyFiltersAndRender);
      input.addEventListener("change", applyFiltersAndRender);
    }
  });

  // Room type checkboxes
  const roomTypeCheckboxes = document.querySelectorAll("input[name='filter-room-type']");
  roomTypeCheckboxes.forEach(cb => {
    if (initialRoomType && cb.value.toLowerCase().includes(initialRoomType.toLowerCase())) {
      cb.checked = true;
    }
    cb.addEventListener("change", applyFiltersAndRender);
  });

  // Zone pills (All, Ayeduase, Kotei, New Site, Bomso)
  const zonePills = document.querySelectorAll(".zone-filter-pill");
  zonePills.forEach(pill => {
    const pillZone = pill.getAttribute("data-zone") || "";
    if (initialLocation && pillZone.toLowerCase() === initialLocation.toLowerCase()) {
      zonePills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
    }
    pill.addEventListener("click", () => {
      zonePills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const zoneVal = pill.getAttribute("data-zone") || "";
      if (locationSelect) {
        locationSelect.value = zoneVal;
      }
      applyFiltersAndRender();
    });
  });

  // Sync zone pills if location dropdown changes directly
  if (locationSelect) {
    locationSelect.addEventListener("change", () => {
      const currentLoc = (locationSelect.value || "").toLowerCase();
      zonePills.forEach(p => {
        const pz = (p.getAttribute("data-zone") || "").toLowerCase();
        if (pz === currentLoc) {
          p.classList.add("active");
        } else {
          p.classList.remove("active");
        }
      });
    });
  }

  // Amenities checkboxes
  const amenityCheckboxes = document.querySelectorAll("input[name='filter-amenity']");
  amenityCheckboxes.forEach(cb => {
    cb.addEventListener("change", applyFiltersAndRender);
  });

  // Reset Filters button
  const resetBtn = document.getElementById("reset-filters-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (uniSelect) uniSelect.value = "";
      if (locationSelect) locationSelect.value = "";
      if (minPriceInput) minPriceInput.value = "";
      if (maxPriceInput) maxPriceInput.value = "";
      if (availableOnlyCheckbox) availableOnlyCheckbox.checked = false;
      if (sortSelect) sortSelect.value = "featured";

      roomTypeCheckboxes.forEach(cb => cb.checked = false);
      amenityCheckboxes.forEach(cb => cb.checked = false);

      zonePills.forEach(p => {
        if (p.getAttribute("data-zone") === "") p.classList.add("active");
        else p.classList.remove("active");
      });

      applyFiltersAndRender();
      showToast("Filters reset", "info");
    });
  }

  // Register live editor updates and attach listener
  window.refreshHostelListingsings = applyFiltersAndRender;
  initHostelEditorListeners();

  // Initial render
  applyFiltersAndRender();
}

function applyFiltersAndRender() {
  const container = document.getElementById("hostels-list-container");
  const countSpan = document.getElementById("results-count-number");
  if (!container) return;

  const allHostels = getHostels().filter(h => h.status === "approved");

  // Read filter values
  const searchTerm = (document.getElementById("filter-search-name")?.value || "").toLowerCase().trim();
  const selectedUni = document.getElementById("filter-university")?.value || "";
  const selectedLocation = document.getElementById("filter-location")?.value || "";
  const minPrice = parseFloat(document.getElementById("filter-min-price")?.value) || 0;
  const maxPrice = parseFloat(document.getElementById("filter-max-price")?.value) || Infinity;
  const availableOnly = document.getElementById("filter-available-only")?.checked || false;
  const sortBy = document.getElementById("sort-by-select")?.value || "featured";

  const selectedRoomTypes = Array.from(
    document.querySelectorAll("input[name='filter-room-type']:checked")
  ).map(cb => cb.value);

  const selectedAmenities = Array.from(
    document.querySelectorAll("input[name='filter-amenity']:checked")
  ).map(cb => cb.value);

  // Filter criteria
  const filtered = allHostels.filter(h => {
    // Search by name, zone, location or address
    if (searchTerm) {
      const matchName = h.name.toLowerCase().includes(searchTerm);
      const matchLoc = h.location.toLowerCase().includes(searchTerm);
      const matchZone = h.zone ? h.zone.toLowerCase().includes(searchTerm) : false;
      const matchAddr = h.address ? h.address.toLowerCase().includes(searchTerm) : false;
      if (!matchName && !matchLoc && !matchZone && !matchAddr) {
        return false;
      }
    }

    // Filter by university
    if (selectedUni && selectedUni !== "All" && h.university !== selectedUni && h.uniCode !== selectedUni) {
      return false;
    }

    // Filter by location/zone/city
    if (selectedLocation && selectedLocation !== "All" && 
        !h.location.toLowerCase().includes(selectedLocation.toLowerCase()) && 
        !h.city.toLowerCase().includes(selectedLocation.toLowerCase()) &&
        !(h.zone && h.zone.toLowerCase().includes(selectedLocation.toLowerCase()))) {
      return false;
    }

    // Filter by price range
    if (h.price < minPrice || h.price > maxPrice) {
      return false;
    }

    // Available only
    if (availableOnly && h.availableRooms <= 0) {
      return false;
    }

    // Room types (must match at least one selected if any selected)
    if (selectedRoomTypes.length > 0) {
      const hasRoomType = selectedRoomTypes.some(type => h.roomTypes.includes(type));
      if (!hasRoomType) return false;
    }

    // Amenities (must have ALL selected amenities)
    if (selectedAmenities.length > 0) {
      const hasAllAmenities = selectedAmenities.every(amenity => h.amenities.includes(amenity));
      if (!hasAllAmenities) return false;
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "available") return b.availableRooms - a.availableRooms;
    // Featured default
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  // Update counter
  if (countSpan) {
    countSpan.textContent = filtered.length;
  }

  // Render cards
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🔍</div>
        <h3 class="empty-state-title">No Hostels Found</h3>
        <p class="empty-state-desc">
          We couldn't find any hostels matching your exact filters. Try broadening your budget range, clearing amenities, or picking a neighboring location.
        </p>
        <button class="btn btn-primary btn-sm" onclick="document.getElementById('reset-filters-btn')?.click()">
          Clear All Filters
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(renderHostelCard).join("");

  // Attach favorite button click handlers
  attachFavoriteListeners();
}

// Helper to render an individual hostel card
export function renderHostelCard(hostel) {
  const isFav = isFavorite(hostel.id);
  const availabilityBadge = hostel.availableRooms > 0 
    ? `<span class="badge badge-success">✓ ${hostel.availableRooms} rooms left</span>`
    : `<span class="badge badge-danger">Fully Booked</span>`;

  const amenitiesPreview = (hostel.amenities || []).slice(0, 3).map(a => `
    <span class="amenity-pill">${a}</span>
  `).join("");

  return `
    <div class="hostel-card" id="card-${hostel.id}">
      <div class="hostel-card-media">
        <img 
          src="${hostel.image}" 
          alt="${hostel.name}" 
          class="hostel-card-img" 
          loading="lazy" 
          onerror="this.src='https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'"
        />
        <div class="hostel-card-badges">
          ${hostel.featured ? '<span class="badge badge-primary">Featured</span>' : ''}
          ${availabilityBadge}
        </div>
        <div class="hostel-card-actions">
          <button 
            type="button" 
            class="btn-edit-symbol" 
            data-hostel-id="${hostel.id}" 
            title="Edit hostel name, pictures & customization (✏️)"
            aria-label="Edit hostel"
          >
            ✏️
          </button>
          <button 
            type="button" 
            class="btn-favorite ${isFav ? 'active' : ''}" 
            data-hostel-id="${hostel.id}" 
            title="${isFav ? 'Remove from favorites' : 'Save to favorites'}"
            aria-label="Save hostel"
          >
            ♥
          </button>
        </div>
        <div class="hostel-card-price-tag">
          <span>${formatGHS(hostel.price)}</span> / year
        </div>
      </div>

      <div class="hostel-card-body">
        <div class="hostel-card-university">
          🏛️ ${hostel.university} ${hostel.zone ? `• <span class="badge hostel-zone-badge" style="background:#e0f2fe; color:#0369a1; font-weight:700; font-size:0.75rem; padding:0.15rem 0.5rem; border-radius:4px; max-width: 100%; display: inline-block; white-space: normal; line-height: 1.3;">📍 ${hostel.zone}</span>` : ''}
        </div>
        <h3 class="hostel-card-title">
          <a href="hostel-details.html?id=${hostel.id}">${hostel.name}</a>
        </h3>
        <div class="hostel-card-location">
          📍 ${hostel.location}
        </div>

        <div class="hostel-meta-row">
          <span>${hostel.distance}</span>
          <span class="rating-pill">★ ${hostel.rating.toFixed(1)} (${hostel.reviewsCount})</span>
        </div>

        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem; display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center;">
          <strong style="white-space: nowrap;">Rooms:</strong> 
          ${hostel.roomTypes.map(rt => {
            const isAvail = hostel.roomAvailability && hostel.roomAvailability[rt] !== undefined 
              ? !!hostel.roomAvailability[rt] 
              : true;
            return isAvail 
              ? `<span style="background: #f1f5f9; padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.74rem;">${rt}</span>`
              : `<span style="background: #fee2e2; color: #991b1b; padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.74rem; text-decoration: line-through;" title="${rt} is not available">${rt}</span>`;
          }).join("")}
        </div>

        <div class="hostel-amenities-pills">
          ${amenitiesPreview}
          ${hostel.amenities.length > 3 ? `<span class="amenity-pill">+${hostel.amenities.length - 3} more</span>` : ''}
        </div>

        <div class="hostel-card-footer">
          <a href="hostel-details.html?id=${hostel.id}" class="btn btn-outline-primary btn-sm" style="flex: 1;">
            View Details
          </a>
          <button 
            type="button" 
            class="btn btn-outline-primary btn-sm btn-edit-hostel-footer" 
            data-hostel-id="${hostel.id}"
            title="Edit hostel name, photos & customization"
            style="padding: 0.45rem 0.65rem; display: inline-flex; align-items: center; gap: 0.25rem;"
          >
            <span>✏️</span> Edit
          </button>
          <a 
            href="https://wa.me/${hostel.ownerWhatsapp}?text=Hello%20${encodeURIComponent(hostel.ownerName)},%20I%20saw%20${encodeURIComponent(hostel.name)}%20on%20HostelHub%20and%20would%20like%20to%20inquire%20about%20room%20availability." 
            target="_blank" 
            rel="noopener noreferrer"
            class="btn btn-whatsapp btn-sm"
            title="Chat directly on WhatsApp"
            style="padding: 0.45rem 0.75rem;"
          >
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  `;
}

// Favorite & Edit button listener bindings
export function attachFavoriteListeners() {
  document.querySelectorAll(".btn-favorite").forEach(btn => {
    btn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      const id = this.getAttribute("data-hostel-id");
      if (id) {
        const isNowFav = toggleFavorite(id);
        this.classList.toggle("active", isNowFav);
      }
    };
  });

  document.querySelectorAll(".btn-edit-symbol, .btn-edit-hostel-footer").forEach(btn => {
    btn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      const id = this.getAttribute("data-hostel-id");
      if (id) {
        openHostelEditor(id, () => {
          if (typeof window.refreshHostelListingsings === "function") {
            window.refreshHostelListingsings();
          }
        });
      }
    };
  });
}

// ==========================================================================
// 2. Hostel Details Page (hostel-details.html)
// ==========================================================================

export function initHostelDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const hostelId = urlParams.get("id") || "knust-01"; // default to first KNUST hostel if none provided
  const hostel = getHostelById(hostelId);

  if (!hostel) {
    const mainEl = document.getElementById("details-content-container");
    if (mainEl) {
      mainEl.innerHTML = `
        <div class="container" style="padding: 4rem 1.25rem; text-align: center;">
          <h2>Hostel Not Found</h2>
          <p style="margin: 1rem 0 2rem; color: var(--text-secondary);">The hostel listing you requested does not exist or has been unlisted.</p>
          <a href="hostels.html" class="btn btn-primary">Browse All Hostels</a>
        </div>
      `;
    }
    return;
  }

  // Record into recently viewed in LocalStorage
  addRecentlyViewed(hostel.id);

  // Render Page Content
  renderHostelDetails(hostel);

  // Render Similar Hostels
  renderSimilarHostels(hostel);

  // Setup Booking & Inquiry Modals
  setupDetailModals(hostel);

  // Setup Live Edit Triggers
  initHostelEditorListeners();
  document.querySelectorAll(".btn-edit-hostel-details").forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      openHostelEditor(hostel.id, (updated) => {
        renderHostelDetails(updated);
      });
    };
  });
}

function renderHostelDetails(hostel) {
  // Breadcrumbs & Title
  const breadcrumbName = document.getElementById("detail-breadcrumb-name");
  if (breadcrumbName) breadcrumbName.textContent = hostel.name;

  const titleEl = document.getElementById("detail-hostel-title");
  if (titleEl) titleEl.textContent = hostel.name;

  const uniEl = document.getElementById("detail-hostel-uni");
  if (uniEl) uniEl.textContent = hostel.university;

  const locEl = document.getElementById("detail-hostel-location");
  if (locEl) locEl.textContent = hostel.location;

  const distEl = document.getElementById("detail-hostel-distance");
  if (distEl) distEl.textContent = hostel.distance;

  const ratingEl = document.getElementById("detail-hostel-rating");
  if (ratingEl) {
    ratingEl.textContent = `★ ${hostel.rating.toFixed(1)} (${hostel.reviewsCount} reviews)`;
  }

  const badgeContainer = document.getElementById("detail-badge-container");
  if (badgeContainer) {
    badgeContainer.innerHTML = `
      <span class="badge badge-success">✓ Verified Ghanaian Hostel</span>
      ${hostel.availableRooms > 0 ? `<span class="badge badge-primary">${hostel.availableRooms} Rooms Currently Vacant</span>` : '<span class="badge badge-danger">Sold Out for this Term</span>'}
    `;
  }

  // Favorite button on details header
  const favBtn = document.getElementById("detail-fav-btn");
  if (favBtn) {
    favBtn.setAttribute("data-hostel-id", hostel.id);
    favBtn.classList.toggle("active", isFavorite(hostel.id));
    favBtn.onclick = function() {
      const active = toggleFavorite(hostel.id);
      this.classList.toggle("active", active);
    };
  }

  // Gallery
  const mainImg = document.getElementById("detail-main-image");
  const thumbsContainer = document.getElementById("detail-thumbs-container");

  const images = (hostel.gallery && hostel.gallery.length > 0) 
    ? hostel.gallery 
    : [hostel.image, hostel.image];

  if (mainImg) {
    mainImg.src = images[0];
    mainImg.alt = hostel.name;
  }

  if (thumbsContainer) {
    thumbsContainer.innerHTML = images.map((imgSrc, idx) => `
      <img 
        src="${imgSrc}" 
        alt="${hostel.name} view ${idx + 1}" 
        class="gallery-thumb-img" 
        onclick="document.getElementById('detail-main-image').src = '${imgSrc}'"
      />
    `).join("");
  }

  // Description
  const descEl = document.getElementById("detail-description");
  if (descEl) descEl.textContent = hostel.description;

  // Amenities
  const amenitiesList = document.getElementById("detail-amenities-list");
  if (amenitiesList) {
    const iconsMap = {
      "WiFi": "📶 High-Speed WiFi",
      "Water Tank": "🚰 Water Reservoir Tank",
      "24/7 Security": "🛡️ 24/7 Security & CCTV",
      "Study Room": "📚 Air-Conditioned Study Hall",
      "Backup Generator": "⚡ Standby Generator",
      "Balcony": "🌅 Scenic Balcony",
      "Laundry Bay": "🧺 Laundry Facility",
      "Cafeteria": "🍲 In-House Canteen",
      "Mini Mart": "🛒 Grocery Store",
      "Gym": "🏋️ Resident Fitness Gym",
      "Swimming Pool": "🏊 Swimming Pool",
      "Shuttle Service": "🚌 Campus Shuttle Van",
      "Air Conditioning": "❄️ Air Conditioning",
      "Elevator": "🛗 High-Speed Elevator",
      "Solar Power": "☀️ Solar Power Backup"
    };

    amenitiesList.innerHTML = hostel.amenities.map(amenity => `
      <div class="amenity-feature-item">
        <span>${iconsMap[amenity] || "✓ " + amenity}</span>
      </div>
    `).join("");
  }

  // Room Types & Pricing (1 in a room, 2 in a room, 3 in a room, 4 in a room)
  const roomTypesList = document.getElementById("detail-room-types-list");
  if (roomTypesList) {
    const standardOrder = ["1 in a room", "2 in a room", "3 in a room", "4 in a room"];
    const pricing = hostel.roomPricing || {
      "1 in a room": Math.round(hostel.price * 1.6),
      "2 in a room": hostel.price,
      "3 in a room": Math.round(hostel.price * 0.85),
      "4 in a room": Math.round(hostel.price * 0.7)
    };

    const entries = Object.entries(pricing).sort((a, b) => {
      const idxA = standardOrder.indexOf(a[0]);
      const idxB = standardOrder.indexOf(b[0]);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });

    const roomMeta = {
      "1 in a room": { label: "1 in a room (One-in-One)", sub: "Single Occupancy", icon: "🛏️" },
      "2 in a room": { label: "2 in a room", sub: "Double Occupancy (2 Students)", icon: "🛏️🛏️" },
      "3 in a room": { label: "3 in a room", sub: "Triple Occupancy (3 Students)", icon: "🛏️🛏️🛏️" },
      "4 in a room": { label: "4 in a room", sub: "Quad Occupancy (4 Students)", icon: "🛏️🛏️🛏️🛏️" }
    };

    const roomAvailability = hostel.roomAvailability || {};
    const roomCounts = hostel.roomCounts || {};

    roomTypesList.innerHTML = entries.map(([type, price]) => {
      const meta = roomMeta[type] || { label: type, sub: "Student Room", icon: "🛏️" };
      const isAvail = roomAvailability[type] !== undefined 
        ? !!roomAvailability[type] 
        : (hostel.availableRooms === undefined || hostel.availableRooms > 0);
      const count = roomCounts[type] !== undefined ? roomCounts[type] : (isAvail ? null : 0);

      const statusBadge = isAvail 
        ? `<span class="room-type-status-badge available">✓ Available ${count !== null && count > 0 ? `(${count} left)` : ''}</span>`
        : `<span class="room-type-status-badge unavailable">✕ Not Available / Full</span>`;

      return `
        <div class="room-type-card ${!isAvail ? 'room-type-card-sold-out' : ''}" style="display: flex; flex-direction: column; justify-content: space-between; ${!isAvail ? 'opacity: 0.78; background: #fffcfc; border-color: #fecaca;' : ''}">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem; flex-wrap: wrap; gap: 0.35rem;">
              <div class="room-type-name">${meta.icon} ${meta.label}</div>
              <span class="badge" style="background:#e0f2fe; color:#0369a1; font-size:0.7rem; font-weight:700;">${meta.sub}</span>
            </div>
            <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; margin-top: 0.35rem; margin-bottom: 0.35rem;">
              <div class="room-type-price">${formatGHS(price)} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">/ year</span></div>
              ${statusBadge}
            </div>
          </div>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.5rem; margin-bottom: 0;">
            ${isAvail ? 'Includes water supply, security fee, and campus utility base.' : 'This room type is currently full or unavailable for reservation.'}
          </p>
        </div>
      `;
    }).join("");
  }

  // Multiple Locations & Branches (2 or more locations vs None)
  const locationsContainer = document.getElementById("detail-locations-content");
  const locationsBadge = document.getElementById("detail-locations-badge");
  if (locationsContainer) {
    const hasMulti = !!(hostel.hasMultipleLocations && hostel.locations && hostel.locations.length > 0);
    if (hasMulti) {
      if (locationsBadge) {
        locationsBadge.textContent = `🏢 ${hostel.locations.length} Verified Branches`;
        locationsBadge.style.background = "#dbeafe";
        locationsBadge.style.color = "#1e40af";
      }
      locationsContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0 0 0.25rem 0;">
            This hostel operates across <strong>${hostel.locations.length} verified branches / locations</strong>:
          </p>
          ${hostel.locations.map((loc, idx) => `
            <div class="location-details-branch-item">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                <div style="font-weight: 700; font-size: 0.98rem; color: var(--text-primary);">
                  🏢 ${loc.name || `Location ${idx + 1}`}
                </div>
                ${loc.zone ? `<span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:700; font-size:0.75rem;">📍 ${loc.zone}</span>` : ''}
              </div>
              <div style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 0.25rem;">
                📍 <strong>Address / Directions:</strong> ${loc.address || 'Address provided upon booking'}
              </div>
              ${loc.phone ? `
                <div style="font-size: 0.82rem; color: var(--primary); font-weight: 600; margin-top: 0.15rem;">
                  📞 Branch Contact: <a href="tel:${loc.phone.replace(/[^0-9+]/g, '')}" style="color: var(--primary); text-decoration: underline;">${loc.phone}</a>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } else {
      if (locationsBadge) {
        locationsBadge.textContent = "📍 Single Location (None)";
        locationsBadge.style.background = "#f1f5f9";
        locationsBadge.style.color = "#475569";
      }
      locationsContainer.innerHTML = `
        <div class="location-none-banner" style="text-align: left; padding: 1rem 1.25rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">
            <span>📍</span> Single Location Property (No other branches)
          </div>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
            All rooms, check-in desks, and facilities are situated at <strong>${hostel.location}</strong>. There are no secondary annexes or branches (None).
          </p>
        </div>
      `;
    }
  }

  // Rules
  const rulesList = document.getElementById("detail-rules-list");
  if (rulesList) {
    rulesList.innerHTML = (hostel.rules || []).map(rule => `
      <li style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">
        • ${rule}
      </li>
    `).join("");
  }

  // Sidebar Booking Box
  const sidePrice = document.getElementById("side-booking-price");
  if (sidePrice) sidePrice.textContent = formatGHS(hostel.price);

  const sideAvailable = document.getElementById("side-available-count");
  if (sideAvailable) sideAvailable.textContent = `${hostel.availableRooms} rooms available`;

  // Owner contact details in sidebar
  const ownerNameEl = document.getElementById("side-owner-name");
  if (ownerNameEl) ownerNameEl.textContent = hostel.ownerName;

  const ownerPhoneEl = document.getElementById("side-owner-phone");
  if (ownerPhoneEl) {
    ownerPhoneEl.textContent = hostel.ownerPhone;
    ownerPhoneEl.href = `tel:${hostel.ownerPhone.replace(/\s+/g, '')}`;
  }

  const callBtn = document.getElementById("detail-call-btn");
  if (callBtn) {
    callBtn.href = `tel:${hostel.ownerPhone.replace(/\s+/g, '')}`;
  }

  const waBtn = document.getElementById("detail-whatsapp-btn");
  if (waBtn) {
    const waText = encodeURIComponent(`Hello ${hostel.ownerName}, I found ${hostel.name} on HostelHub Ghana and I would like to inquire about room availability.`);
    waBtn.href = `https://wa.me/${hostel.ownerWhatsapp}?text=${waText}`;
  }
}

function renderSimilarHostels(currentHostel) {
  const container = document.getElementById("similar-hostels-grid");
  if (!container) return;

  const all = getHostels();
  const similar = all.filter(h => h.id !== currentHostel.id && (h.zone === currentHostel.zone || h.location.includes(currentHostel.zone || ""))).slice(0, 3);

  if (similar.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted);">No similar hostels listed in this immediate area yet.</p>`;
    return;
  }

  container.innerHTML = similar.map(renderHostelCard).join("");
  attachFavoriteListeners();
}

function setupDetailModals(hostel) {
  const user = getCurrentUser();

  // 1. Inquiry Modal
  const openInquiryBtn = document.getElementById("open-inquiry-modal-btn");
  const inquiryModal = document.getElementById("inquiry-modal");
  const closeInquiryBtn = document.getElementById("close-inquiry-modal");
  const inquiryForm = document.getElementById("inquiry-form");

  if (openInquiryBtn && inquiryModal) {
    openInquiryBtn.onclick = () => {
      // Pre-fill user data
      const nameInput = document.getElementById("inquiry-name");
      const emailInput = document.getElementById("inquiry-email");
      const phoneInput = document.getElementById("inquiry-phone");
      if (nameInput) nameInput.value = user.name || "";
      if (emailInput) emailInput.value = user.email || "";
      if (phoneInput) phoneInput.value = user.phone || "";

      inquiryModal.classList.add("active");
    };
  }

  if (closeInquiryBtn && inquiryModal) {
    closeInquiryBtn.onclick = () => inquiryModal.classList.remove("active");
  }

  if (inquiryForm) {
    inquiryForm.onsubmit = function(e) {
      e.preventDefault();
      const message = document.getElementById("inquiry-message")?.value;
      const roomType = document.getElementById("inquiry-room-type")?.value || hostel.roomTypes[0];

      saveInquiry({
        hostelId: hostel.id,
        hostelName: hostel.name,
        studentName: document.getElementById("inquiry-name")?.value || user.name,
        studentEmail: document.getElementById("inquiry-email")?.value || user.email,
        studentPhone: document.getElementById("inquiry-phone")?.value || user.phone,
        university: hostel.university,
        roomTypeNeeded: roomType,
        message: message
      });

      inquiryModal?.classList.remove("active");
      inquiryForm.reset();
    };
  }

  // 2. Booking / Request Room Modal
  const openBookBtn = document.getElementById("open-booking-modal-btn");
  const bookModal = document.getElementById("booking-modal");
  const closeBookBtn = document.getElementById("close-booking-modal");
  const bookForm = document.getElementById("booking-form");

  if (openBookBtn && bookModal) {
    openBookBtn.onclick = () => {
      const roomSelect = document.getElementById("booking-room-type");
      if (roomSelect) {
        const roomAvailability = hostel.roomAvailability || {};
        const roomCounts = hostel.roomCounts || {};
        roomSelect.innerHTML = hostel.roomTypes.map(rt => {
          const price = hostel.roomPricing ? hostel.roomPricing[rt] || hostel.price : hostel.price;
          const isAvail = roomAvailability[rt] !== undefined ? !!roomAvailability[rt] : true;
          const count = roomCounts[rt];
          const availLabel = isAvail 
            ? (count !== undefined && count > 0 ? ` [Available - ${count} vacant]` : ' [Available]')
            : ' [✕ NOT AVAILABLE / FULL]';
          return `<option value="${rt}" data-price="${price}" ${!isAvail ? 'disabled' : ''}>${rt} - ${formatGHS(price)} / year${availLabel}</option>`;
        }).join("");
      }

      const bookName = document.getElementById("booking-name");
      const bookEmail = document.getElementById("booking-email");
      const bookPhone = document.getElementById("booking-phone");
      if (bookName) bookName.value = user.name || "";
      if (bookEmail) bookEmail.value = user.email || "";
      if (bookPhone) bookPhone.value = user.phone || "";

      bookModal.classList.add("active");
    };
  }

  if (closeBookBtn && bookModal) {
    closeBookBtn.onclick = () => bookModal.classList.remove("active");
  }

  if (bookForm) {
    bookForm.onsubmit = function(e) {
      e.preventDefault();
      const roomSelect = document.getElementById("booking-room-type");
      const selectedOption = roomSelect?.options[roomSelect.selectedIndex];
      const roomPrice = selectedOption ? parseFloat(selectedOption.getAttribute("data-price")) : hostel.price;

      saveBooking({
        hostelId: hostel.id,
        hostelName: hostel.name,
        studentName: document.getElementById("booking-name")?.value || user.name,
        studentEmail: document.getElementById("booking-email")?.value || user.email,
        studentPhone: document.getElementById("booking-phone")?.value || user.phone,
        university: hostel.university,
        roomType: roomSelect?.value || hostel.roomTypes[0],
        quotedPrice: roomPrice,
        academicYear: document.getElementById("booking-academic-year")?.value || "2026/2027",
        notes: document.getElementById("booking-notes")?.value || ""
      });

      bookModal?.classList.remove("active");
      bookForm.reset();
    };
  }

  // Close modals on background click
  window.onclick = function(event) {
    if (event.target === inquiryModal) inquiryModal.classList.remove("active");
    if (event.target === bookModal) bookModal.classList.remove("active");
  };
}

// Bind to window for HTML events
if (typeof window !== "undefined") {
  window.initHostelsPage = initHostelsPage;
  window.initHostelDetailsPage = initHostelDetailsPage;
}
