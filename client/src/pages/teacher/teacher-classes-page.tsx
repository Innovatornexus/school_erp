import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Book, Users, Calendar } from "lucide-react";

export default function TeacherClassesPage() {
  const { user } = useAuth();

  // Sample data - in a real app this would come from an API
  const myClasses = [
    {
      name: "Mathematics - Class 8A",
      students: 42,
      schedule: "Monday, Wednesday 9:00 AM",
      upcoming: "Chapter 5 - Algebra",
      attendance: "95%",
    },
    {
      name: "Mathematics - Class 8B",
      students: 38,
      schedule: "Tuesday, Thursday 10:00 AM",
      upcoming: "Quiz on Geometry",
      attendance: "92%",
    },
  ];

  return (
    <DashboardLayout title="My Classes">
      <div className="container py-6">
        <div className="grid gap-6">
          {myClasses.map((cls, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">{cls.name}</CardTitle>
                <Badge variant="outline" className="text-lg">
                  {cls.attendance}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Students: {cls.students}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Schedule: {cls.schedule}</span>
                  </div>
                  <div className="mt-4 bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium">
                      Upcoming: {cls.upcoming}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
