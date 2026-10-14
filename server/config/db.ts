import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "hostelhub";
const DB_PORT = parseInt(process.env.DB_PORT || "3306", 10);

let pool = null;
let isMySqlConnected = false;

// Initialize MySQL pool if configured and reachable
export async function initDatabase() {
  try {
    const testPool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const conn = await testPool.getConnection();
    await conn.ping();
    conn.release();
    pool = testPool;
    isMySqlConnected = true;
    console.log(`[Database] MySQL successfully connected to ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
  } catch (err) {
    console.warn(`[Database] MySQL connection notice: ${err.message}. Using persistent JSON store with automatic schema replication.`);
    isMySqlConnected = false;
  }
}

export function getMySqlPool() {
  return pool;
}

export function isUsingMySql() {
  return isMySqlConnected && pool !== null;
}
