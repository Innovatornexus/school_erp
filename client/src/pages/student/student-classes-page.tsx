import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Book, BookOpen, Calendar } from "lucide-react";

export default function StudentClassesPage() {
  const { user } = useAuth();

  // Sample data - in a real app this would come from an API
  const myClasses = [
    {
      name: "Mathematics",
      teacher: "Mr. John Smith",
      schedule: "Monday, Wednesday 9:00 AM",
      upcoming: "Quiz on Algebra",
      grade: "A",
    },
    {
      name: "Science",
      teacher: "Mrs. Jane Doe",
      schedule: "Tuesday, Thursday 10:00 AM",
      upcoming: "Lab Report Due",
      grade: "B+",
    },
  ];

  return (
    <DashboardLayout title="My Classes & Subjects">
      <div className="container py-6">
        <div className="grid gap-6">
          {myClasses.map((cls, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">{cls.name}</CardTitle>
                <Badge variant="outline" className="text-lg">
                  {cls.grade}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Teacher: {cls.teacher}</span>
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
