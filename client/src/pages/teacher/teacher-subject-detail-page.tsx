import React, { useState, useEffect } from "react";
import { useRoute, Redirect, useLocation } from "wouter";
import DashboardLayout from "@/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  BookOpen,
  Calendar,
  Clock,
  ListChecks,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useSchoolData } from "@/context/SchoolDataContext";
import { Class, Subject, Teacher } from "@/types";

export default function TeacherSubjectDetailPage() {
  const [match, params] = useRoute(
    "/teacher/classes/:classId/subjects/:subjectId"
  );
  const [, navigate] = useLocation();
  const { user } = useAuth() as { user: any };
  const { toast } = useToast();
  const { schoolData, classes, subjects, teachers, loading } = useSchoolData();

  const classId = params?.classId || "";
  const subjectId = params?.subjectId || "";

  const selectedClass = classes.find((cls: Class) => cls.id === classId);
  const selectedSubject = subjects.find(
    (sub: Subject) => sub.id === subjectId
  );

  // Find the teacher assigned to this specific class-subject mapping
  let assignedTeacher = null;
  let teacherId = null;

  if (user?.role === "staff") {
    // Find the teacher record for the current user
    const currentUserTeacher = teachers.find(
      (teacher: any) => teacher.userId === user.id
    );
    teacherId = currentUserTeacher?.id;

    // For staff, find assigned teacher differently, since selectedClass.subjects may be missing
    assignedTeacher = currentUserTeacher;
  } else {
    teacherId = user?.id;
    assignedTeacher = selectedClass?.subjects?.find(
      (s: any) => s.subject_id === subjectId && s.teacher_id === teacherId
    );
  }

  // Redirect if not staff or if class/subject not found or not assigned to this teacher
  if (
    (user?.role !== "staff" && user?.role !== "school_admin") ||
    !match ||
    !selectedClass ||
    !selectedSubject ||
    !assignedTeacher
  ) {
    toast({
      title: "Access Denied",
      description:
        "You do not have permission to view this subject details or it does not exist.",
      variant: "destructive",
    });
    return <Redirect to="/dashboard" />;
  }

  // Check if the current teacher is assigned to this specific subject
  const isTeacherAssignedToSubject = selectedClass?.subjects?.some(
    (s: any) => s.subject_id === subjectId && s.teacher_id === teacherId
  );

  // Redirect if the teacher is not assigned to this subject
  if (!isTeacherAssignedToSubject) {
    toast({
      title: "Access Denied",
      description: "You do not have permission to view this subject details.",
      variant: "destructive",
    });
    return <Redirect to="/dashboard" />;
  }

  if (loading) {
    return (
      <DashboardLayout title="Loading Subject Details...">
        <div className="container py-6">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${selectedSubject.subject_name} Details`}>
      <div className="container py-6">
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate(`/teacher/subjects`)}
            className="mb-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to My Subjects
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-4">
          {selectedSubject.subjectName} - Class {selectedClass.grade}
          {selectedClass.section}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Syllabus</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Syllabus content goes here. This can be fetched from a dedicated
                API endpoint or stored within the subject data itself.
              </p>
              {/* Placeholder for syllabus content */}
              <Button className="mt-4">View Full Syllabus</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timetable</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <img
                src="/placeholder-timetable.png"
                alt="Timetable"
                className="w-full h-auto object-cover rounded-md"
              />
              <p className="text-gray-700 mt-2">
                Timetable image placeholder. This could be dynamically loaded.
              </p>
              <Button className="mt-4">Download Timetable</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Portions Covered
            </CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
              placeholder="Enter portions covered, notes, or updates..."
            ></textarea>
            <Button className="mt-4">Save Progress</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Exams
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-gray-700">
                <li>Mid-Term Exam: October 20, 2024</li>
                <li>Final Exam: December 15, 2024</li>
                {/* Dynamically load exams related to this subject and class */}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-gray-700">
                <li>Homework 1: Due September 10, 2024</li>
                <li>Project: Due November 1, 2024</li>
                {/* Dynamically load assignments related to this subject and class */}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
