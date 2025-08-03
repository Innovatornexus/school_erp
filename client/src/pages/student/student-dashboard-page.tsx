import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Calendar, Book, DollarSign, MessageSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function StudentDashboardPage() {
  const { user } = useAuth();

  // Sample data - in a real app would come from API
  const dashboardData = {
    attendance: { present: 85, total: 100 },
    nextClass: "Mathematics at 10:00 AM",
    upcomingFees: { amount: 500, dueDate: "2025-05-15" },
    unreadMessages: 3,
  };

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="container py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {dashboardData.attendance.present}%
                </div>
                <Progress value={dashboardData.attendance.present} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Next Class</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <Book className="h-4 w-4 text-muted-foreground" />
                <span>{dashboardData.nextClass}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Fees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>${dashboardData.upcomingFees.amount}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Due: {dashboardData.upcomingFees.dueDate}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span>{dashboardData.unreadMessages} unread</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
