-- HostelHub Ghana Database Schema
-- Database: hostelhub

CREATE DATABASE IF NOT EXISTS hostelhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hostelhub;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  role ENUM('student', 'owner', 'admin') NOT NULL DEFAULT 'student',
  university VARCHAR(150) DEFAULT 'KNUST',
  student_id VARCHAR(50) DEFAULT NULL,
  level VARCHAR(50) DEFAULT 'Level 100',
  business_name VARCHAR(150) DEFAULT NULL,
  status ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Hostels Table
CREATE TABLE IF NOT EXISTS hostels (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NULL,
  name VARCHAR(191) NOT NULL,
  university VARCHAR(150) NOT NULL,
  uni_code VARCHAR(50) DEFAULT 'KNUST',
  location VARCHAR(191) NOT NULL,
  zone VARCHAR(100) DEFAULT 'Ayeduase',
  city VARCHAR(100) DEFAULT 'Kumasi',
  address TEXT DEFAULT NULL,
  price INT NOT NULL DEFAULT 5000,
  period VARCHAR(50) DEFAULT 'per academic year',
  rating DECIMAL(3, 2) DEFAULT 4.5,
  reviews_count INT DEFAULT 0,
  available_rooms INT DEFAULT 5,
  total_rooms INT DEFAULT 50,
  verified BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  distance VARCHAR(100) DEFAULT '5 mins walk to campus',
  image TEXT NOT NULL,
  images_json JSON NULL,
  amenities_json JSON NULL,
  room_types_json JSON NULL,
  room_pricing_json JSON NULL,
  has_multiple_locations BOOLEAN DEFAULT FALSE,
  locations_json JSON NULL,
  rules_json JSON NULL,
  owner_name VARCHAR(150) NOT NULL,
  owner_phone VARCHAR(50) NOT NULL,
  owner_whatsapp VARCHAR(50) NOT NULL,
  description TEXT NULL,
  status ENUM('approved', 'pending', 'rejected') DEFAULT 'approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_university (university),
  INDEX idx_zone (zone),
  INDEX idx_price (price),
  INDEX idx_owner (owner_id)
) ENGINE=InnoDB;

-- 3. Rooms Table (Specific room allocations or inventory per hostel)
CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(64) PRIMARY KEY,
  hostel_id VARCHAR(64) NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  room_type VARCHAR(100) NOT NULL,
  floor VARCHAR(50) DEFAULT 'Ground Floor',
  price INT NOT NULL,
  capacity INT DEFAULT 2,
  occupied INT DEFAULT 0,
  status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NULL,
  hostel_id VARCHAR(64) NOT NULL,
  room_id VARCHAR(64) NULL,
  student_name VARCHAR(150) NOT NULL,
  student_email VARCHAR(191) NOT NULL,
  student_phone VARCHAR(50) NOT NULL,
  university VARCHAR(150) DEFAULT 'KNUST',
  room_type VARCHAR(100) NOT NULL,
  quoted_price INT NOT NULL,
  academic_year VARCHAR(50) DEFAULT '2026/2027',
  preferred_move_in_date VARCHAR(50) NULL,
  notes TEXT NULL,
  status ENUM('Pending Review', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Pending Review',
  payment_status VARCHAR(100) DEFAULT 'Awaiting Owner Approval',
  booking_date DATE DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_booking_student (student_id),
  INDEX idx_booking_hostel (hostel_id)
) ENGINE=InnoDB;

-- 5. Inquiries Table
CREATE TABLE IF NOT EXISTS inquiries (
  id VARCHAR(64) PRIMARY KEY,
  hostel_id VARCHAR(64) NOT NULL,
  hostel_name VARCHAR(191) NOT NULL,
  student_id VARCHAR(64) NULL,
  student_name VARCHAR(150) NOT NULL,
  student_email VARCHAR(191) NOT NULL,
  student_phone VARCHAR(50) NOT NULL,
  university VARCHAR(150) DEFAULT 'KNUST',
  room_type_needed VARCHAR(100) DEFAULT '2 in a room',
  message TEXT NOT NULL,
  status ENUM('Pending Response', 'Replied') DEFAULT 'Pending Response',
  reply TEXT NULL,
  date DATE DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_inq_hostel (hostel_id)
) ENGINE=InnoDB;

-- 6. Favourites Table
CREATE TABLE IF NOT EXISTS favourites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  hostel_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_fav (student_id, hostel_id),
  INDEX idx_fav_student (student_id)
) ENGINE=InnoDB;

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(64) PRIMARY KEY,
  hostel_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(64) NULL,
  student_name VARCHAR(150) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  date DATE DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_review_hostel (hostel_id)
) ENGINE=InnoDB;

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(191) NOT NULL,
  message TEXT NOT NULL,
  read_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id)
) ENGINE=InnoDB;
