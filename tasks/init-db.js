#!/usr/bin/env deno run --allow-all
// tasks/init-db.js - Run: deno run --allow-all tasks/init-db.js

import { Database } from "jsr:@db/sqlite@0.11";

const db = new Database("course_hub.db");

console.log("🔧 Initializing database...");

// Enable foreign keys
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");

// Drop tables in reverse order
console.log("Dropping existing tables...");
const tables = ["sessions", "staff_programmes", "student_interests", "programme_modules", "modules", "programmes", "users"];

for (const table of tables.reverse()) {
  try {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
    console.log(`  ✓ Dropped: ${table}`);
  } catch (e) {
    console.log(`  ✗ Error dropping ${table}:`, e.message);
  }
}

console.log("\nCreating tables...");

// Users table
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'student',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log("  ✓ users");

// Programmes table
db.exec(`
  CREATE TABLE programmes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    level TEXT NOT NULL,
    duration TEXT,
    credits INTEGER DEFAULT 120,
    image_url TEXT,
    published INTEGER DEFAULT 0,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
  )
`);
console.log("  ✓ programmes");

// Modules table
db.exec(`
  CREATE TABLE modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    year INTEGER,
    semester INTEGER,
    credits INTEGER DEFAULT 15,
    module_leader_id INTEGER,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(module_leader_id) REFERENCES users(id) ON DELETE SET NULL
  )
`);
console.log("  ✓ modules");

// Programme modules junction
db.exec(`
  CREATE TABLE programme_modules (
    programme_id INTEGER,
    module_id INTEGER,
    is_mandatory INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(programme_id, module_id),
    FOREIGN KEY(programme_id) REFERENCES programmes(id) ON DELETE CASCADE,
    FOREIGN KEY(module_id) REFERENCES modules(id) ON DELETE CASCADE
  )
`);
console.log("  ✓ programme_modules");

// Student interests
db.exec(`
  CREATE TABLE student_interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    programme_id INTEGER,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(programme_id) REFERENCES programmes(id) ON DELETE SET NULL
  )
`);
console.log("  ✓ student_interests");

// Staff programmes
db.exec(`
  CREATE TABLE staff_programmes (
    staff_id INTEGER,
    programme_id INTEGER,
    role TEXT DEFAULT 'lecturer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(staff_id, programme_id),
    FOREIGN KEY(staff_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(programme_id) REFERENCES programmes(id) ON DELETE CASCADE
  )
`);
console.log("  ✓ staff_programmes");

// Sessions
db.exec(`
  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log("  ✓ sessions");

console.log("\n✅ Tables created successfully");

// Insert sample data
console.log("\n📝 Inserting sample data...");

// Users
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, password, email, role)
  VALUES (?, ?, ?, ?)
`);

insertUser.run("admin", "admin123", "admin@university.com", "admin");
insertUser.run("sjohnson", "staff123", "sarah.johnson@university.com", "staff");
insertUser.run("mchen", "staff123", "michael.chen@university.com", "staff");
insertUser.run("ebrown", "staff123", "emily.brown@university.com", "staff");
insertUser.run("rjones", "staff123", "robert.jones@university.com", "staff");
insertUser.run("student1", "student123", "student@email.com", "student");

// Get user IDs
const admin = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
const johnson = db.prepare("SELECT id FROM users WHERE username = 'sjohnson'").get();
const chen = db.prepare("SELECT id FROM users WHERE username = 'mchen'").get();
const brown = db.prepare("SELECT id FROM users WHERE username = 'ebrown'").get();
const jones = db.prepare("SELECT id FROM users WHERE username = 'rjones'").get();

console.log(`  Users: admin(${admin.id}), sjohnson(${johnson.id}), mchen(${chen.id}), ebrown(${brown.id}), rjones(${jones.id})`);

// Programmes
const insertProgramme = db.prepare(`
  INSERT OR IGNORE INTO programmes (title, slug, description, level, duration, credits, image_url, published, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const programmes = [
  ["Computer Science BSc", "computer-science-bsc", "Study fundamental computing principles including programming, algorithms, data structures, AI, and software development. This comprehensive course prepares you for a career in software engineering, systems architecture, or further research.", "Undergraduate", "3 years full-time", 360, "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600", 1, admin.id],
  ["Cyber Security MSc", "cyber-security-msc", "Learn to protect organisations from cyber threats covering network security, cryptography, ethical hacking, digital forensics, and security management. This advanced course is designed for those seeking careers in information security.", "Postgraduate", "1 year full-time", 180, "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600", 1, admin.id],
  ["Data Science BSc", "data-science-bsc", "Extract insights from data using statistical methods and machine learning. This programme covers Python, R, SQL, data visualization, and predictive modeling, preparing you for roles in data analytics and AI.", "Undergraduate", "3 years full-time", 360, "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600", 1, admin.id],
  ["Business Analytics MSc", "business-analytics-msc", "Combine business strategy with data analytics to make data-driven decisions. Learn statistical analysis, business intelligence tools, and predictive modeling for strategic business advantage.", "Postgraduate", "1 year full-time", 180, "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600", 1, admin.id],
  ["Software Engineering BEng", "software-engineering-beng", "Master the art of building robust, scalable software systems. Learn software architecture, design patterns, testing methodologies, and DevOps practices for modern software development.", "Undergraduate", "3 years full-time", 360, "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600", 0, admin.id]
];

for (const p of programmes) {
  insertProgramme.run(...p);
  console.log(`  ✓ Programme: ${p[0]}`);
}

// Get programme IDs
const cs = db.prepare("SELECT id FROM programmes WHERE slug = 'computer-science-bsc'").get();
const cyber = db.prepare("SELECT id FROM programmes WHERE slug = 'cyber-security-msc'").get();
const ds = db.prepare("SELECT id FROM programmes WHERE slug = 'data-science-bsc'").get();
const ba = db.prepare("SELECT id FROM programmes WHERE slug = 'business-analytics-msc'").get();
const se = db.prepare("SELECT id FROM programmes WHERE slug = 'software-engineering-beng'").get();

// Modules
const insertModule = db.prepare(`
  INSERT OR IGNORE INTO modules (code, title, description, year, semester, credits, module_leader_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const modules = [
  ["CS101", "Programming Fundamentals", "Introduction to programming using Python. Learn variables, loops, functions, and basic data structures.", 1, 1, 15, johnson.id],
  ["CS102", "Web Development", "HTML, CSS, JavaScript, and modern frameworks. Build responsive websites and web applications.", 1, 2, 15, johnson.id],
  ["CS201", "Data Structures & Algorithms", "Advanced programming concepts including trees, graphs, sorting algorithms, and complexity analysis.", 2, 1, 15, chen.id],
  ["CS202", "Database Systems", "SQL, database design, normalization, transactions, and optimization techniques.", 2, 2, 15, chen.id],
  ["CS301", "Artificial Intelligence", "AI algorithms, machine learning, neural networks, and intelligent systems design.", 3, 1, 15, brown.id],
  ["CS302", "Software Engineering", "Software development lifecycle, agile methodologies, testing, and project management.", 3, 2, 15, brown.id],
  ["CYB501", "Network Security", "Network protocols, firewalls, intrusion detection, and security best practices.", 1, 1, 15, johnson.id],
  ["CYB502", "Cryptography", "Encryption algorithms, digital signatures, hash functions, and cryptographic protocols.", 1, 2, 15, johnson.id],
  ["DS401", "Machine Learning", "Supervised and unsupervised learning, regression, classification, and clustering algorithms.", 1, 1, 15, chen.id],
  ["DS402", "Data Visualization", "Visualizing complex data using charts, graphs, and interactive dashboards.", 1, 2, 15, brown.id],
  ["SE401", "Software Architecture", "Design patterns, architectural styles, and system design principles.", 3, 1, 15, chen.id],
  ["SE402", "DevOps Practices", "CI/CD, containerization, and cloud deployment strategies.", 3, 2, 15, jones.id]
];

for (const m of modules) {
  insertModule.run(...m);
  console.log(`  ✓ Module: ${m[0]} - ${m[1]}`);
}

// Get module IDs for linking
const getModuleId = (code) => db.prepare("SELECT id FROM modules WHERE code = ?").get(code)?.id;

// Link modules to programmes
const linkModule = db.prepare(`
  INSERT OR IGNORE INTO programme_modules (programme_id, module_id, is_mandatory)
  VALUES (?, ?, 1)
`);

// Computer Science modules
if (cs) {
  const csModules = ["CS101", "CS102", "CS201", "CS202", "CS301", "CS302"];
  for (const code of csModules) {
    const mid = getModuleId(code);
    if (mid) linkModule.run(cs.id, mid);
  }
  console.log("  ✓ Linked modules to Computer Science");
}

// Cyber Security modules
if (cyber) {
  const cyberModules = ["CYB501", "CYB502"];
  for (const code of cyberModules) {
    const mid = getModuleId(code);
    if (mid) linkModule.run(cyber.id, mid);
  }
  console.log("  ✓ Linked modules to Cyber Security");
}

// Data Science modules
if (ds) {
  const dsModules = ["CS101", "CS202", "DS401", "DS402"];
  for (const code of dsModules) {
    const mid = getModuleId(code);
    if (mid) linkModule.run(ds.id, mid);
  }
  console.log("  ✓ Linked modules to Data Science");
}

// Business Analytics modules
if (ba) {
  const baModules = ["CS202", "DS401", "DS402"];
  for (const code of baModules) {
    const mid = getModuleId(code);
    if (mid) linkModule.run(ba.id, mid);
  }
  console.log("  ✓ Linked modules to Business Analytics");
}

// Software Engineering modules
if (se) {
  const seModules = ["CS101", "CS201", "CS302", "SE401", "SE402"];
  for (const code of seModules) {
    const mid = getModuleId(code);
    if (mid) linkModule.run(se.id, mid);
  }
  console.log("  ✓ Linked modules to Software Engineering");
}

// Staff programme assignments
const assignStaff = db.prepare(`
  INSERT OR IGNORE INTO staff_programmes (staff_id, programme_id, role)
  VALUES (?, ?, ?)
`);

if (cs && johnson) assignStaff.run(johnson.id, cs.id, "programme_lead");
if (ds && chen) assignStaff.run(chen.id, ds.id, "programme_lead");
if (cyber && brown) assignStaff.run(brown.id, cyber.id, "programme_lead");
if (cs && chen) assignStaff.run(chen.id, cs.id, "lecturer");
if (cs && jones) assignStaff.run(jones.id, cs.id, "lecturer");

console.log("  ✓ Staff assigned to programmes");

// Sample student interests
const insertInterest = db.prepare(`
  INSERT OR IGNORE INTO student_interests (name, email, phone, programme_id, message, status)
  VALUES (?, ?, ?, ?, ?, ?)
`);

if (cs) {
  insertInterest.run("John Smith", "john.smith@email.com", "07700123456", cs.id, "Very interested in the AI modules", "pending");
  insertInterest.run("Emma Jones", "emma.j@email.com", null, cs.id, "When does the course start?", "contacted");
  insertInterest.run("David Brown", "david.brown@email.com", "07800987654", cyber?.id, "Do you offer scholarships?", "pending");
  insertInterest.run("Sarah Wilson", "sarah.w@email.com", null, ds?.id, "What programming languages are used?", "pending");
  insertInterest.run("Michael Lee", "michael.lee@email.com", "07700987654", ba?.id, "Is this course available online?", "pending");
  insertInterest.run("Lisa Taylor", "lisa.t@email.com", null, cs.id, "Can I visit the campus?", "pending");
  console.log("  ✓ Sample interests added");
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("DATABASE INITIALIZATION COMPLETE!");
console.log("=".repeat(60));

// Get final counts
const counts = {
  users: db.prepare("SELECT COUNT(*) as c FROM users").get().c,
  programmes: db.prepare("SELECT COUNT(*) as c FROM programmes").get().c,
  modules: db.prepare("SELECT COUNT(*) as c FROM modules").get().c,
  interests: db.prepare("SELECT COUNT(*) as c FROM student_interests").get().c,
  staffAssignments: db.prepare("SELECT COUNT(*) as c FROM staff_programmes").get().c
};

console.log("\nSummary:");
console.log(`  Users: ${counts.users}`);
console.log(`  Programmes: ${counts.programmes}`);
console.log(`  Modules: ${counts.modules}`);
console.log(`  Programme-Module Links: ${counts.staffAssignments}`);
console.log(`  Student Interests: ${counts.interests}`);

console.log("\n📋 Demo Accounts:");
console.log("  ┌────────────┬────────────┬─────────────────────┐");
console.log("  │ Username   │ Password   │ Role                │");
console.log("  ├────────────┼────────────┼─────────────────────┤");
console.log("  │ admin      │ admin123   │ Administrator       │");
console.log("  │ sjohnson   │ staff123   │ Staff (Programme Lead) │");
console.log("  │ mchen      │ staff123   │ Staff (Lecturer)    │");
console.log("  │ ebrown     │ staff123   │ Staff (Lecturer)    │");
console.log("  │ rjones     │ staff123   │ Staff (Lecturer)    │");
console.log("  │ student1   │ student123 │ Student             │");
console.log("  └────────────┴────────────┴─────────────────────┘");

console.log("\n📚 Programmes Available:");
const allProgrammes = db.prepare("SELECT title, level, published FROM programmes").all();
for (const p of allProgrammes) {
  const status = p.published ? "Published" : "Draft";
  console.log(`    ${p.title} (${p.level}) - ${status}`);
}

console.log("\n📖 Modules Sample:");
const sampleModules = db.prepare(`
  SELECT m.code, m.title, u.username as leader 
  FROM modules m 
  LEFT JOIN users u ON m.module_leader_id = u.id 
  LIMIT 5
`).all();
for (const m of sampleModules) {
  console.log(`    ${m.code}: ${m.title} → ${m.leader || 'No leader'}`);
}

console.log("\n🚀 Next Steps:");
console.log("  1. Start the server: deno run --allow-net --allow-read --allow-write --allow-env main.js");
console.log("  2. Visit: http://localhost:8000");
console.log("  3. Login with admin/admin123 to access admin panel");
console.log("\n" + "=".repeat(60));

db.close();
console.log("\n✅ Database initialization complete!");