/**
 * HostelHub Ghana - Centralized Backend API Client
 * Connects frontend forms, cards, search, bookings, and auth to Express REST endpoints.
 */

const API_BASE_URL = "/api";

export function getAuthToken() {
  return localStorage.getItem("hostelhub_token") || null;
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("hostelhub_token", token);
  } else {
    localStorage.removeItem("hostelhub_token");
  }
}

export function authHeader() {
  const token = getAuthToken();
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

/**
 * Universal JSON fetch helper with standard response parsing
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...authHeader(),
    ...(options.headers || {})
  };

  // If body is FormData, do not set Content-Type header so browser sets multipart boundary
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const json = await res.json().catch(() => ({
      success: false,
      message: "Server response could not be parsed as JSON."
    }));

    if (!res.ok) {
      const err = new Error(json.message || `Request failed with status ${res.status}`);
      err.response = json;
      err.status = res.status;
      throw err;
    }

    return json;
  } catch (err) {
    console.warn(`[API] Error calling ${endpoint}:`, err);
    throw err;
  }
}

// ----------------- AUTH API -----------------
export const AuthApi = {
  login: (email, password) => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  register: (userData) => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData)
    });
  },

  getProfile: () => {
    return apiRequest("/auth/me");
  }
};

// ----------------- HOSTELS API -----------------
export const HostelApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(k => {
      if (filters[k] !== undefined && filters[k] !== null && filters[k] !== "" && filters[k] !== "all") {
        params.append(k, filters[k]);
      }
    });
    const query = params.toString();
    return apiRequest(`/hostels${query ? `?${query}` : ""}`);
  },

  getById: (id) => {
    return apiRequest(`/hostels/${id}`);
  },

  create: (hostelData) => {
    return apiRequest("/hostels", {
      method: "POST",
      body: JSON.stringify(hostelData)
    });
  },

  update: (id, updates) => {
    return apiRequest(`/hostels/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates)
    });
  },

  delete: (id) => {
    return apiRequest(`/hostels/${id}`, {
      method: "DELETE"
    });
  },

  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiRequest("/hostels/upload", {
      method: "POST",
      body: formData
    });
  },

  getReviews: (hostelId) => {
    return apiRequest(`/hostels/${hostelId}/reviews`);
  },

  addReview: (hostelId, reviewData) => {
    return apiRequest(`/hostels/${hostelId}/reviews`, {
      method: "POST",
      body: JSON.stringify(reviewData)
    });
  }
};

// ----------------- BOOKINGS API -----------------
export const BookingApi = {
  getAll: () => {
    return apiRequest("/bookings");
  },

  getById: (id) => {
    return apiRequest(`/bookings/${id}`);
  },

  create: (bookingData) => {
    return apiRequest("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData)
    });
  },

  updateStatus: (id, status, paymentStatus) => {
    return apiRequest(`/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status, paymentStatus })
    });
  },

  delete: (id) => {
    return apiRequest(`/bookings/${id}`, {
      method: "DELETE"
    });
  }
};

// ----------------- FAVOURITES API -----------------
export const FavouriteApi = {
  getAll: () => {
    return apiRequest("/favourites");
  },

  add: (hostelId) => {
    return apiRequest("/favourites", {
      method: "POST",
      body: JSON.stringify({ hostelId })
    });
  },

  remove: (hostelId) => {
    return apiRequest(`/favourites/${hostelId}`, {
      method: "DELETE"
    });
  }
};

// ----------------- INQUIRIES API -----------------
export const InquiryApi = {
  getAll: () => {
    return apiRequest("/inquiries");
  },

  create: (inquiryData) => {
    return apiRequest("/inquiries", {
      method: "POST",
      body: JSON.stringify(inquiryData)
    });
  },

  reply: (id, replyText) => {
    return apiRequest(`/inquiries/${id}/reply`, {
      method: "PUT",
      body: JSON.stringify({ reply: replyText })
    });
  }
};

// ----------------- ADMIN API -----------------
export const AdminApi = {
  getStats: () => {
    return apiRequest("/admin/stats");
  },

  getUsers: () => {
    return apiRequest("/admin/users");
  },

  updateUserStatus: (id, status) => {
    return apiRequest(`/admin/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
  },

  verifyHostel: (id, verified, status) => {
    return apiRequest(`/admin/hostels/${id}/verify`, {
      method: "PUT",
      body: JSON.stringify({ verified, status })
    });
  }
};
