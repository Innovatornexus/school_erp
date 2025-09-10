# Fix Student Creation Type Error

## Issue

"Expected string, received number while creating student" - classId is being sent as number instead of string to backend.

## Root Cause

In `client/src/pages/student-list-page.tsx`, the classId form field converts the selected value to number using `Number(value)` in onValueChange, but backend expects string.

## Tasks

- [ ] Fix classId conversion in student-list-page.tsx (remove Number() conversion)
- [ ] Test student creation functionality
- [ ] Verify no other similar type mismatches exist

## Files to Edit

- client/src/pages/student-list-page.tsx
- [ ] Update frontend components if necessary
