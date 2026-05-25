// server.js - Database and server configuration
import { Database } from "jsr:@db/sqlite@0.11";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

// Load environment variables
const env = await load();

// Database connection
export const db = new Database(env.DB_PATH || "course_hub.db");

// Enable foreign keys
db.exec("PRAGMA foreign_keys = ON");

console.log("✅ Database connected");