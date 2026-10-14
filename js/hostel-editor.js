/**
 * HostelHub KNUST - Hostel Customization & Live Editor
 * Allows users and owners to edit hostel names, pictures, pricing, zones,
 * amenities, room types, and contact details with live preview and local storage persistence.
 */

import { getHostelById, updateHostel, resetHostelToDefault, showToast, formatGHS } from './app.js';

export const PHOTO_PRESETS = [
  {
    name: "Modern Multistory Block",
    tag: "High-Rise",
    url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80"
  },
  {
    name: "Executive Balcony Residence",
    tag: "Balcony & Suites",
    url: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=1000&q=80"
  },
  {
    name: "Luxury En-suite Room",
    tag: "En-suite",
    url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80"
  },
  {
    name: "Gated Campus Enclave",
    tag: "Secure Compound",
    url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80"
  },
  {
    name: "Single Room with Study Desk",
    tag: "Study Space",
    url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80"
  },
  {
    name: "Spacious Two-in-a-Room Suite",
    tag: "2-in-a-room",
    url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80"
  },
  {
    name: "Modern Glass Facade Lodge",
    tag: "Contemporary",
    url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80"
  },
  {
    name: "Serene Garden Courtyard Hall",
    tag: "Quiet Courtyard",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80"
  }
];

export const AVAILABLE_AMENITIES = [
  "WiFi",
  "Standby Generator",
  "Water Tank",
  "24/7 Security",
  "Study Room",
  "Shuttle Bus",
  "Balcony",
  "Air Conditioning",
  "Gym",
  "DSTV Lounge",
  "Laundry Bay",
  "Kitchenette",
  "Swimming Pool",
  "Cleaning Service"
];

export const AVAILABLE_ROOM_TYPES = [
  "1 in a room",
  "2 in a room",
  "3 in a room",
  "4 in a room"
];

export const ROOM_TYPE_CONFIGS = [
  { id: "1 in a room", key: "1", label: "1 in a room (One in One)", typeTitle: "Single Occupancy", icon: "🛏️", defaultPrice: 9500, placeholder: "e.g. 9500", desc: "Private room with dedicated washroom & personal study area" },
  { id: "2 in a room", key: "2", label: "2 in a room", typeTitle: "Double Occupancy", icon: "🛏️🛏️", defaultPrice: 5800, placeholder: "e.g. 5800", desc: "Standard double room shared between 2 roommates" },
  { id: "3 in a room", key: "3", label: "3 in a room", typeTitle: "Triple Occupancy", icon: "🛏️🛏️🛏️", defaultPrice: 4800, placeholder: "e.g. 4800", desc: "Spacious room shared between 3 roommates" },
  { id: "4 in a room", key: "4", label: "4 in a room", typeTitle: "Quad Occupancy", icon: "🛏️🛏️🛏️🛏️", defaultPrice: 3800, placeholder: "e.g. 3800", desc: "Budget-friendly shared room for 4 roommates" }
];

let activeModal = null;
let currentHostelId = null;
let onSaveCallbackRef = null;
let currentUploadedCover = "";
let currentGalleryList = [];
let currentHasMultipleLocations = false;
let currentLocationsList = [];

/**
 * Client-side image compressor & processor using HTML5 Canvas.
 * Converts uploaded files into optimized, high-quality Base64 Data URLs (under ~120KB)
 * so that they can be safely and persistently stored in localStorage without quota limits.
 */
function compressImageFile(file, maxWidth = 1280, maxHeight = 960, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please upload a valid picture file (JPG, PNG, WEBP, HEIC)."));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({
          dataUrl,
          name: file.name,
          sizeKb: Math.round((dataUrl.length * 0.75) / 1024),
          width,
          height
        });
      };
      img.onerror = () => reject(new Error("Failed to process the uploaded photo file."));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Unable to read photo file from disk."));
    reader.readAsDataURL(file);
  });
}

/**
 * Ensures the editor modal container is in the DOM
 */
function ensureEditorModal() {
  let modal = document.getElementById("hostel-editor-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "hostel-editor-modal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-content editor-modal-content" style="max-width: 780px; padding: 0; overflow: hidden; display: flex; flex-direction: column; max-height: 92vh;">
        <div class="editor-modal-header">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="editor-header-icon">✏️</span>
            <div>
              <h3 class="modal-title" id="editor-title" style="margin: 0; font-size: 1.25rem;">Edit Hostel</h3>
              <div style="font-size: 0.8rem; color: var(--text-muted);" id="editor-subtitle">
                Customize hostel name, upload photos, description, and rates
              </div>
            </div>
          </div>
          <button type="button" class="modal-close-btn" id="editor-close-btn" title="Close Editor">&times;</button>
        </div>

        <form id="hostel-editor-form" style="display: flex; flex-direction: column; overflow: hidden; height: 100%;">
          <div class="editor-modal-body" style="padding: 1.5rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 1.5rem;">
            
            <!-- SECTION 1: Hostel Name & Freeform Residence Zone Description -->
            <div class="editor-section">
              <div class="editor-section-title">
                <span>🏷️</span> Hostel Name & Residence Zone Description
              </div>
              <div class="editor-fields-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label class="form-label" for="edit-name">
                    Hostel Name <span style="color: #ef4444;">*</span>
                  </label>
                  <input type="text" id="edit-name" class="form-control" placeholder="e.g. Brunei Complex (Hall 7)" required />
                </div>

                <!-- Residence Zone: Freeform Description without restricted dropdown options -->
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label class="form-label" for="edit-zone">
                    Residence Zone & Location Description <span style="color: #ef4444;">*</span>
                  </label>
                  <textarea 
                    id="edit-zone" 
                    class="form-control" 
                    rows="2" 
                    placeholder="Write the full residence zone name and complete description freely (e.g. Ayeduase - 4 mins walk to CCB & Brunei Gate, quiet study atmosphere behind CCB)..." 
                    required
                    style="line-height: 1.5;"
                  ></textarea>
                  <small style="color: var(--text-secondary); font-size: 0.78rem; display: block; margin-top: 0.35rem;">
                    ✍️ You can write any custom residence zone details and full description freely (no restricted dropdown options).
                  </small>
                </div>

                <div class="form-group">
                  <label class="form-label" for="edit-location">
                    Neighborhood / Street Address
                  </label>
                  <input type="text" id="edit-location" class="form-control" placeholder="e.g. Ayeduase Gate, KNUST, Kumasi" required />
                </div>

                <div class="form-group">
                  <label class="form-label" for="edit-distance">
                    Walking Distance to Campus / Gates
                  </label>
                  <input type="text" id="edit-distance" class="form-control" placeholder="e.g. 0.3 km from Ayeduase Gate (4 mins walk to CCB)" />
                </div>
              </div>
            </div>

            <!-- SECTION 2: Direct Picture Upload (Upload file instead of link) -->
            <div class="editor-section">
              <div class="editor-section-title">
                <span>📸</span> Upload Pictures of the Hostel
              </div>
              
              <!-- Direct File Upload Dropzone -->
              <div class="form-group" style="margin-bottom: 0.75rem;">
                <label class="form-label" style="display: flex; align-items: center; justify-content: space-between;">
                  <span>Hostel Cover Photo (Upload File) <span style="color: #ef4444;">*</span></span>
                  <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">Direct picture upload</span>
                </label>
                
                <input type="file" id="edit-photo-file-input" accept="image/*" style="display: none;" />
                
                <div id="photo-upload-dropzone" class="photo-upload-dropzone">
                  <div class="upload-icon-circle">📷</div>
                  <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">
                    Upload Hostel Picture
                  </div>
                  <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0;">
                    Drag and drop your hostel photo here, or <span style="color: var(--primary); text-decoration: underline; font-weight: 600;">browse from your computer / phone</span>
                  </p>
                  <span style="font-size: 0.74rem; color: var(--text-muted);">
                    Supports JPG, PNG, WEBP, and phone camera photos (automatically optimized)
                  </span>
                  <button type="button" class="btn btn-outline-primary btn-sm" id="btn-browse-photo" style="margin-top: 0.35rem; pointer-events: auto;">
                    📁 Choose Photo File
                  </button>
                </div>
              </div>

              <!-- Live Active Photo Preview Card -->
              <div class="uploaded-preview-container" id="uploaded-preview-box">
                <img 
                  id="edit-photo-preview" 
                  src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80" 
                  alt="Hostel Preview" 
                  class="uploaded-preview-img"
                  onerror="this.src='https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'"
                />
                <div style="flex: 1; display: flex; flex-direction: column; gap: 0.4rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                    <span class="badge badge-success" id="photo-status-badge" style="font-size: 0.76rem;">✓ Active Cover Photo</span>
                    <button type="button" class="btn btn-outline-primary btn-sm" id="btn-reupload-photo" style="padding: 0.3rem 0.65rem; font-size: 0.78rem;">
                      🔄 Upload Different Photo
                    </button>
                  </div>
                  <div id="edit-photo-info" style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.45;">
                    This photo displays as the primary hostel image on cards, home page, and details view.
                  </div>
                </div>
              </div>

              <!-- Additional Gallery Photos Upload -->
              <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; flex-wrap: wrap; gap: 0.5rem;">
                  <div>
                    <label class="form-label" style="margin: 0; font-size: 0.88rem;">
                      Additional Hostel Gallery Photos (<span id="gallery-count-badge">0</span> photos)
                    </label>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">
                      Upload additional interior, bedroom, study, or washroom photos
                    </div>
                  </div>
                  <input type="file" id="edit-gallery-file-input" accept="image/*" multiple style="display: none;" />
                  <button type="button" class="btn btn-outline btn-sm" id="btn-browse-gallery" style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem;">
                    <span>➕</span> Upload Gallery Photos
                  </button>
                </div>
                
                <div id="editor-gallery-grid" class="gallery-preview-grid">
                  <!-- Rendered dynamically -->
                </div>
              </div>

              <!-- Optional Collapsible: Web Link & KNUST Photo Presets -->
              <details style="margin-top: 1rem; background: var(--bg-muted); border-radius: var(--radius-sm); padding: 0.5rem 0.85rem; border: 1px solid var(--border-color);">
                <summary style="font-size: 0.8rem; color: var(--text-secondary); cursor: pointer; font-weight: 600;">
                  ⚙️ Alternative: Select preset KNUST hostel photo or enter image URL
                </summary>
                <div style="margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.75rem;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" for="edit-image-url" style="font-size: 0.78rem;">Image URL (Alternative)</label>
                    <div style="display: flex; gap: 0.5rem;">
                      <input type="url" id="edit-image-url" class="form-control" placeholder="https://..." style="font-size: 0.85rem;" />
                      <button type="button" class="btn btn-outline-primary btn-sm" id="btn-apply-url" style="font-size: 0.8rem;">
                        Apply URL
                      </button>
                    </div>
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 0.78rem; margin-bottom: 0.4rem;">Select Verified Photo Preset:</label>
                    <div class="preset-photo-grid" id="preset-photo-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.5rem;">
                      <!-- Generated dynamically -->
                    </div>
                  </div>
                </div>
              </details>
            </div>

            <!-- SECTION 3: Pricing & Capacity -->
            <div class="editor-section">
              <div class="editor-section-title">
                <span>💰</span> Pricing & Room Availability
              </div>
              <div class="editor-fields-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label" for="edit-price">
                    Annual Rate (GH₵) <span style="color: #ef4444;">*</span>
                  </label>
                  <input type="number" id="edit-price" class="form-control" min="1000" step="50" required />
                </div>

                <div class="form-group">
                  <label class="form-label" for="edit-available-rooms">
                    Available Rooms
                  </label>
                  <input type="number" id="edit-available-rooms" class="form-control" min="0" max="500" required />
                </div>

                <div class="form-group">
                  <label class="form-label" for="edit-total-rooms">
                    Total Rooms
                  </label>
                  <input type="number" id="edit-total-rooms" class="form-control" min="1" max="1000" />
                </div>

                <div class="form-group" style="grid-column: 1 / -1; display: flex; align-items: center; gap: 0.5rem; background: var(--bg-muted); padding: 0.75rem 1rem; border-radius: var(--radius-md);">
                  <input type="checkbox" id="edit-featured" style="width: 18px; height: 18px; accent-color: var(--primary);" />
                  <label for="edit-featured" style="font-size: 0.88rem; font-weight: 600; cursor: pointer; margin: 0;">
                    ⭐ Highlight as Featured Hostel on Homepage & Top of Search
                  </label>
                </div>
              </div>
            </div>

            <!-- SECTION 4: Room Types & Stated Price for Each -->
            <div class="editor-section">
              <div class="editor-section-title" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <span>🛏️</span> Room Types & Stated Price for Each
                </div>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">
                  Check each offered room and state its exact price (GH₵)
                </span>
              </div>
              
              <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.45;">
                Specify rates per student for <strong>1 in a room (One in One)</strong>, <strong>2 in a room</strong>, <strong>3 in a room</strong>, and <strong>4 in a room</strong>. Check the box to enable, and state the exact annual price in Ghana Cedis (GH₵).
              </p>

              <div class="room-pricing-editor-grid">
                ${ROOM_TYPE_CONFIGS.map(r => `
                  <div class="room-pricing-card" id="room-card-${r.key}">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
                      <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 0.95rem; cursor: pointer; margin: 0;">
                        <input 
                          type="checkbox" 
                          id="edit-room-enable-${r.key}" 
                          data-room-key="${r.key}" 
                          data-room-id="${r.id}"
                          style="width: 18px; height: 18px; accent-color: var(--primary);" 
                        />
                        <span>${r.icon} ${r.label}</span>
                      </label>
                      <span class="badge" style="font-size: 0.68rem; background: #e0f2fe; color: #0369a1; font-weight: 700;">${r.typeTitle}</span>
                    </div>

                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem; line-height: 1.35;">
                      ${r.desc}
                    </div>

                    <!-- Room Availability Toggle (Available vs Not Available / Sold Out) -->
                    <div class="room-avail-toggle-bar">
                      <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-primary);">
                        Room Status:
                      </span>
                      <div class="room-avail-btn-group" role="group">
                        <button 
                          type="button" 
                          class="room-avail-toggle-btn active-available" 
                          id="room-avail-btn-yes-${r.key}" 
                          data-room-key="${r.key}"
                          data-avail="true"
                          title="Set this room type as Available for booking"
                        >
                          ✓ Available
                        </button>
                        <button 
                          type="button" 
                          class="room-avail-toggle-btn" 
                          id="room-avail-btn-no-${r.key}" 
                          data-room-key="${r.key}"
                          data-avail="false"
                          title="Set this room type as Not Available / Full"
                        >
                          ✕ Not Available
                        </button>
                      </div>
                    </div>

                    <!-- Rooms Vacant Count -->
                    <div class="room-avail-count-row" id="room-count-row-${r.key}">
                      <span style="color: var(--text-secondary); font-weight: 600;">Rooms Vacant:</span>
                      <div style="display: flex; align-items: center; gap: 0.35rem;">
                        <input 
                          type="number" 
                          id="edit-room-count-${r.key}" 
                          class="room-avail-count-input" 
                          data-room-key="${r.key}" 
                          min="0" 
                          max="999" 
                          value="4" 
                          placeholder="0"
                        />
                        <span style="font-size: 0.72rem; color: var(--text-muted);">left</span>
                      </div>
                    </div>

                    <label class="form-label" style="font-size: 0.78rem; margin-top: 0.6rem; margin-bottom: 0.25rem;" for="edit-room-price-${r.key}">
                      State Price (GH₵ per academic year) *:
                    </label>
                    <div class="room-price-input-group" id="room-price-group-${r.key}">
                      <span class="room-price-prefix">GH₵</span>
                      <input 
                        type="number" 
                        id="edit-room-price-${r.key}" 
                        class="room-price-input" 
                        data-room-id="${r.id}" 
                        placeholder="${r.placeholder}" 
                        min="500" 
                        step="50" 
                      />
                      <span class="room-price-suffix">/ year</span>
                    </div>
                  </div>
                `).join('')}
              </div>

              <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                <label class="form-label" style="margin-bottom: 0.4rem; font-size: 0.88rem;">Hostel Amenities & Facilities:</label>
                <div class="amenities-checkbox-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.5rem;">
                  ${AVAILABLE_AMENITIES.map(am => `
                    <label class="custom-checkbox-pill">
                      <input type="checkbox" name="edit-amenity" value="${am}" />
                      <span>${am}</span>
                    </label>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- SECTION 5: Hostel Locations & Branches (2 or More Locations vs None) -->
            <div class="editor-section">
              <div class="editor-section-title" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <span>🏢</span> Multiple Locations & Branches
                </div>
                <button type="button" class="btn btn-sm btn-none-location" id="btn-quick-none-loc" title="Set to single location with no additional branches">
                  🚫 None (Single Location)
                </button>
              </div>

              <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.45;">
                Does this hostel have <strong>two or more locations</strong> (e.g. Main Campus Branch, Kotei Annex, Block B)? If not, click the <strong>"None"</strong> button to keep it strictly as a single location property.
              </p>

              <div class="locations-toggle-bar">
                <button type="button" class="locations-mode-btn active" id="mode-btn-none">
                  🚫 None (Single Location Only)
                </button>
                <button type="button" class="locations-mode-btn" id="mode-btn-multiple">
                  🏢 2 or More Locations of the Same Hostel
                </button>
              </div>

              <!-- Container for Single Location / None view -->
              <div id="location-none-container" class="location-none-banner">
                <div style="font-size: 1.75rem; margin-bottom: 0.35rem;">📍</div>
                <div style="font-weight: 700; color: var(--text-primary); font-size: 1rem;">
                  Single Location Property (None)
                </div>
                <p style="font-size: 0.84rem; color: var(--text-muted); margin: 0.35rem auto 0.75rem auto; max-width: 480px; line-height: 1.4;">
                  This hostel operates strictly from one single main compound: <br/>
                  <span id="primary-loc-text" style="font-weight: 700; color: var(--text-primary);">Main Compound Address</span>. <br/>
                  No secondary branches, annexes, or second locations exist.
                </p>
                <button type="button" class="btn btn-outline btn-sm" id="btn-activate-multiple-locations" style="border-color: var(--primary); color: var(--primary); font-weight: 600;">
                  🏢 Has 2 or More Locations? Click to Configure Branches
                </button>
              </div>

              <!-- Container for 2 or More Locations view -->
              <div id="location-multiple-container" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; background: #eff6ff; padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); border: 1px solid #bfdbfe; flex-wrap: wrap; gap: 0.5rem;">
                  <span style="font-size: 0.82rem; font-weight: 700; color: #1e40af;">
                    🏢 2 or More Locations Active: Enter details for each branch
                  </span>
                  <button type="button" class="btn btn-outline btn-sm btn-none-location" id="btn-multi-to-none" style="font-size: 0.78rem; padding: 0.25rem 0.6rem;">
                    🚫 None (Single Location Only)
                  </button>
                </div>

                <div id="editor-branches-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
                  <!-- Dynamic branch cards generated here -->
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
                  <button type="button" class="btn btn-outline btn-sm" id="btn-add-another-branch" style="border-color: var(--primary); color: var(--primary); font-weight: 600; display: flex; align-items: center; gap: 0.4rem;">
                    <span>➕</span> Add Another Location / Branch
                  </button>
                  <button type="button" class="btn btn-outline btn-sm btn-none-location" id="btn-reset-locations-none">
                    🚫 None (Reset to Single Location)
                  </button>
                </div>
              </div>
            </div>

            <!-- SECTION 6: Contact Details & Description -->
            <div class="editor-section">
              <div class="editor-section-title">
                <span>📞</span> Manager Contact & Description
              </div>
              <div class="editor-fields-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                  <label class="form-label" for="edit-owner-name">Manager / Owner Name</label>
                  <input type="text" id="edit-owner-name" class="form-control" placeholder="e.g. Alhaji Baba Yakubu" />
                </div>

                <div class="form-group">
                  <label class="form-label" for="edit-owner-whatsapp">WhatsApp Contact (e.g. 233243334455)</label>
                  <input type="text" id="edit-owner-whatsapp" class="form-control" placeholder="233243334455" />
                </div>

                <div class="form-group" style="grid-column: 1 / -1;">
                  <label class="form-label" for="edit-owner-phone">Display Phone Number</label>
                  <input type="text" id="edit-owner-phone" class="form-control" placeholder="+233 24 333 4455" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-description">Hostel Description & Details</label>
                <textarea id="edit-description" class="form-control" rows="3" placeholder="Describe the hostel, security, atmosphere, water availability..."></textarea>
              </div>
            </div>

          </div>

          <!-- MODAL FOOTER ACTIONS -->
          <div class="editor-modal-footer" style="padding: 1rem 1.5rem; background-color: var(--bg-muted); border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-outline btn-sm" id="btn-reset-default" style="color: #dc2626; border-color: #fca5a5;">
              ↺ Reset to Original
            </button>
            <div style="display: flex; gap: 0.75rem;">
              <button type="button" class="btn btn-outline" id="btn-cancel-edit">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" id="btn-save-changes" style="font-weight: 700; padding: 0.6rem 1.5rem;">
                💾 Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    // Event listeners on modal container
    const closeBtn = document.getElementById("editor-close-btn");
    const cancelBtn = document.getElementById("btn-cancel-edit");
    const resetBtn = document.getElementById("btn-reset-default");
    const form = document.getElementById("hostel-editor-form");
    
    // File inputs & Dropzone
    const dropzone = document.getElementById("photo-upload-dropzone");
    const mainFileInput = document.getElementById("edit-photo-file-input");
    const galleryFileInput = document.getElementById("edit-gallery-file-input");
    const browsePhotoBtn = document.getElementById("btn-browse-photo");
    const reuploadPhotoBtn = document.getElementById("btn-reupload-photo");
    const browseGalleryBtn = document.getElementById("btn-browse-gallery");

    const imageUrlInput = document.getElementById("edit-image-url");
    const applyUrlBtn = document.getElementById("btn-apply-url");
    const imagePreview = document.getElementById("edit-photo-preview");

    closeBtn.onclick = closeHostelEditor;
    cancelBtn.onclick = closeHostelEditor;

    modal.onclick = (e) => {
      if (e.target === modal) {
        closeHostelEditor();
      }
    };

    // Manual photo selection clicks
    const triggerMainFileInput = () => mainFileInput.click();
    if (browsePhotoBtn) browsePhotoBtn.onclick = (e) => { e.stopPropagation(); triggerMainFileInput(); };
    if (reuploadPhotoBtn) reuploadPhotoBtn.onclick = (e) => { e.stopPropagation(); triggerMainFileInput(); };
    if (dropzone) {
      dropzone.onclick = (e) => {
        if (e.target !== browsePhotoBtn) {
          triggerMainFileInput();
        }
      };
    }

    if (browseGalleryBtn && galleryFileInput) {
      browseGalleryBtn.onclick = () => galleryFileInput.click();
    }

    // Drag and Drop listeners for main cover photo
    if (dropzone) {
      ["dragenter", "dragover"].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add("dragover");
        }, false);
      });

      ["dragleave", "dragend"].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove("dragover");
        }, false);
      });

      dropzone.addEventListener("drop", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          await processMainUploadedFile(e.dataTransfer.files[0]);
        }
      }, false);
    }

    // Main file input change handler
    if (mainFileInput) {
      mainFileInput.onchange = async () => {
        if (mainFileInput.files && mainFileInput.files[0]) {
          await processMainUploadedFile(mainFileInput.files[0]);
          mainFileInput.value = ""; // reset so same file can be chosen again
        }
      };
    }

    // Process and compress main uploaded photo
    async function processMainUploadedFile(file) {
      try {
        showToast("Processing and optimizing hostel picture...", "info");
        const result = await compressImageFile(file);
        currentUploadedCover = result.dataUrl;
        imagePreview.src = result.dataUrl;
        if (imageUrlInput) imageUrlInput.value = "";
        
        const photoInfo = document.getElementById("edit-photo-info");
        if (photoInfo) {
          photoInfo.innerHTML = `
            <strong style="color: #059669;">✓ Photo Uploaded:</strong> ${result.name}<br/>
            <span style="font-size: 0.74rem; color: var(--text-muted);">${result.width}×${result.height}px • ${result.sizeKb} KB optimized</span>
          `;
        }
        showToast("✓ Hostel picture uploaded successfully!", "success");
      } catch (err) {
        showToast(err.message || "Failed to upload picture.", "error");
      }
    }

    // Additional gallery photos upload handler
    if (galleryFileInput) {
      galleryFileInput.onchange = async () => {
        if (galleryFileInput.files && galleryFileInput.files.length > 0) {
          const files = Array.from(galleryFileInput.files);
          showToast(`Processing ${files.length} gallery photo(s)...`, "info");
          for (const file of files) {
            try {
              const res = await compressImageFile(file, 1024, 768, 0.80);
              currentGalleryList.push(res.dataUrl);
            } catch (err) {
              console.error("Gallery upload error:", err);
            }
          }
          galleryFileInput.value = "";
          renderGalleryThumbnails();
          showToast("✓ Gallery photos uploaded!", "success");
        }
      };
    }

    // Optional manual URL apply
    if (applyUrlBtn && imageUrlInput) {
      applyUrlBtn.onclick = () => {
        const val = imageUrlInput.value.trim();
        if (val) {
          currentUploadedCover = val;
          imagePreview.src = val;
          const photoInfo = document.getElementById("edit-photo-info");
          if (photoInfo) photoInfo.textContent = `Applied image from URL.`;
          showToast("Photo URL applied!", "info");
        }
      };
    }

    // Render Preset Photos
    const presetGrid = document.getElementById("preset-photo-grid");
    if (presetGrid) {
      presetGrid.innerHTML = PHOTO_PRESETS.map((p) => `
        <div 
          class="preset-photo-item" 
          data-url="${p.url}" 
          title="${p.name} (${p.tag})"
          style="cursor: pointer; border-radius: var(--radius-sm); overflow: hidden; border: 2px solid transparent; transition: all 0.2s ease; position: relative;"
        >
          <img src="${p.url}" alt="${p.name}" style="width: 100%; height: 60px; object-fit: cover; display: block;" />
          <div style="font-size: 0.65rem; padding: 0.15rem 0.35rem; background: rgba(15,23,42,0.85); color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${p.tag}
          </div>
        </div>
      `).join('');

      presetGrid.querySelectorAll(".preset-photo-item").forEach(item => {
        item.addEventListener("click", function() {
          const url = this.getAttribute("data-url");
          currentUploadedCover = url;
          if (imageUrlInput) imageUrlInput.value = url;
          imagePreview.src = url;
          presetGrid.querySelectorAll(".preset-photo-item").forEach(i => i.style.borderColor = "transparent");
          this.style.borderColor = "var(--primary)";
          const photoInfo = document.getElementById("edit-photo-info");
          if (photoInfo) photoInfo.textContent = `Applied verified KNUST preset photo.`;
          showToast("Picture preset applied! Click 'Save Changes' to update.", "info");
        });
      });
    }

    // Reset to Original button
    resetBtn.onclick = () => {
      if (!currentHostelId) return;
      if (confirm("Are you sure you want to reset this hostel back to its original default information and picture?")) {
        const resetData = resetHostelToDefault(currentHostelId);
        if (resetData) {
          showToast(`Hostel reset to default values.`, "info");
          closeHostelEditor();
          if (typeof onSaveCallbackRef === "function") {
            onSaveCallbackRef(resetData);
          }
          // Also trigger general DOM updates
          updateDOMAfterSave(resetData);
        }
      }
    };

    // Room pricing interactive checkbox, availability toggle, and card listeners
    ROOM_TYPE_CONFIGS.forEach(rc => {
      const cb = document.getElementById(`edit-room-enable-${rc.key}`);
      const card = document.getElementById(`room-card-${rc.key}`);
      const priceInput = document.getElementById(`edit-room-price-${rc.key}`);
      const btnYes = document.getElementById(`room-avail-btn-yes-${rc.key}`);
      const btnNo = document.getElementById(`room-avail-btn-no-${rc.key}`);
      const countInput = document.getElementById(`edit-room-count-${rc.key}`);

      // Helper to update visual availability toggle state
      const setRoomAvailState = (isAvail) => {
        if (btnYes && btnNo) {
          if (isAvail) {
            btnYes.classList.add("active-available");
            btnNo.classList.remove("active-unavailable");
            if (card) card.classList.remove("is-sold-out");
            if (countInput && parseInt(countInput.value, 10) <= 0) {
              countInput.value = "3";
            }
          } else {
            btnYes.classList.remove("active-available");
            btnNo.classList.add("active-unavailable");
            if (card) card.classList.add("is-sold-out");
            if (countInput) {
              countInput.value = "0";
            }
          }
        }
      };

      if (btnYes) {
        btnYes.onclick = () => {
          setRoomAvailState(true);
          // Also make sure checkbox is enabled
          if (cb && !cb.checked) {
            cb.checked = true;
            cb.dispatchEvent(new Event("change"));
          }
        };
      }

      if (btnNo) {
        btnNo.onclick = () => {
          setRoomAvailState(false);
          // If the user specifically marks this room type as Not Available, keep it offered but with 0 vacant/not available status
          if (cb && !cb.checked) {
            cb.checked = true;
            cb.dispatchEvent(new Event("change"));
          }
        };
      }

      if (countInput) {
        countInput.oninput = () => {
          const val = parseInt(countInput.value, 10);
          if (val > 0) {
            btnYes?.classList.add("active-available");
            btnNo?.classList.remove("active-unavailable");
            card?.classList.remove("is-sold-out");
          } else if (val === 0) {
            btnYes?.classList.remove("active-available");
            btnNo?.classList.add("active-unavailable");
            card?.classList.add("is-sold-out");
          }
        };
      }

      if (cb && card && priceInput) {
        cb.onchange = () => {
          if (cb.checked) {
            card.classList.add("active");
            card.classList.remove("disabled");
            priceInput.disabled = false;
            if (countInput) countInput.disabled = false;
            if (btnYes) btnYes.disabled = false;
            if (btnNo) btnNo.disabled = false;
            if (!priceInput.value || parseInt(priceInput.value, 10) <= 0) {
              priceInput.value = rc.defaultPrice;
            }
            priceInput.focus();
          } else {
            card.classList.remove("active");
            card.classList.add("disabled");
            priceInput.disabled = true;
            if (countInput) countInput.disabled = true;
            if (btnYes) btnYes.disabled = true;
            if (btnNo) btnNo.disabled = true;
          }
        };
      }
    });

    // Locations & Branches toggle buttons & None handlers
    const modeBtnNone = document.getElementById("mode-btn-none");
    const modeBtnMulti = document.getElementById("mode-btn-multiple");
    const quickNoneBtn = document.getElementById("btn-quick-none-loc");
    const multiToNoneBtn = document.getElementById("btn-multi-to-none");
    const resetLocNoneBtn = document.getElementById("btn-reset-locations-none");
    const activateMultiBtn = document.getElementById("btn-activate-multiple-locations");
    const addBranchBtn = document.getElementById("btn-add-another-branch");

    if (modeBtnNone) modeBtnNone.onclick = () => setLocationsToNone();
    if (quickNoneBtn) quickNoneBtn.onclick = () => setLocationsToNone();
    if (multiToNoneBtn) multiToNoneBtn.onclick = () => setLocationsToNone();
    if (resetLocNoneBtn) resetLocNoneBtn.onclick = () => setLocationsToNone();

    if (modeBtnMulti) modeBtnMulti.onclick = () => setLocationsToMultiple();
    if (activateMultiBtn) activateMultiBtn.onclick = () => setLocationsToMultiple();

    if (addBranchBtn) {
      addBranchBtn.onclick = () => {
        const nextNum = currentLocationsList.length + 1;
        const mainZone = document.getElementById("edit-zone")?.value || "Ayeduase";
        const mainPhone = document.getElementById("edit-owner-phone")?.value || "";
        currentLocationsList.push({
          name: `Branch ${nextNum}`,
          zone: mainZone,
          address: "",
          phone: mainPhone
        });
        renderLocationBranchesEditor();
        showToast(`Added Branch #${nextNum}. Fill in its address.`, "info");
      };
    }

    // Form submission (Save Changes)
    form.onsubmit = (e) => {
      e.preventDefault();
      saveHostelChanges();
    };
  }

  activeModal = modal;
  return modal;
}

/**
 * Sets hostel locations to Single Location (None)
 */
function setLocationsToNone() {
  currentHasMultipleLocations = false;
  currentLocationsList = [];
  renderLocationBranchesEditor();
  showToast("Hostel set to Single Location (None). No secondary branches.", "info");
}

/**
 * Enables 2 or More Locations mode
 */
function setLocationsToMultiple() {
  currentHasMultipleLocations = true;
  const currentLocVal = document.getElementById("edit-location")?.value || "Main Campus Area";
  const mainZone = document.getElementById("edit-zone")?.value || "Ayeduase";
  const mainPhone = document.getElementById("edit-owner-phone")?.value || "";

  if (currentLocationsList.length < 2) {
    currentLocationsList = [
      {
        name: "Branch 1 (Main Campus)",
        zone: mainZone,
        address: currentLocVal,
        phone: mainPhone
      },
      {
        name: "Branch 2 (Annex)",
        zone: "Kotei",
        address: "Kotei Road, near taxi rank",
        phone: mainPhone
      }
    ];
  }
  renderLocationBranchesEditor();
  showToast("Multiple Locations mode enabled. Fill in details for each branch.", "info");
}

/**
 * Renders the locations branches list in editor modal
 */
function renderLocationBranchesEditor() {
  const noneContainer = document.getElementById("location-none-container");
  const multiContainer = document.getElementById("location-multiple-container");
  const modeBtnNone = document.getElementById("mode-btn-none");
  const modeBtnMulti = document.getElementById("mode-btn-multiple");
  const quickNoneBtn = document.getElementById("btn-quick-none-loc");
  const branchesListEl = document.getElementById("editor-branches-list");
  const primaryLocEl = document.getElementById("primary-loc-text");

  if (!noneContainer || !multiContainer) return;

  const currentLocVal = document.getElementById("edit-location")?.value || "Main Compound Address";
  if (primaryLocEl) primaryLocEl.textContent = currentLocVal;

  if (!currentHasMultipleLocations) {
    noneContainer.style.display = "block";
    multiContainer.style.display = "none";
    if (modeBtnNone) modeBtnNone.classList.add("active");
    if (modeBtnMulti) modeBtnMulti.classList.remove("active");
    if (quickNoneBtn) {
      quickNoneBtn.classList.add("active");
      quickNoneBtn.textContent = "✓ None (Single Location)";
    }
  } else {
    noneContainer.style.display = "none";
    multiContainer.style.display = "block";
    if (modeBtnNone) modeBtnNone.classList.remove("active");
    if (modeBtnMulti) modeBtnMulti.classList.add("active");
    if (quickNoneBtn) {
      quickNoneBtn.classList.remove("active");
      quickNoneBtn.textContent = "🚫 Click for None";
    }

    if (branchesListEl) {
      branchesListEl.innerHTML = currentLocationsList.map((loc, idx) => `
        <div class="location-branch-card" data-index="${idx}">
          <div class="branch-header">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="branch-badge">🏢 Location #${idx + 1}</span>
              <strong style="font-size: 0.92rem; color: var(--text-primary);">${loc.name || `Location #${idx + 1}`}</strong>
            </div>
            ${currentLocationsList.length > 2 ? `
              <button type="button" class="btn btn-outline btn-sm btn-remove-branch" data-index="${idx}" style="color: #dc2626; border-color: #fca5a5; font-size: 0.75rem; padding: 0.2rem 0.55rem;">
                ✕ Remove
              </button>
            ` : `
              <span style="font-size: 0.72rem; color: var(--text-muted); font-style: italic;">
                (Minimum 2 locations required for multi-branch)
              </span>
            `}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.78rem;">Branch Name / Identifier *</label>
              <input 
                type="text" 
                class="form-control branch-field-name" 
                data-index="${idx}" 
                value="${loc.name || ''}" 
                placeholder="e.g. Branch 1 (Ayeduase Gate) or Annex" 
                required 
              />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.78rem;">Residence Zone / Suburb</label>
              <input 
                type="text" 
                class="form-control branch-field-zone" 
                data-index="${idx}" 
                value="${loc.zone || ''}" 
                placeholder="e.g. Ayeduase / Kotei / Bomso" 
              />
            </div>
            <div class="form-group" style="grid-column: 1 / -1; margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.78rem;">Address & Landmarks *</label>
              <input 
                type="text" 
                class="form-control branch-field-address" 
                data-index="${idx}" 
                value="${loc.address || ''}" 
                placeholder="e.g. Near CCB, 5 minutes walk to Engineering faculty" 
                required 
              />
            </div>
            <div class="form-group" style="grid-column: 1 / -1; margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.78rem;">Branch Caretaker / Front Desk Phone</label>
              <input 
                type="text" 
                class="form-control branch-field-phone" 
                data-index="${idx}" 
                value="${loc.phone || ''}" 
                placeholder="e.g. +233 24 123 4567" 
              />
            </div>
          </div>
        </div>
      `).join("");

      // Update in-memory locations array on user input
      branchesListEl.querySelectorAll(".branch-field-name").forEach(input => {
        input.oninput = (e) => {
          const i = parseInt(input.getAttribute("data-index"), 10);
          if (currentLocationsList[i]) currentLocationsList[i].name = e.target.value;
        };
      });
      branchesListEl.querySelectorAll(".branch-field-zone").forEach(input => {
        input.oninput = (e) => {
          const i = parseInt(input.getAttribute("data-index"), 10);
          if (currentLocationsList[i]) currentLocationsList[i].zone = e.target.value;
        };
      });
      branchesListEl.querySelectorAll(".branch-field-address").forEach(input => {
        input.oninput = (e) => {
          const i = parseInt(input.getAttribute("data-index"), 10);
          if (currentLocationsList[i]) currentLocationsList[i].address = e.target.value;
        };
      });
      branchesListEl.querySelectorAll(".branch-field-phone").forEach(input => {
        input.oninput = (e) => {
          const i = parseInt(input.getAttribute("data-index"), 10);
          if (currentLocationsList[i]) currentLocationsList[i].phone = e.target.value;
        };
      });

      // Remove buttons
      branchesListEl.querySelectorAll(".btn-remove-branch").forEach(btn => {
        btn.onclick = () => {
          const i = parseInt(btn.getAttribute("data-index"), 10);
          if (!isNaN(i) && i >= 0 && i < currentLocationsList.length) {
            currentLocationsList.splice(i, 1);
            if (currentLocationsList.length < 2) {
              currentHasMultipleLocations = false;
              currentLocationsList = [];
              showToast("Switched to Single Location (None) as fewer than 2 locations remain.", "info");
            }
            renderLocationBranchesEditor();
          }
        };
      });
    }
  }
}

/**
 * Renders gallery thumbnails with delete button in editor modal
 */
function renderGalleryThumbnails() {
  const container = document.getElementById("editor-gallery-grid");
  const countBadge = document.getElementById("gallery-count-badge");
  if (!container) return;

  if (countBadge) countBadge.textContent = currentGalleryList.length;

  if (currentGalleryList.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 0.5rem 0;">
        No additional gallery photos uploaded yet. Click "+ Upload Gallery Photos" above to add room & facility photos.
      </div>
    `;
    return;
  }

  container.innerHTML = currentGalleryList.map((imgSrc, idx) => `
    <div class="gallery-preview-item" title="Gallery photo ${idx + 1}">
      <img src="${imgSrc}" alt="Gallery photo ${idx + 1}" />
      <button type="button" class="gallery-preview-remove" data-index="${idx}" title="Remove photo">✕</button>
    </div>
  `).join('');

  container.querySelectorAll(".gallery-preview-remove").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      if (!isNaN(idx) && idx >= 0 && idx < currentGalleryList.length) {
        currentGalleryList.splice(idx, 1);
        renderGalleryThumbnails();
      }
    };
  });
}

/**
 * Opens the editor for a specific hostel ID
 */
export function openHostelEditor(hostelId, onSaveCallback = null) {
  const hostel = getHostelById(hostelId);
  if (!hostel) {
    showToast("Error: Hostel not found.", "error");
    return;
  }

  currentHostelId = hostelId;
  onSaveCallbackRef = onSaveCallback;
  ensureEditorModal();

  // Populate basic text fields
  document.getElementById("editor-title").textContent = `Edit Hostel: ${hostel.name}`;
  document.getElementById("editor-subtitle").textContent = `Zone: ${hostel.zone || 'KNUST Enclave'} • ID: ${hostel.id}`;

  document.getElementById("edit-name").value = hostel.name || "";
  
  // Residence Zone: Write full description freely without options
  const zoneEl = document.getElementById("edit-zone");
  if (zoneEl) {
    zoneEl.value = hostel.zone || hostel.location || "";
  }

  document.getElementById("edit-location").value = hostel.location || "";
  document.getElementById("edit-distance").value = hostel.distance || "";

  // Pictures state
  currentUploadedCover = hostel.image || "";
  currentGalleryList = Array.isArray(hostel.gallery) && hostel.gallery.length > 0 
    ? [...hostel.gallery] 
    : (hostel.image ? [hostel.image] : []);

  const imagePreview = document.getElementById("edit-photo-preview");
  if (imagePreview) {
    imagePreview.src = currentUploadedCover || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80";
  }

  const photoInfo = document.getElementById("edit-photo-info");
  if (photoInfo) {
    photoInfo.innerHTML = `
      <span style="color: var(--text-primary); font-weight: 600;">Current Cover Photo Loaded.</span><br/>
      Drop a new photo onto the box above or click "Choose Photo File" to replace it with a picture from your computer.
    `;
  }

  const urlInput = document.getElementById("edit-image-url");
  if (urlInput) {
    urlInput.value = currentUploadedCover.startsWith("data:") ? "" : currentUploadedCover;
  }

  // Render gallery
  renderGalleryThumbnails();

  // Pricing & Capacity
  document.getElementById("edit-price").value = hostel.price || 5000;
  document.getElementById("edit-available-rooms").value = hostel.availableRooms !== undefined ? hostel.availableRooms : 10;
  document.getElementById("edit-total-rooms").value = hostel.totalRooms || 50;
  document.getElementById("edit-featured").checked = !!hostel.featured;

  // Room Types & Stated Price for Each (1 in a room, 2 in a room, 3 in a room, 4 in a room)
  const hostelPricing = hostel.roomPricing || {};
  const curRoomTypes = hostel.roomTypes || ["1 in a room", "2 in a room", "4 in a room"];
  const hostelRoomAvailability = hostel.roomAvailability || {};
  const hostelRoomCounts = hostel.roomCounts || {};

  ROOM_TYPE_CONFIGS.forEach(rc => {
    const cb = document.getElementById(`edit-room-enable-${rc.key}`);
    const card = document.getElementById(`room-card-${rc.key}`);
    const priceInput = document.getElementById(`edit-room-price-${rc.key}`);
    const btnYes = document.getElementById(`room-avail-btn-yes-${rc.key}`);
    const btnNo = document.getElementById(`room-avail-btn-no-${rc.key}`);
    const countInput = document.getElementById(`edit-room-count-${rc.key}`);

    const isOffered = curRoomTypes.includes(rc.id) || (hostelPricing[rc.id] !== undefined);

    let statedPrice = hostelPricing[rc.id];
    if (!statedPrice || isNaN(statedPrice)) {
      if (rc.key === "1") statedPrice = Math.round((hostel.price || 5000) * 1.6);
      else if (rc.key === "2") statedPrice = hostel.price || 5000;
      else if (rc.key === "3") statedPrice = Math.round((hostel.price || 5000) * 0.85);
      else if (rc.key === "4") statedPrice = Math.round((hostel.price || 5000) * 0.7);
    }

    // Determine availability: check explicit roomAvailability, or count > 0, or default to true if offered
    let isAvail = true;
    if (hostelRoomAvailability[rc.id] !== undefined) {
      isAvail = !!hostelRoomAvailability[rc.id];
    } else if (hostel.availableRooms !== undefined && hostel.availableRooms <= 0) {
      isAvail = false;
    }

    let vacantCount = hostelRoomCounts[rc.id];
    if (vacantCount === undefined || isNaN(vacantCount)) {
      vacantCount = isAvail ? Math.max(1, Math.floor((hostel.availableRooms || 6) / 2)) : 0;
    }

    if (cb) cb.checked = isOffered;
    if (priceInput) {
      priceInput.value = statedPrice || rc.defaultPrice;
      priceInput.disabled = !isOffered;
    }

    if (countInput) {
      countInput.value = vacantCount;
      countInput.disabled = !isOffered;
    }

    if (btnYes && btnNo) {
      btnYes.disabled = !isOffered;
      btnNo.disabled = !isOffered;
      if (isAvail) {
        btnYes.classList.add("active-available");
        btnNo.classList.remove("active-unavailable");
      } else {
        btnYes.classList.remove("active-available");
        btnNo.classList.add("active-unavailable");
      }
    }

    if (card) {
      if (isOffered) {
        card.classList.add("active");
        card.classList.remove("disabled");
        if (!isAvail) {
          card.classList.add("is-sold-out");
        } else {
          card.classList.remove("is-sold-out");
        }
      } else {
        card.classList.remove("active");
        card.classList.add("disabled");
        card.classList.remove("is-sold-out");
      }
    }
  });

  // Multiple Locations & Branches (2 or more locations vs None)
  currentHasMultipleLocations = !!(hostel.hasMultipleLocations && Array.isArray(hostel.locations) && hostel.locations.length >= 2);
  currentLocationsList = (Array.isArray(hostel.locations) && hostel.locations.length > 0)
    ? JSON.parse(JSON.stringify(hostel.locations))
    : [];

  renderLocationBranchesEditor();

  // Amenities
  const curAmenities = hostel.amenities || [];
  document.querySelectorAll("input[name='edit-amenity']").forEach(cb => {
    cb.checked = curAmenities.includes(cb.value);
  });

  // Contact
  document.getElementById("edit-owner-name").value = hostel.ownerName || "";
  document.getElementById("edit-owner-whatsapp").value = hostel.ownerWhatsapp || "";
  document.getElementById("edit-owner-phone").value = hostel.ownerPhone || "";
  document.getElementById("edit-description").value = hostel.description || "";

  // Show modal
  activeModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

/**
 * Closes the editor modal
 */
export function closeHostelEditor() {
  if (activeModal) {
    activeModal.classList.remove("active");
  }
  document.body.style.overflow = "";
}

/**
 * Gathers updated values and writes to storage
 */
function saveHostelChanges() {
  if (!currentHostelId) return;

  const hostel = getHostelById(currentHostelId);

  const name = document.getElementById("edit-name").value.trim();
  
  // Residence Zone: read full freeform description
  const zone = (document.getElementById("edit-zone").value || "").trim() || (hostel ? hostel.zone : "Ayeduase");
  
  const location = document.getElementById("edit-location").value.trim();
  const distance = document.getElementById("edit-distance").value.trim();
  
  // Primary image
  const image = currentUploadedCover || (document.getElementById("edit-image-url")?.value || "").trim() || (hostel ? hostel.image : "");
  
  const basePriceInput = parseInt(document.getElementById("edit-price").value, 10) || 5000;
  const availableRooms = parseInt(document.getElementById("edit-available-rooms").value, 10);
  const totalRooms = parseInt(document.getElementById("edit-total-rooms").value, 10) || 50;
  const featured = document.getElementById("edit-featured").checked;
  const ownerName = document.getElementById("edit-owner-name").value.trim();
  const ownerWhatsapp = document.getElementById("edit-owner-whatsapp").value.trim();
  const ownerPhone = document.getElementById("edit-owner-phone").value.trim();
  const description = document.getElementById("edit-description").value.trim();

  // Selected Room Types & Stated Price & Availability for each (1 in a room, 2 in a room, 3 in a room, 4 in a room)
  const roomTypes = [];
  const roomPricing = {};
  const roomAvailability = {};
  const roomCounts = {};

  ROOM_TYPE_CONFIGS.forEach(rc => {
    const cb = document.getElementById(`edit-room-enable-${rc.key}`);
    const priceInput = document.getElementById(`edit-room-price-${rc.key}`);
    const btnYes = document.getElementById(`room-avail-btn-yes-${rc.key}`);
    const countInput = document.getElementById(`edit-room-count-${rc.key}`);

    if (cb && cb.checked) {
      roomTypes.push(rc.id);
      const parsedP = priceInput ? parseInt(priceInput.value, 10) : 0;
      roomPricing[rc.id] = (!isNaN(parsedP) && parsedP > 0) ? parsedP : rc.defaultPrice;

      // Check if button is marked Available vs Not Available
      const isAvailable = btnYes ? btnYes.classList.contains("active-available") : true;
      roomAvailability[rc.id] = isAvailable;

      const countVal = countInput ? parseInt(countInput.value, 10) : 0;
      roomCounts[rc.id] = (!isNaN(countVal) && countVal >= 0) ? (isAvailable ? countVal : 0) : 0;
    }
  });

  if (roomTypes.length === 0) {
    roomTypes.push("2 in a room");
    roomPricing["2 in a room"] = basePriceInput;
    roomAvailability["2 in a room"] = true;
    roomCounts["2 in a room"] = 4;
  }

  // Calculate total available rooms dynamically from roomCounts if available
  const sumRoomCounts = Object.values(roomCounts).reduce((acc, c) => acc + (c || 0), 0);
  const calculatedAvailableRooms = (!isNaN(availableRooms) && availableRooms > 0) 
    ? (sumRoomCounts > 0 ? sumRoomCounts : availableRooms)
    : sumRoomCounts;

  // Calculate lowest room rate to keep card preview in sync
  const activePrices = Object.values(roomPricing);
  const minRoomPrice = activePrices.length > 0 ? Math.min(...activePrices) : basePriceInput;
  const price = minRoomPrice > 0 ? minRoomPrice : basePriceInput;

  // Locations management (2 or more locations vs None)
  let hasMultipleLocations = false;
  let locations = [];

  if (currentHasMultipleLocations) {
    // Read current values directly from DOM branch cards to ensure latest typed input
    const branchCards = document.querySelectorAll(".location-branch-card");
    const collectedBranches = [];
    branchCards.forEach((card, idx) => {
      const bName = card.querySelector(".branch-field-name")?.value.trim() || `Branch ${idx + 1}`;
      const bZone = card.querySelector(".branch-field-zone")?.value.trim() || zone;
      const bAddress = card.querySelector(".branch-field-address")?.value.trim() || location;
      const bPhone = card.querySelector(".branch-field-phone")?.value.trim() || ownerPhone;
      if (bName) {
        collectedBranches.push({
          name: bName,
          zone: bZone,
          address: bAddress,
          phone: bPhone
        });
      }
    });

    if (collectedBranches.length >= 2) {
      hasMultipleLocations = true;
      locations = collectedBranches;
    } else {
      hasMultipleLocations = false;
      locations = [];
    }
  }

  // Selected Amenities
  const amenities = [];
  document.querySelectorAll("input[name='edit-amenity']:checked").forEach(cb => {
    amenities.push(cb.value);
  });

  // Gallery
  const gallery = currentGalleryList.length > 0 ? [...currentGalleryList] : [image];
  if (image && !gallery.includes(image)) {
    gallery.unshift(image);
  }

  const updatedFields = {
    name,
    zone,
    location,
    city: "Kumasi",
    distance,
    image,
    gallery,
    price,
    availableRooms: calculatedAvailableRooms,
    totalRooms,
    featured,
    roomTypes,
    roomPricing,
    roomAvailability,
    roomCounts,
    hasMultipleLocations,
    locations,
    amenities,
    ownerName,
    ownerWhatsapp,
    ownerPhone,
    description
  };

  const updatedHostel = updateHostel(currentHostelId, updatedFields);

  if (updatedHostel) {
    showToast(`✓ Changes saved! ${updatedHostel.name} has been updated.`, "success");
    closeHostelEditor();

    if (typeof onSaveCallbackRef === "function") {
      onSaveCallbackRef(updatedHostel);
    }

    updateDOMAfterSave(updatedHostel);
  } else {
    showToast("Error updating hostel. Please try again.", "error");
  }
}


/**
 * Updates DOM cards or details page when a hostel is edited
 */
function updateDOMAfterSave(hostel) {
  // If we are on hostel-details.html and this is the active hostel, update page elements directly
  const urlParams = new URLSearchParams(window.location.search);
  const activeId = urlParams.get("id") || "knust-01";
  if (activeId === hostel.id) {
    const titleEl = document.getElementById("detail-hostel-title") || document.getElementById("detail-hostel-name");
    if (titleEl) titleEl.textContent = hostel.name;

    const breadcrumbName = document.getElementById("detail-breadcrumb-name");
    if (breadcrumbName) breadcrumbName.textContent = hostel.name;

    const priceEl = document.getElementById("side-booking-price") || document.getElementById("detail-price");
    if (priceEl) priceEl.textContent = formatGHS(hostel.price);

    const mainImgEl = document.getElementById("detail-main-image") || document.getElementById("detail-main-img");
    if (mainImgEl) {
      mainImgEl.src = hostel.image;
      mainImgEl.alt = hostel.name;
    }

    const thumbsContainer = document.getElementById("detail-thumbs-container");
    if (thumbsContainer && hostel.gallery && hostel.gallery.length > 0) {
      thumbsContainer.innerHTML = hostel.gallery.map((imgSrc, idx) => `
        <img 
          src="${imgSrc}" 
          alt="${hostel.name} view ${idx + 1}" 
          class="gallery-thumb-img" 
          onclick="const m = document.getElementById('detail-main-image'); if(m) m.src = '${imgSrc}'"
        />
      `).join("");
    }

    const locEl = document.getElementById("detail-hostel-location") || document.getElementById("detail-location");
    if (locEl) locEl.textContent = `📍 ${hostel.location}`;

    const distEl = document.getElementById("detail-hostel-distance") || document.getElementById("detail-distance");
    if (distEl) distEl.textContent = hostel.distance;

    const descEl = document.getElementById("detail-description");
    if (descEl) descEl.textContent = hostel.description;

    const ownerNameEl = document.getElementById("side-owner-name") || document.getElementById("detail-owner-name");
    if (ownerNameEl) ownerNameEl.textContent = hostel.ownerName || "Hostel Manager";

    const ownerPhoneEl = document.getElementById("side-owner-phone") || document.getElementById("detail-owner-phone");
    if (ownerPhoneEl) {
      ownerPhoneEl.textContent = hostel.ownerPhone || "";
      ownerPhoneEl.href = `tel:${(hostel.ownerPhone || "").replace(/\s+/g, '')}`;
    }

    const callBtn = document.getElementById("detail-call-btn");
    if (callBtn) {
      callBtn.href = `tel:${(hostel.ownerPhone || "").replace(/\s+/g, '')}`;
    }

    const zoneBadgeEl = document.getElementById("detail-zone-badge");
    if (zoneBadgeEl) zoneBadgeEl.textContent = `📍 ${hostel.zone}`;

    const waBtn = document.getElementById("detail-whatsapp-btn");
    if (waBtn) {
      waBtn.href = `https://wa.me/${hostel.ownerWhatsapp}?text=Hello%20${encodeURIComponent(hostel.ownerName)},%20I%20am%20inquiring%20about%20${encodeURIComponent(hostel.name)}.`;
    }

    // Refresh Room Types & Stated Pricing on details page
    const roomTypesList = document.getElementById("detail-room-types-list");
    if (roomTypesList && hostel.roomPricing) {
      const standardOrder = ["1 in a room", "2 in a room", "3 in a room", "4 in a room"];
      const entries = Object.entries(hostel.roomPricing).sort((a, b) => {
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

    // Refresh Multiple Locations / Branches on details page
    const locationsContainer = document.getElementById("detail-locations-content");
    const locationsBadge = document.getElementById("detail-locations-badge");
    if (locationsContainer) {
      const hasMulti = !!(hostel.hasMultipleLocations && Array.isArray(hostel.locations) && hostel.locations.length > 0);
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
  }

  // If on hostels.html or index.html, update card in place
  const card = document.getElementById(`card-${hostel.id}`);
  if (card) {
    const titleLink = card.querySelector(".hostel-card-title a");
    if (titleLink) titleLink.textContent = hostel.name;

    const img = card.querySelector(".hostel-card-img");
    if (img) {
      img.src = hostel.image;
      img.alt = hostel.name;
    }

    const priceTag = card.querySelector(".hostel-card-price-tag span");
    if (priceTag) priceTag.textContent = formatGHS(hostel.price);

    const loc = card.querySelector(".hostel-card-location");
    if (loc) loc.textContent = `📍 ${hostel.location}`;

    const zoneBadge = card.querySelector(".hostel-zone-badge");
    if (zoneBadge && hostel.zone) {
      zoneBadge.textContent = `📍 ${hostel.zone}`;
    }

    const dist = card.querySelector(".hostel-meta-row span:first-child");
    if (dist) dist.textContent = hostel.distance;
  }

  // If a re-render function is registered on window
  if (typeof window.refreshHostelListingsings === "function") {
    window.refreshHostelListingsings();
  }
}

/**
 * Attaches click event delegation for any edit button on the page
 */
export function initHostelEditorListeners() {
  ensureEditorModal();

  document.addEventListener("click", (e) => {
    // Check if clicked element is or is inside an edit trigger
    const editBtn = e.target.closest(".btn-edit-symbol, .btn-edit-hostel-footer, .btn-edit-hostel-details, .btn-open-edit-modal");
    if (editBtn) {
      e.preventDefault();
      e.stopPropagation();
      const hostelId = editBtn.getAttribute("data-hostel-id") || new URLSearchParams(window.location.search).get("id");
      if (hostelId) {
        openHostelEditor(hostelId);
      }
    }
  });
}

// Attach to window so any script or HTML inline handler can access
if (typeof window !== "undefined") {
  window.openHostelEditor = openHostelEditor;
  window.closeHostelEditor = closeHostelEditor;
}
