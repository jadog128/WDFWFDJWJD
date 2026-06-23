-- Run this SQL in your Supabase Dashboard SQL Editor
-- Go to https://supabase.com/dashboard/project/zzqbkaumedxdrvpqxszw/sql/new

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (synced from Clerk)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "User_email_key" UNIQUE ("email")
);

-- Subjects
CREATE TABLE IF NOT EXISTS "Subject" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#18181b',
    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Subject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Lessons
CREATE TABLE IF NOT EXISTS "Lesson" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "subjectId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT,
    "teacher" TEXT,
    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Lesson_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE
);

-- Tasks
CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Task_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE
);

-- Daily Plans
CREATE TABLE IF NOT EXISTS "DailyPlan" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,
    CONSTRAINT "DailyPlan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DailyPlan_userId_date_key" UNIQUE ("userId", "date"),
    CONSTRAINT "DailyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "Subject_userId_idx" ON "Subject"("userId");
CREATE INDEX IF NOT EXISTS "Lesson_subjectId_idx" ON "Lesson"("subjectId");
CREATE INDEX IF NOT EXISTS "Task_subjectId_idx" ON "Task"("subjectId");
CREATE INDEX IF NOT EXISTS "Task_deadline_idx" ON "Task"("deadline");
CREATE INDEX IF NOT EXISTS "DailyPlan_userId_idx" ON "DailyPlan"("userId");
CREATE INDEX IF NOT EXISTS "DailyPlan_date_idx" ON "DailyPlan"("date");
