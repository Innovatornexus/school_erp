import { Switch, Route } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ProfilePage from "@/pages/profile-page";
import StaffPage from "@/pages/staff-page";
import StudentsPage from "@/pages/students-page";
import ClassesPage from "@/pages/classes-page";
import ClassDetailPage from "@/pages/class-detail-page";
import SubjectsPage from "@/pages/subjects-page";
import AttendancePage from "@/pages/attendance-page";
import FeesPage from "@/pages/fees-page";
import { ProtectedRoute } from "@/lib/protected-route";
import BillsPage from "@/pages/bills-page";
import MessagesPage from "@/pages/messages-page";
import StudentClassesPage from "@/pages/student/student-classes-page";
import StudentFeesPage from "@/pages/student/student-fees-page";
import TeacherClassesPage from "@/pages/teacher/teacher-classes-page"; // Added import
import TeacherMessagesPage from "@/pages/teacher/teacher-messages-page"; // Added import
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentMessagesPage() {
  const { user } = useAuth();

  // Sample data - in a real app this would come from an API
  const messages = [
    {
      id: 1,
      sender: "Mr. John Smith",
      content: "Your math homework is due tomorrow",
      date: "2024-02-20",
    },
    {
      id: 2,
      sender: "Mrs. Jane Doe",
      content: "Great work on your science project!",
      date: "2024-02-19",
    },
  ];

  return (
    <DashboardLayout title="My Messages">
      <div className="container py-6">
        <div className="grid gap-6">
          {messages.map((message) => (
            <Card key={message.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold">
                  From: {message.sender}
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {message.date}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{message.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
