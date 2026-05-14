-- LMS Database Schema (SQLite version)

-- ── Users ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  role       TEXT CHECK(role IN ('student', 'instructor', 'admin', 'superadmin')) NOT NULL DEFAULT 'student',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Courses ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  status        TEXT CHECK(status IN ('draft', 'published')) NOT NULL DEFAULT 'draft',
  instructor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Enrollments ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id   TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, course_id)
);

-- ── Lessons ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id           TEXT PRIMARY KEY,
  course_id    TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT,
  content_url  TEXT,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);

-- ── Lesson Completions ───────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_completions (
  id           TEXT PRIMARY KEY,
  student_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_completions_student_lesson ON lesson_completions(student_id, lesson_id);

-- ── Assessments ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
  id               TEXT PRIMARY KEY,
  lesson_id        TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  type             TEXT CHECK(type IN ('quiz', 'assignment')) NOT NULL,
  duration_minutes INTEGER, -- NULL means untimed
  deadline         DATETIME,
  passing_score    INTEGER DEFAULT 60,
  allow_multiple_attempts BOOLEAN DEFAULT 0,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lesson_id, type) -- One quiz and one assignment per lesson max
);

-- ── Questions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id               TEXT PRIMARY KEY,
  assessment_id    TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_text    TEXT NOT NULL,
  type             TEXT CHECK(type IN ('mcq', 'written')) NOT NULL,
  points           INTEGER DEFAULT 1,
  order_index      INTEGER DEFAULT 0
);

-- ── MCQ Options ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS question_options (
  id               TEXT PRIMARY KEY,
  question_id      TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text      TEXT NOT NULL,
  is_correct       BOOLEAN NOT NULL DEFAULT 0
);

-- ── Submissions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id               TEXT PRIMARY KEY,
  assessment_id    TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status           TEXT CHECK(status IN ('in_progress', 'pending_grading', 'graded')) NOT NULL DEFAULT 'in_progress',
  total_score      REAL DEFAULT 0,
  instructor_feedback TEXT,
  started_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at     DATETIME,
  UNIQUE(assessment_id, student_id) -- One entry per student/assessment
);

-- ── Answers ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS answers (
  id               TEXT PRIMARY KEY,
  submission_id    TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  question_id      TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id TEXT REFERENCES question_options(id), -- For MCQ
  text_answer      TEXT, -- For Written
  file_url         TEXT, -- For Scanned Assignments
  points_awarded   REAL DEFAULT 0
);

-- ── Notifications ────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message          TEXT NOT NULL,
  type             TEXT,
  is_read          BOOLEAN DEFAULT 0,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Certificates ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificates (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id   TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  issued_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, course_id)
);

-- ── XP Ledger ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xp_events (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  xp_amount    INTEGER NOT NULL,
  reference_id TEXT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user ON xp_events(user_id);

-- ── Achievements ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_key   TEXT NOT NULL,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_key)
);

-- ── Discussions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS discussions (
  id          TEXT PRIMARY KEY,
  lesson_id   TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id   TEXT REFERENCES discussions(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discussions_lesson ON discussions(lesson_id);

