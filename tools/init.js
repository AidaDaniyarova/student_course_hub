// Database initialization script 
import { Database } from "jsr:@db/sqlite@0.11";

const db = new Database("course_hub.db");

console.log("🔧 Initializing database...");

// Enable foreign keys
db.exec("PRAGMA foreign_keys = ON;");

// Drop all tables (in reverse order to avoid foreign key constraints)
console.log("Dropping existing tables...");
const tables = ["sessions", "staff_programmes", "student_interests", "programme_modules", "modules", "programmes", "users"];
for (const table of tables.reverse()) {
  try {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
  } catch (e) {
    console.log(`${table} error:`, e.message);
  }
}

console.log("Creating tables...");

// Create users table
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'student',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create programmes table
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

// Create modules table with foreign key to users (module leader)
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

// Create programme_modules junction table
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

// Create student_interests table
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

// Create staff_programmes table
db.exec(`
  CREATE TABLE staff_programmes (
    staff_id INTEGER,
    programme_id INTEGER,
    role TEXT DEFAULT 'lecturer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(staff_id, programme_id),
    FOREIGN KEY(staff_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(programme_id) REFERENCES programmes(id) ON DELETE CASCADE
  )
`);

// Create sessions table
db.exec(`
  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    data TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

console.log("✅ Tables created successfully");

// Insert users
console.log("\nInserting users...");

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, password, email, role)
  VALUES (?, ?, ?, ?)
`);

// Insert users and capture IDs
insertUser.run("admin", "admin123", "admin@university.com", "admin");
insertUser.run("sjohnson", "staff123", "sarah.johnson@university.com", "staff");
insertUser.run("mchen", "staff123", "michael.chen@university.com", "staff");
insertUser.run("ebrown", "staff123", "emily.brown@university.com", "staff");
insertUser.run("rjones", "staff123", "robert.jones@university.com", "staff"); // Additional lecturer
insertUser.run("student1", "student123", "student@email.com", "student");

// Get user IDs
const admin = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
const sjohnson = db.prepare("SELECT id FROM users WHERE username = 'sjohnson'").get();
const mchen = db.prepare("SELECT id FROM users WHERE username = 'mchen'").get();
const ebrown = db.prepare("SELECT id FROM users WHERE username = 'ebrown'").get();
const rjones = db.prepare("SELECT id FROM users WHERE username = 'rjones'").get();

const adminId = admin?.id || 1;
const johnsonId = sjohnson?.id || 2;
const chenId = mchen?.id || 3;
const brownId = ebrown?.id || 4;
const jonesId = rjones?.id || 5;

console.log(`   Admin ID: ${adminId}`);
console.log(`   Staff IDs: ${johnsonId} (Sarah Johnson), ${chenId} (Michael Chen), ${brownId} (Emily Brown), ${jonesId} (Robert Jones)`);

// Insert programmes
console.log("\nInserting programmes...");

const insertProgramme = db.prepare(`
  INSERT OR IGNORE INTO programmes (title, slug, description, level, duration, credits, image_url, published, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const programmes = [
  [
    "Computer Science BSc",
    "computer-science-bsc",
    "Study the fundamental principles of computing, programming, and software development. This comprehensive course covers algorithms, data structures, artificial intelligence, and modern programming paradigms.",
    "Undergraduate",
    "3 years full-time",
    360,
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600",
    1,
    adminId
  ],
  [
    "Cyber Security MSc",
    "cyber-security-msc",
    "Learn to protect organisations from cyber threats. This advanced course covers network security, cryptography, ethical hacking, digital forensics, and security management.",
    "Postgraduate",
    "1 year full-time",
    180,
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600",
    1,
    adminId
  ],
  [
    "Data Science BSc",
    "data-science-bsc",
    "Learn to extract insights from data using statistical methods and machine learning. This programme covers Python, R, SQL, data visualization, and predictive modeling.",
    "Undergraduate",
    "3 years full-time",
    360,
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600",
    1,
    adminId
  ],
  [
    "Business Analytics MSc",
    "business-analytics-msc",
    "Combine business strategy with data analytics. Learn to make data-driven decisions using statistical analysis and business intelligence tools.",
    "Postgraduate",
    "1 year full-time",
    180,
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600",
    1,
    adminId
  ],
  [
    "Software Engineering BEng",
    "software-engineering-beng",
    "Master the art of building robust, scalable software systems. Learn software architecture, design patterns, and testing methodologies.",
    "Undergraduate",
    "3 years full-time",
    360,
    "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600",
    0,
    adminId
  ]
];

for (const p of programmes) {
  try {
    insertProgramme.run(...p);
    console.log(`Created: ${p[0]}`);
  } catch (e) {
    console.log(`${p[0]} already exists or error:`, e.message);
  }
}

// Get programme IDs
const programmeList = db.prepare("SELECT id, title FROM programmes ORDER BY id").all();
const programmeIds = programmeList.map(p => p.id);
console.log(`\n   Programme IDs: ${programmeIds.join(", ")}`);

// Insert modules with proper module_leader_id foreign keys
console.log("\nInserting modules...");

const insertModule = db.prepare(`
  INSERT OR IGNORE INTO modules (code, title, description, year, semester, credits, module_leader_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const modules = [
  ["CS101", "Programming Fundamentals", "Introduction to programming using Python. Learn variables, loops, functions, and basic data structures.", 1, 1, 15, johnsonId],
  ["CS102", "Web Development", "HTML, CSS, JavaScript, and modern frameworks. Build responsive websites and web applications.", 1, 2, 15, johnsonId],
  ["CS201", "Data Structures & Algorithms", "Advanced programming concepts including trees, graphs, sorting algorithms, and complexity analysis.", 2, 1, 15, chenId],
  ["CS202", "Database Systems", "SQL, database design, normalization, transactions, and optimization techniques.", 2, 2, 15, chenId],
  ["CS301", "Artificial Intelligence", "AI algorithms, machine learning, neural networks, and intelligent systems design.", 3, 1, 15, brownId],
  ["CS302", "Software Engineering", "Software development lifecycle, agile methodologies, testing, and project management.", 3, 2, 15, brownId],
  ["CYB501", "Network Security", "Network protocols, firewalls, intrusion detection, and security best practices.", 1, 1, 15, johnsonId],
  ["CYB502", "Cryptography", "Encryption algorithms, digital signatures, hash functions, and cryptographic protocols.", 1, 2, 15, johnsonId],
  ["DS401", "Machine Learning", "Supervised and unsupervised learning, regression, classification, and clustering algorithms.", 1, 1, 15, chenId],
  ["DS402", "Data Visualization", "Visualizing complex data using charts, graphs, and interactive dashboards.", 1, 2, 15, brownId],
  ["SE401", "Software Architecture", "Design patterns, architectural styles, and system design principles.", 3, 1, 15, chenId],
  ["SE402", "DevOps Practices", "CI/CD, containerization, and cloud deployment strategies.", 3, 2, 15, jonesId]
];

for (const m of modules) {
  try {
    insertModule.run(...m);
    console.log(`Created: ${m[0]} - ${m[1]} (Leader ID: ${m[6]})`);
  } catch (e) {
    console.log(`${m[0]} already exists or error:`, e.message);
  }
}

// Get module IDs
const moduleList = db.prepare("SELECT id, code, module_leader_id FROM modules ORDER BY id").all();
const moduleIds = moduleList.map(m => m.id);
console.log(`\n   Module IDs: ${moduleIds.slice(0, 5).join(", ")}... (${moduleIds.length} total)`);

// Create module code to ID mapping
const moduleMap = {};
for (const m of moduleList) {
  moduleMap[m.code] = m.id;
}

// Link modules to programmes
console.log("\nLinking modules to programmes...");

const linkModule = db.prepare(`
  INSERT OR IGNORE INTO programme_modules (programme_id, module_id, is_mandatory)
  VALUES (?, ?, 1)
`);

// Get specific programme IDs by title
const getProgrammeId = (title) => {
  const result = db.prepare("SELECT id FROM programmes WHERE title = ?").get(title);
  return result?.id;
};

const csId = getProgrammeId("Computer Science BSc");
const cyberId = getProgrammeId("Cyber Security MSc");
const dsId = getProgrammeId("Data Science BSc");
const baId = getProgrammeId("Business Analytics MSc");
const seId = getProgrammeId("Software Engineering BEng");

// Link Computer Science modules (CS101, CS102, CS201, CS202, CS301, CS302)
if (csId) {
  const csModules = ["CS101", "CS102", "CS201", "CS202", "CS301", "CS302"];
  for (const code of csModules) {
    if (moduleMap[code]) {
      linkModule.run(csId, moduleMap[code]);
      console.log(`${code} → Computer Science`);
    }
  }
}

// Link Cyber Security modules
if (cyberId) {
  const cyberModules = ["CYB501", "CYB502"];
  for (const code of cyberModules) {
    if (moduleMap[code]) {
      linkModule.run(cyberId, moduleMap[code]);
      console.log(`${code} → Cyber Security`);
    }
  }
}

// Link Data Science modules
if (dsId) {
  const dsModules = ["CS101", "CS202", "DS401", "DS402"];
  for (const code of dsModules) {
    if (moduleMap[code]) {
      linkModule.run(dsId, moduleMap[code]);
      console.log(`${code} → Data Science`);
    }
  }
}

// Link Business Analytics modules
if (baId) {
  const baModules = ["CS202", "DS401", "DS402"];
  for (const code of baModules) {
    if (moduleMap[code]) {
      linkModule.run(baId, moduleMap[code]);
      console.log(`${code} → Business Analytics`);
    }
  }
}

// Link Software Engineering modules
if (seId) {
  const seModules = ["CS101", "CS201", "CS302", "SE401", "SE402"];
  for (const code of seModules) {
    if (moduleMap[code]) {
      linkModule.run(seId, moduleMap[code]);
      console.log(`${code} → Software Engineering`);
    }
  }
}

// Insert staff programme assignments
console.log("\nAssigning staff to programmes...");

const assignStaff = db.prepare(`
  INSERT OR IGNORE INTO staff_programmes (staff_id, programme_id, role)
  VALUES (?, ?, ?)
`);

// Assign Sarah Johnson as programme lead for Computer Science
if (csId && johnsonId) {
  assignStaff.run(johnsonId, csId, "programme_lead");
  console.log(`Sarah Johnson assigned as Programme Lead for Computer Science`);
}

// Assign Michael Chen as programme lead for Data Science
if (dsId && chenId) {
  assignStaff.run(chenId, dsId, "programme_lead");
  console.log(`Michael Chen assigned as Programme Lead for Data Science`);
}

// Assign Emily Brown as programme lead for Cyber Security
if (cyberId && brownId) {
  assignStaff.run(brownId, cyberId, "programme_lead");
  console.log(`Emily Brown assigned as Programme Lead for Cyber Security`);
}

// Add additional staff assignments
if (csId && chenId) {
  assignStaff.run(chenId, csId, "lecturer");
  console.log(`Michael Chen assigned as Lecturer for Computer Science`);
}

if (csId && jonesId) {
  assignStaff.run(jonesId, csId, "lecturer");
  console.log(`Robert Jones assigned as Lecturer for Computer Science`);
}

// Insert sample student interests
console.log("\nAdding sample student interests...");

const insertInterest = db.prepare(`
  INSERT OR IGNORE INTO student_interests (name, email, phone, programme_id, message, status)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const interests = [
  ["John Smith", "john.smith@email.com", "07700123456", csId, "Very interested in the AI modules", "pending"],
  ["Emma Jones", "emma.j@email.com", null, csId, "When does the course start?", "contacted"],
  ["David Brown", "david.brown@email.com", "07800987654", cyberId, "Do you offer scholarships?", "pending"],
  ["Sarah Wilson", "sarah.w@email.com", null, dsId, "What programming languages are used?", "pending"],
  ["Michael Lee", "michael.lee@email.com", "07700987654", baId, "Is this course available online?", "pending"],
  ["Lisa Taylor", "lisa.t@email.com", null, csId, "Can I visit the campus?", "pending"]
];

for (const interest of interests) {
  if (interest[3]) { // Only insert if programme_id exists
    try {
      insertInterest.run(...interest);
      console.log(`${interest[0]} → ${interest[3] === csId ? "Computer Science" : "Other"}`);
    } catch (e) {
      console.log(`Could not add interest:`, e.message);
    }
  }
}

// Display final summary
console.log("\n" + "=".repeat(60));
console.log("DATABASE INITIALIZATION COMPLETE!");
console.log("=".repeat(60));

// Get final counts
const finalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get();
const finalProgrammes = db.prepare("SELECT COUNT(*) as count FROM programmes").get();
const finalModules = db.prepare("SELECT COUNT(*) as count FROM modules").get();
const finalLinks = db.prepare("SELECT COUNT(*) as count FROM programme_modules").get();
const finalInterests = db.prepare("SELECT COUNT(*) as count FROM student_interests").get();
const finalStaffProgs = db.prepare("SELECT COUNT(*) as count FROM staff_programmes").get();

console.log("\nSummary:");
console.log(`Users: ${finalUsers.count}`);
console.log(`Programmes: ${finalProgrammes.count}`);
console.log(`Modules: ${finalModules.count}`);
console.log(`Programme-Module Links: ${finalLinks.count}`);
console.log(`Staff-Programme Assignments: ${finalStaffProgs.count}`);
console.log(`Student Interests: ${finalInterests.count}`);

console.log("\nDEMO ACCOUNTS:");
console.log("   ┌─────────────────────────────────────────────────┐");
console.log("   │  Username  │  Password  │  Role                 │");
console.log("   ├────────────┼────────────┼───────────────────────┤");
console.log("   │  admin     │  admin123  │  Administrator        │");
console.log("   │  sjohnson  │  staff123  │  Staff (Programme Lead)│");
console.log("   │  mchen     │  staff123  │  Staff (Senior Lecturer)│");
console.log("   │  ebrown    │  staff123  │  Staff (Lecturer)      │");
console.log("   │  rjones    │  staff123  │  Staff (Lecturer)      │");
console.log("   │  student1  │  student123│  Student               │");
console.log("   └────────────┴────────────┴───────────────────────┘");

console.log("\nPROGRAMMES AVAILABLE:");
const allProgrammes = db.prepare("SELECT id, title, level, published FROM programmes").all();
for (const p of allProgrammes) {
  const status = p.published ? "Published" : "Draft";
  console.log(`   ${p.id}. ${p.title} (${p.level}) - ${status}`);
}

console.log("\nMODULES WITH LEADERS:");
const moduleLeaders = db.prepare(`
  SELECT m.code, m.title, u.username, u.email 
  FROM modules m
  LEFT JOIN users u ON m.module_leader_id = u.id
  LIMIT 6
`).all();
for (const m of moduleLeaders) {
  const leader = m.username || "No leader assigned";
  console.log(`   ${m.code}: ${m.title} → ${leader}`);
}

console.log("\nSTAFF PROGRAMME ASSIGNMENTS:");
const staffAssignments = db.prepare(`
  SELECT u.username, p.title, sp.role
  FROM staff_programmes sp
  JOIN users u ON sp.staff_id = u.id
  JOIN programmes p ON sp.programme_id = p.id
`).all();
for (const sa of staffAssignments) {
  console.log(`   ${sa.username} → ${sa.title} (${sa.role})`);
}

console.log("\nNEXT STEPS:");
console.log("   1. Start the server: deno task dev");
console.log("   2. Visit: http://localhost:8000");
console.log("   3. Login with admin/admin123 to access admin panel");
console.log("\n" + "=".repeat(60));

db.close();
console.log("\nDatabase initialization complete!");