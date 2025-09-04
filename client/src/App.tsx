import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ProfilePage from "@/pages/profile-page";
import StaffPage from "@/pages/staff-page";
import StudentsPage from "@/pages/students-page";
import ClassesPage from "@/pages/classes-page";
import ClassDetailPage from "@/pages/class-detail-page";
import SubjectsPage from "@/pages/subjects-page";
import FlightAgentApp from "@/pages/attendance-page";
import FeesPage from "@/pages/fees-page";
import { ProtectedRoute } from "./lib/protected-route";
import BillsPage from "@/pages/bills-page";
import MessagesPage from "@/pages/messages-page";
import StudentClassesPage from "@/pages/student/student-classes-page";
import StudentFeesPage from "@/pages/student/student-fees-page";
import StudentMessagesPage from "@/pages/student/student-messages-page";
import TeacherClassesPage from "@/pages/teacher/teacher-classes-page";
import TeacherMessagesPage from "@/pages/teacher/teacher-messages-page";
import StudentDashboardPage from "@/pages/student/student-dashboard-page";
import TeacherDashboardPage from "@/pages/teacher/teacher-dashboard-page";
import StudentAttendancePage from "./pages/student/student-attendance-page";
import ClassSubjectsPage from "@/pages/class-subjects";
import TeacherSubjectDetailPage from "@/pages/teacher/teacher-subject-detail-page";
import StaffSubjectsPage from "@/pages/staff-subjects-page";
import StaffClassLogsPage from "@/pages/staff-class-logs-page";
import TimetableUploadPage from "@/pages/timetable-upload-page";
import { SchoolDataProvider } from "./context/SchoolDataContext";
import AdminDashboardPage from "./pages/admin/admin-dashboard-page";
import AssignmentsPage from "./pages/assignments-page";
import MaterialsPage from "./pages/material-page";
import TestsPage from "./pages/tests-page";
import ExamsPage from "./pages/exams-page";
import ExamResultsPage from "./pages/exam-results-page";
import HomeworkPage from "./pages/homework-page";
import AttendancePage from "@/pages/attendance-page";

// Router component

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />

      {/* Protected routes requiring authentication */}
      <ProtectedRoute
        path="/"
        component={() => {
          const { user } = useAuth();

          if (user?.role === "student") {
            return <StudentDashboardPage />;
          } else if (user?.role === "staff") {
            return <TeacherDashboardPage />;
          } else if (user?.role === "school_admin") {
            return <AdminDashboardPage />;
          } else {
            // Optional: Redirect or render "Not Authorized"
            return <div>Unauthorized Access</div>;
          }
        }}
      />

      <ProtectedRoute path="/profile" component={ProfilePage} />

      {/* Admin routes */}
      <ProtectedRoute path="/staff" component={StaffPage} />
      <ProtectedRoute path="/students" component={StudentsPage} />
      <ProtectedRoute path="/classes" component={ClassesPage} />
      <ProtectedRoute
        path="/classes/:gradeId/:sectionId"
        component={ClassDetailPage}
      />
      <ProtectedRoute
        path="/classes/:gradeId/:sectionId/subjects"
        component={ClassSubjectsPage}
      />
      <ProtectedRoute path="/subjects" component={SubjectsPage} />
      <ProtectedRoute path="/attendance" component={AttendancePage} />
      <ProtectedRoute path="/fees" component={FeesPage} />
      <ProtectedRoute path="/bills" component={BillsPage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/class-logs" component={StaffClassLogsPage} />
      <ProtectedRoute
        path="/timetables/upload"
        component={TimetableUploadPage}
      />
      {/* Academic routes */}
      <ProtectedRoute path="/materials" component={MaterialsPage} />
      <ProtectedRoute path="/exams" component={ExamsPage} />
      <ProtectedRoute
        path="/exam-results/:examId"
        component={ExamResultsPage}
      />
      <ProtectedRoute path="/tests" component={TestsPage} />
      <ProtectedRoute path="/homework" component={HomeworkPage} />
      {/* Student routes */}
      <ProtectedRoute path="/student/classes" component={StudentClassesPage} />
      <ProtectedRoute path="/student/fees" component={StudentFeesPage} />
      <ProtectedRoute
        path="/student/messages"
        component={StudentMessagesPage}
      />
      <ProtectedRoute
        path="/student/attendance"
        component={StudentAttendancePage}
      />

      {/* Teacher routes */}
      <ProtectedRoute path="/teacher/classes" component={TeacherClassesPage} />
      <ProtectedRoute
        path="/teacher/dashboard"
        component={TeacherClassesPage}
      />
      <ProtectedRoute
        path="/teacher/messages"
        component={TeacherMessagesPage}
      />
      <ProtectedRoute path="/teacher/subjects" component={StaffSubjectsPage} />
      <ProtectedRoute
        path="/teacher/classes/:classId/subjects/:subjectId"
        component={TeacherSubjectDetailPage}
      />
      <ProtectedRoute
        path="/teacher/class-logs"
        component={StaffClassLogsPage}
      />
      <ProtectedRoute
        path="/teacher/timetables/upload"
        component={TimetableUploadPage}
      />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Main app component
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SchoolDataProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SchoolDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
