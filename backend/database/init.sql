-- Run this file against your PostgreSQL database once to initialise the schema.
-- psql -U postgres -d lms_db -f database/init.sql

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enums ────────────────────────────────────────────
-- Role enum — admin can only be assigned directly in the database
CREATE TYPE user_role    AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE course_status AS ENUM ('draft', 'published');

-- ── Users ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  password    TEXT          NOT NULL,   -- bcrypt hash, never plain-text
  role        user_role     NOT NULL DEFAULT 'student',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Courses ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(255)  NOT NULL,
  description   TEXT,
  category      VARCHAR(100),
  instructor_id UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        course_status NOT NULL DEFAULT 'draft',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Enrollments ───────────────────────────────────────
-- UNIQUE constraint enforced at DB level — API catches error code 23505
CREATE TABLE IF NOT EXISTS enrollments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id   UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
-- ── Lessons ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID         NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  content      TEXT,         -- Markdown or rich text
  content_url  TEXT,         -- Optional link (e.g. YouTube/Vimeo)
  order_index  INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for faster curriculum retrieval
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
