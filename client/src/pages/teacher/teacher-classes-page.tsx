import { useAuth } from "@/hooks/use-auth";
import { useSchoolData } from "@/context/SchoolDataContext";
import DashboardLayout from "@/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Book, Users, Calendar } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

interface ClassData {
  id: number;
  grade: string;
  section: string;
  studentCount: number;
  class_teacher_id: number;
  class_teacher_name: string;
}

export default function TeacherClassesPage() {
  const { user } = useAuth();
  const { teachers, loading: schoolDataLoading } = useSchoolData();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Find the teacher record for the current user
  const currentTeacher = useMemo(
    () => teachers.find((t) => t.userId === user?.id),
    [teachers, user?.id]
  );

  useEffect(() => {
    const fetchClasses = async () => {
      if (!currentTeacher?.id) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/teachers/${currentTeacher.id}/classes`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch classes");
        }
        const data = await response.json();
        setClasses(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch classes"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [currentTeacher?.id]);
  console.log("classes by teacher , ", classes);

  if (schoolDataLoading || loading) {
    return (
      <DashboardLayout title="My Classes">
        <div className="container py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="My Classes">
        <div className="container py-6">
          <div className="text-center text-red-500">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Classes">
      <div className="container py-6">
        <div className="grid gap-6">
          {classes.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No classes assigned to you yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            classes.map((cls) => (
              <Card key={cls.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-bold">
                    {cls.grade} {cls.section}
                  </CardTitle>
                  <Badge variant="outline" className="text-lg">
                    {cls.studentCount} students
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Class Teacher: {cls.class_teacher_name}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Book className="mr-2 h-4 w-4" />
                      <span>Grade: {cls.grade}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Section: {cls.section}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
