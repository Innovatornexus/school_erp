import React from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolData } from "@/context/SchoolDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StaffSubjectsPage() {
  const { user } = useAuth() as { user: any };
  const { classes, subjects, teachers, loading } = useSchoolData();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <DashboardLayout title="Loading Staff Subjects...">
        <div className="container py-6">Loading...</div>
      </DashboardLayout>
    );
  }

  if (user?.role !== "staff") {
    return (
      <DashboardLayout title="Access Denied">
        <div className="container py-6">
          <p>You do not have permission to view this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Find the teacher record for the current user
  const currentUserTeacher = teachers.find(
    (teacher: any) => teacher.user_id === user.id
  );
  const teacherId = currentUserTeacher?.id;

  // Filter classes that have subjects assigned to this staff user
  const staffClasses = classes.filter((cls) =>
    cls.subjects?.some((sub: any) => sub.teacher_id === teacherId)
  );

  return (
    <DashboardLayout title="My Subjects">
      <div className="container py-6">
        {staffClasses.length === 0 && (
          <p className="text-center text-gray-500">You have no assigned subjects.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffClasses.map((cls: any) => (
            <Card key={cls.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
              <CardHeader className="bg-primary text-primary-foreground rounded-t-lg p-4">
                <CardTitle className="text-xl font-bold">
                  Grade {cls.grade} Section {cls.section}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">Assigned Subjects:</h3>
                <ul className="space-y-2">
                  {cls.subjects
                    .filter((sub: any) => sub.teacher_id === teacherId)
                    .map((sub: any) => {
                      const subject = subjects.find(
                        (s) => s.id === sub.subject_id
                      );
                      return (
                        <li key={sub.subject_id}>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left hover:bg-accent hover:text-accent-foreground"
                            onClick={() =>
                              navigate(
                                `/teacher/classes/${cls.id}/subjects/${sub.subject_id}`
                              )
                            }
                          >
                            {subject ? subject.subject_name : "Unknown Subject"}
                          </Button>
                        </li>
                      );
                    })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
