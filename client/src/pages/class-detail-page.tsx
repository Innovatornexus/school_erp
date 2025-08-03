import { useState, useEffect } from "react";
import { useLocation, useRoute, Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChevronLeft, Users, Calendar, Clock, BookOpen } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { StudentManager } from "./student-list-page";
import { StudentItem, ClassItem, StaffItem } from "./type";
import { useSchoolData } from "@/context/SchoolDataContext";

/**
 * Class detail page that displays students of a specific grade-section combination
 * Accessible via /classes/:gradeId/:sectionId route
 */
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
  parent_name: z.string().optional(), // Added to match API
  address: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

export default function ClassDetailPage() {
  const { toast } = useToast();
  const [match, params] = useRoute("/classes/:gradeId/:sectionId");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { classes, students, schoolData, refetchData, loading, subjects } =
    useSchoolData();

  // Redirect if not school_admin or staff
  if (user?.role !== "school_admin" && user?.role !== "staff") {
    toast({
      title: "Access Denied",
      description: "You do not have permission to view this page.",
      variant: "destructive",
    });
    return <Redirect to="/dashboard" />;
  }

  const grade = params?.gradeId;
  const section = params?.sectionId;

  const selectedClass = classes.find(
    (cls: ClassItem) => cls.grade === grade && cls.section === section
  );

  const studentsInClass = students.filter(
    (student: StudentItem) => student.class_id === selectedClass?.id
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(
    null
  );
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Initialize form (moved to top-level)
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      full_name: "",
      student_email: "",
      password: "",
      dob: undefined,
      gender: "male",
      class_id: "",
      parent_contact: "",
      parent_name: "",
      admissionDate: new Date(),
      address: "",
    },
  });

  // If no match or still loading, return loading state or redirect
  if (!match || loading) {
    return (
      <DashboardLayout title="Loading Class Details...">
        <div>Loading...</div>
      </DashboardLayout>
    );
  }

  

  //handle student toggle
  const handleToggleStatus = async (student: StudentItem) => {
    const newStatus = student.status === "Active" ? "Inactive" : "Active";

    try {
      const res = await fetch(`/api/students/${student.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast({
        title: "Success",
        description: `Status changed to ${newStatus}`,
      });

      refetchData(); // Refresh data from context
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  // Handle student delete
  const handleDelete = (id: number) => {
    setStudentToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Handle edit student
  const openEditDialog = (student: StudentItem) => {
    setEditingStudent(student);
    const classItem = classes.find(
      (cls: ClassItem) => cls.id === student.class_id
    );

    form.reset({
      full_name: student.full_name,
      student_email: student.student_email,
      gender: student.gender as "male" | "female" | "other",
      dob: student.dob,
      class_id: classItem?.id.toString() || "",
      parent_contact: student.parent_contact,
      admissionDate: student.admissionDate,
      parent_name: student.parent_name,
    });
    setIsDialogOpen(true);
  };

  return (
    <DashboardLayout title={`Class ${grade}${section} Details`}>
      <div className="container py-6">
        {/* Back Button & Class Title */}
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate("/classes")}
            className="mb-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Classes
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/classes/${grade}/${section}/subjects`)}
            >
              <BookOpen className="mr-2 h-4 w-4" /> Class Subjects
            </Button>
          </div>
        </div>

        

        {/* Class Information */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Class {grade}
            {section}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              <div>
                <p className="text-sm opacity-75">Students</p>
                <p className="text-xl font-semibold">
                  {studentsInClass?.length || 0} Students
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <div>
                <p className="text-sm opacity-75">Academic Year</p>
                <p className="text-xl font-semibold">2024-2025</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              <div>
                <p className="text-sm opacity-75">Class Teacher</p>
                <p className="text-xl font-semibold">
                  {selectedClass?.class_teacher_name || "Not Assigned"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Student Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Total Students</CardTitle>
              <CardDescription>In this class</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {studentsInClass?.length || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Male Students</CardTitle>
              <CardDescription>Gender distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {studentsInClass?.filter((s) => s.gender === "male").length ||
                  0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Female Students</CardTitle>
              <CardDescription>Gender distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {studentsInClass?.filter(
                  (s: { gender: string }) => s.gender === "female"
                ).length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <StudentManager
          studentData={studentsInClass}
          classData={classes}
          fetchStudents={refetchData}
        />
      </div>
    </DashboardLayout>
  );
}
