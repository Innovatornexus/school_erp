import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User, Clock } from "lucide-react";

export default function TeacherMessagesPage() {
  const { user } = useAuth();

  // Sample data - in a real app this would come from an API
  const messages = [
    {
      id: 1,
      from: "Principal",
      subject: "Monthly Progress Report",
      content:
        "Please submit the monthly progress reports for your classes by Friday.",
      time: "2 hours ago",
      status: "unread",
    },
    {
      id: 2,
      from: "Parent - John Smith",
      subject: "Student Performance",
      content: "I would like to discuss Alice's performance in Mathematics.",
      time: "1 day ago",
      status: "read",
    },
  ];

  return (
    <DashboardLayout title="My Messages">
      <div className="container py-6">
        <div className="space-y-4">
          {messages.map((message) => (
            <Card
              key={message.id}
              className={
                message.status === "unread" ? "border-blue-200 bg-blue-50" : ""
              }
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {message.subject}
                </CardTitle>
                <Badge
                  variant={message.status === "unread" ? "default" : "outline"}
                >
                  {message.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <User className="mr-2 h-4 w-4" />
                    <span>From: {message.from}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{message.time}</span>
                  </div>
                  <p className="text-sm mt-2">{message.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
