const { createClient } = require("@libsql/client");

const db = createClient({
  url: process.env.TURSO_URL || "libsql://app-mikefeufh.aws-eu-west-1.turso.io",
  authToken:
    process.env.TURSO_TOKEN ||
    "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODIyNDI3NDQsImlkIjoiMDE5ZWY1ZjEtZjcwMS03N2I4LTk4MzYtMDkyYzJlNjAzZWIxIiwicmlkIjoiZmIyYjZjMTAtY2QwNS00NmE0LWJjYTUtNjIyNGZiMTViNjhjIn0.6UAG4ZnukOXrAw4LXwdkp7-vX_dmuzn1i6l3drctHHO3vpEh37Bw2CdwttKxorB7nfgVT--icpDdMPGmVFQFCQ",
});

async function run() {
  await db.execute(`CREATE TABLE IF NOT EXISTS "User" (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, plan TEXT DEFAULT 'free', createdAt TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS "Subject" (id TEXT PRIMARY KEY, userId TEXT NOT NULL, name TEXT NOT NULL, color TEXT DEFAULT '#18181b', FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS "Lesson" (id TEXT PRIMARY KEY, subjectId TEXT NOT NULL, dayOfWeek INTEGER NOT NULL, startTime TEXT NOT NULL, endTime TEXT NOT NULL, location TEXT, teacher TEXT, FOREIGN KEY (subjectId) REFERENCES "Subject"(id) ON DELETE CASCADE)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS "Task" (id TEXT PRIMARY KEY, subjectId TEXT NOT NULL, title TEXT NOT NULL, deadline TEXT NOT NULL, completed INTEGER DEFAULT 0, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (subjectId) REFERENCES "Subject"(id) ON DELETE CASCADE)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS "DailyPlan" (id TEXT PRIMARY KEY, userId TEXT NOT NULL, date TEXT NOT NULL, content TEXT NOT NULL, FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE, UNIQUE(userId, date))`);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_subject_userId ON "Subject"(userId)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_lesson_subjectId ON "Lesson"(subjectId)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_task_subjectId ON "Task"(subjectId)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_task_deadline ON "Task"(deadline)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_dailyplan_userId ON "DailyPlan"(userId)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_dailyplan_date ON "DailyPlan"(date)`);

  console.log("Tables created successfully on Turso!");
}

run().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
