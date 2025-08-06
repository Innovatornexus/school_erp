-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users', 'schools', 'school_admins', 'teachers', 'students', 
  'classes', 'subjects', 'class_subjects', 'student_attendance', 
  'teacher_attendance', 'lesson_plans', 'assignments', 
  'assignment_submissions', 'exams', 'exam_subjects', 'marks', 
  'fee_structures', 'fee_payments', 'bills', 'messages', 
  'class_messages', 'class_logs', 'timetables'
);

-- Create class_logs table if not exists
CREATE TABLE IF NOT EXISTS class_logs (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  teacher_id INTEGER NOT NULL REFERENCES teachers(id),
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  log_date DATE NOT NULL,
  covered_topics TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Additional CREATE TABLE statements for other tables can be added here similarly
-- For example, users, schools, teachers, students, classes, etc.
-- Please let me know if you want me to generate full CREATE TABLE statements for all tables.
