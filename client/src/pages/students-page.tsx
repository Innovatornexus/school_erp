import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/layout/dashboard-layout";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, Edit, Trash, UserPlus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { StudentManager } from "./student-list-page";
import { Class, School, Teacher, Student } from "@/pages/type";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolData } from "@/context/SchoolDataContext";

// Student form schema aligned with DB schema (camelCase)
const studentFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  status: z.enum(["Active", "Inactive"]).default("Active"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
  }),
  classId: z.string({
    required_error: "Please select a class",
  }),
  parentId: z.string().optional(),
  parentContact: z.string().min(10, "Please enter a valid contact number"),
  admissionDate: z.string().min(1, "Admission date is required"),
  parentName: z.string().optional(),
  address: z.string().optional(),
  schoolId: z.string(), // Add schoolId to schema
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

export default function StudentsPage() {
  const { user } = useAuth();
  const { students, classes, teachers, loading, fetchData } = useSchoolData();
  const { toast } = useToast();

  if (loading) {
    return (
      <DashboardLayout title="Student Management">
        <div className="container py-6">Loading...</div>
      </DashboardLayout>
    );
  }

  // For staff users, find the teacher record that corresponds to the current user
  const currentTeacher =
    user?.role === "staff"
      ? teachers.find((teacher) => teacher.userId === user.id)
      : null;

  return (
    <DashboardLayout title="Student Management">
      <div className="container py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Total Students</CardTitle>
              <CardDescription>All enrolled students</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{students.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Classes</CardTitle>
              <CardDescription>Total active classes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {new Set(students.map((student) => student.classId)).size}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">New Students</CardTitle>
              <CardDescription>Added this month</CardDescription>
            </CardHeader>
            {/* <CardContent>
              <p className="text-3xl font-bold">
                {
                  studentData.filter(
                    (student) =>
                      student.admissionDate.getMonth() ===
                        new Date().getMonth() &&
                      student.admissionDate.getFullYear() ===
                        new Date().getFullYear()
                  ).length
                }
              </p>
            </CardContent> */}
          </Card>
        </div>

        <StudentManager
          studentData={
            user?.role === "staff" && currentTeacher
              ? students.filter((s) => {
                  // Find the class for this student
                  const studentClass = classes.find((c) => c.id === s.classId);

                  // If we can't find the class, exclude the student
                  if (!studentClass) return false;

                  // Check if the current teacher is the class teacher
                  const isClassTeacher =
                    studentClass.classTeacherId === currentTeacher.id;

                  // Check if the current teacher teaches any subjects in this class
                  const teachesSubjectsInClass = studentClass.subjects?.some(
                    (sub: any) => sub.teacherId === currentTeacher.id
                  );

                  // Include the student if either condition is true
                  return isClassTeacher || teachesSubjectsInClass;
                })
              : students
          }
          classData={classes}
          fetchStudents={fetchData}
        />
      </div>
    </DashboardLayout>
  );
}
