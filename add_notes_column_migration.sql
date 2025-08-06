-- Migration to add missing notes column to teacher_attendance table
-- This resolves the "column 'notes' does not exist" error

-- Add notes column to teacher_attendance table
ALTER TABLE teacher_attendance ADD COLUMN notes TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teacher_attendance' 
AND column_name = 'notes';
