# TODO for Exam Results Page Update

- [x] Import ToggleGroup and ToggleGroupItem in exam-results-page.tsx
- [x] Add selectedSubjectId state and remove expandedSubjects state
- [x] Wrap page content inside DashboardLayout with title
- [x] Replace vertical subject cards with horizontal ToggleGroup
- [x] Implement conditional rendering of selected subject info below toggles
- [ ] Test the updated page functionality and layout

# TODO for getExamResults Improvement

- [x] Add error handling in getExamResults method in server/storage.ts
- [x] Add missing API endpoint `/api/exams/:examId/results` in server/routes.ts
- [ ] Optimize database queries in getExamResults to reduce calls using joins
- [ ] Add optional filtering parameters to getExamResults (e.g., by subject or student)
- [ ] Update return type of getExamResults for better type safety
- [ ] Review and update client/src/pages/exam-results-page.tsx for UI changes if needed
- [ ] Test the updated getExamResults method with sample data
- [ ] Run the application and verify functionality
- [ ] Update frontend components if necessary
