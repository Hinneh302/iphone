/**
 * HostelHub Ghana - Authentication & User Management Script
 * Handles login, registration, role checks, and profile management
 */

import { getCurrentUser, setCurrentUser, showToast } from './app.js';
import { AuthApi, setAuthToken } from './api.js';

// Pre-seeded demo user database
const DEMO_USERS = [

  {
    id: "usr-student",
    name: "Kwame Boateng",
    email: "student@ug.edu.gh",
    password: "password123",
    phone: "+233 24 123 4567",
    role: "student",
    university: "University of Ghana",
    studentId: "10982344",
    level: "Level 300"
  },
  {
    id: "usr-owner",
    name: "Mr. Kofi Mensah",
    email: "owner@hostels.gh",
    password: "password123",
    phone: "+233 24 456 7890",
    role: "owner",
    university: "University of Ghana",
    businessName: "Mensah Hostels & Accommodations"
  },
  {
    id: "usr-admin",
    name: "Ama Serwaa",
    email: "admin@hostelhub.gh",
    password: "adminpassword",
    phone: "+233 24 999 8888",
    role: "admin",
    adminLevel: "Super Administrator"
  }
];

export function getUsers() {
  try {
    const data = localStorage.getItem("hostelhub_users_db");
    return data ? JSON.parse(data) : DEMO_USERS;
  } catch (e) {
    return DEMO_USERS;
  }
}

export function saveUsers(users) {
  localStorage.setItem("hostelhub_users_db", JSON.stringify(users));
}

// Initial storage check
if (!localStorage.getItem("hostelhub_users_db")) {
  saveUsers(DEMO_USERS);
}

/**
 * Handle Login Form Submission
 */
export async function handleLogin(email, password, expectedRole = null) {
  try {
    const res = await AuthApi.login(email, password);
    if (res.success && res.data) {
      setAuthToken(res.data.token);
      setCurrentUser(res.data.user);
      showToast(`Welcome back, ${res.data.user.name}!`, "success");

      // Redirect according to role
      setTimeout(() => {
        if (res.data.user.role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else if (res.data.user.role === "owner") {
          window.location.href = "owner-dashboard.html";
        } else {
          window.location.href = "student-dashboard.html";
        }
      }, 500);
      return true;
    }
  } catch (err) {
    // Fallback to local storage if offline
    const users = getUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!foundUser) {
      showToast(err.message || "Invalid credentials. Account not found.", "error");
      return false;
    }

    if (foundUser.password !== password) {
      showToast("Incorrect password. Please try again.", "error");
      return false;
    }

    setCurrentUser(foundUser);
    showToast(`Welcome back, ${foundUser.name}!`, "success");

    setTimeout(() => {
      if (foundUser.role === "admin") {
        window.location.href = "admin-dashboard.html";
      } else if (foundUser.role === "owner") {
        window.location.href = "owner-dashboard.html";
      } else {
        window.location.href = "student-dashboard.html";
      }
    }, 500);
    return true;
  }
}

/**
 * Handle Registration
 */
export async function handleRegister(userData) {
  try {
    const res = await AuthApi.register(userData);
    if (res.success && res.data) {
      setAuthToken(res.data.token);
      setCurrentUser(res.data.user);
      showToast("Account created successfully! Redirecting...", "success");

      setTimeout(() => {
        if (res.data.user.role === "owner") {
          window.location.href = "owner-dashboard.html";
        } else {
          window.location.href = "student-dashboard.html";
        }
      }, 600);
      return true;
    }
  } catch (err) {
    // Fallback if needed
    const users = getUsers();
    const existing = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase().trim());
    if (existing) {
      showToast("An account with this email address already exists.", "error");
      return false;
    }

    const newUser = {
      id: "usr-" + Date.now(),
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      phone: userData.phone.trim(),
      role: userData.role || "student",
      university: userData.university || "University of Ghana",
      createdAt: new Date().toISOString()
    };

    if (newUser.role === "student") {
      newUser.studentId = userData.studentId || "GH-" + Math.floor(100000 + Math.random() * 900000);
      newUser.level = userData.level || "Level 100";
    } else if (newUser.role === "owner") {
      newUser.businessName = userData.businessName || `${newUser.name} Properties`;
    }

    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);

    showToast("Account created successfully! Redirecting...", "success");
    setTimeout(() => {
      if (newUser.role === "owner") {
        window.location.href = "owner-dashboard.html";
      } else {
        window.location.href = "student-dashboard.html";
      }
    }, 600);
    return true;
  }
}

/**
 * Handle Logout
 */
export function handleLogout() {
  setAuthToken(null);
  localStorage.removeItem("hostelhub_user");
  showToast("You have been signed out.", "info");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 400);
}

/**
 * Protect dashboard pages based on authorized role
 */
export function requireRole(allowedRoles = []) {
  const user = getCurrentUser();
  if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
    showToast("Please log in with appropriate permissions.", "warning");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 400);
    return false;
  }
  return true;
}

// Attach to window for inline HTML onclick handlers
if (typeof window !== "undefined") {
  window.authService = {
    handleLogin,
    handleRegister,
    handleLogout,
    requireRole
  };
}
