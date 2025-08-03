import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/layout/dashboard-layout";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  UserPlus,
  FileText,
  Pencil,
  Users,
  Calendar,
  Clock,
  BookOpen,
  Edit,
  Trash,
} from "lucide-react";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { StudentManager } from "./student-list-page";
import { SchoolItem, StudentItem } from "./type";

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

// commented due to aldready referred in type
// interface StudentItem {
//   student_email: string | undefined;
//   id: number;
//   full_name: string;

//   gender: "male" | "female" | "other";
//   dob: Date;
//   className: string;
//   parent_name: string;
//   parent_contact: string;
//   admissionDate: Date;
//   status: "Active" | "Inactive";
//   address: string;
// }
type StudentFormValues = z.infer<typeof studentFormSchema>;
interface StaffItem {
  id: number;

  full_name: string;
  email: string;
  gender: "male" | "female" | "other";
  joining_date: Date;
  status: "Active" | "Inactive";
  address: string;
  phone_number: string;
  subject_specialization: string;
}

type ClassItem = {
  id: number;
  name: string;
  grade: string;
  section: string;
  class_teacher_id: string;
  class_teacher_name: string; // Added to match API
  studentCount: number;
};

export default function ClassDetailPage() {
  const { toast } = useToast();
  const [match, params] = useRoute("/classes/:gradeId/:sectionId");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const grade = params?.gradeId;
  const section = params?.sectionId;
  const [studentData, setStudentData] = useState<StudentItem[]>([]);
  const [classData, setClassData] = useState<ClassItem[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const selectedClass = classData.find(
    (cls) => cls.grade === grade && cls.section === section
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(
    null
  ); // Added type
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [schoolData, setSchoolData] = useState<SchoolItem | null>(null);

  // If no match, redirect to classes page
  if (!match) {
    return null;
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

      await fetchStudents(); // Refresh data
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
  const fetchSchool = async () => {
    try {
      if (user?.role === "school_admin") {
        console.log("calling to fetch school by user email");
        const res = await fetch(`/api/school/${user?.email}`);
        if (!res.ok) throw new Error("Failed to fetch school");
        const data = await res.json();

        console.log("school datas::", data);
        // setClassName(`Class ${data.grade}${data.section}`);

        setSchoolData(data);
      }
    } catch (error) {
      console.log("school error: ", error);
      toast({
        title: "Error",
        description: "Failed to load school list",
        variant: "destructive",
      });
    }
  };
  // Fetch class details
  const fetchClass = async () => {
    try {
      console.log("fetching class for school:", schoolData);
      const res = await fetch(`/api/schools/${schoolData?.id}/classes`);

      if (!res.ok) throw new Error("Failed to fetch class");
      const data = await res.json();
      console.log("class datas::", data);
      // setClassName(`Class ${data.grade}${data.section}`);

      setClassData(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load class list",
        variant: "destructive",
      });
    }
  };

  // Fetch students for this class
  const fetchStudents = async () => {
    try {
      if (!selectedClass?.id) return;

      const res = await fetch(`/api/classes/${selectedClass.id}/students`);
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudentData(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    }
  };

  //fetch school by admin email
  useEffect(() => {
    fetchSchool();
  }, []);

  //if school id found , fetch class by school

  useEffect(() => {
    if (schoolData) {
      fetchClass();
    }
  }, [schoolData]);

  useEffect(() => {
    if (selectedClass) fetchStudents();
  }, [selectedClass]);

  // Handle edit student
  const openEditDialog = (student: StudentItem) => {
    setEditingStudent(student);
    const classItem = classData.find((cls) => cls.id === student.class_id);

    form.reset({
      full_name: student.full_name,
      student_email: student.student_email,
      gender: student.gender as "male" | "female" | "other",
      dob: student.dob,
      class_id: classItem?.id.toString() || "",

      parent_contact: student.parent_contact,
      admissionDate: student.admissionDate,
      parent_name: student.parent_name, // Added parentName
    });
    setIsDialogOpen(true);
  };

  // Initialize form
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

  // Define columns for student table
  // const studentcolumn: DataTableColumn<StudentItem>[] = [
  //   {
  //     header: "ID",
  //     accessorKey: "id",
  //   },
  //   {
  //     header: "Name",
  //     accessorKey: "full_name",
  //   },
  //   {
  //     header: "Email",
  //     accessorKey: "student_email",
  //   },
  //   {
  //     header: "Gender",
  //     accessorKey: "gender",
  //   },
  //   {
  //     header: "Parent Name",
  //     accessorKey: "parent_name",
  //   },
  //   {
  //     header: "Parent Contact",
  //     accessorKey: "parent_contact",
  //   },
  //   {
  //     header: "Status",
  //     accessorKey: "status",
  //     cell: (student) => (
  //       <button
  //         onClick={() => handleToggleStatus(student)} // define this function in your component
  //         className={`text-sm px-2 py-1 rounded ${
  //           student.status === "Active" ? "bg-green-200" : "bg-red-200"
  //         }`}
  //       >
  //         {student.status === "Active" ? "Active" : "Inactive"}
  //       </button>
  //     ),
  //   },
  //   {
  //     header: "Actions",
  //     accessorKey: "id",
  //     cell: (student: StudentItem) => (
  //       <div className="flex space-x-2">
  //         <Button
  //           variant="ghost"
  //           size="icon"
  //           onClick={() => openEditDialog(student)}
  //         >
  //           <Edit className="h-4 w-4" />
  //         </Button>
  //         <Button
  //           variant="ghost"
  //           size="icon"
  //           onClick={() => handleDelete(student.id)}
  //         >
  //           <Trash className="h-4 w-4" />
  //         </Button>
  //       </div>
  //     ),
  //   },
  // ];

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
                  {studentData?.length || 0} Students
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
              <p className="text-3xl font-bold">{studentData?.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Male Students</CardTitle>
              <CardDescription>Gender distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {studentData?.filter((s) => s.gender === "male").length || 0}
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
                {studentData?.filter(
                  (s: { gender: string }) => s.gender === "female"
                ).length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <StudentManager
          studentData={studentData}
          classData={classData}
          fetchStudents={fetchStudents}
        />
      </div>
    </DashboardLayout>
  );
}
