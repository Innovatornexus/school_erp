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
import { ClassItem, SchoolItem, StaffItem, StudentItem } from "./type";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolData } from "@/context/SchoolDataContext";

// Student form schema aligned with DB schema
const studentFormSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  student_email: z.string().min(3, "email  must be at least 3 characters"),
  status: z.enum(["Active", "Inactive"]),
  password: z.string().min(6, "Password must be at least 6 characters"),
  dob: z.date({
    required_error: "Date of birth is required",
  }),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
  }),
  class_id: z.string({
    required_error: "Please select a class",
  }),
  parentId: z.string().optional(),
  parent_contact: z.string().min(10, "Please enter a valid contact number"),
  admissionDate: z.date({
    required_error: "Admission date is required",
  }),
  parentName: z.string().optional(), // Added to match API
  address: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

export default function StudentsPage() {
  const { user } = useAuth();
  const { students, classes, teachers, loading, refetchData } = useSchoolData();
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
      ? teachers.find((teacher) => teacher.user_id === user.id)
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
                {new Set(students.map((student) => student.class_id)).size}
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
              ? students.filter((s) =>
                  classes.some(
                    (c) =>
                      c.id === s.class_id &&
                      (c.class_teacher_id === currentTeacher.id ||
                        c.subjects?.some(
                          (sub) => sub.teacher_id === currentTeacher.id
                        ))
                  )
                )
              : students
          }
          classData={classes}
          fetchStudents={refetchData}
        />
      </div>
    </DashboardLayout>
  );
}
