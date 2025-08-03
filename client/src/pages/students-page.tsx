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
  const { toast } = useToast();
  const [studentData, setStudentData] = useState<StudentItem[]>([]); // Added type
  const [schoolData, setSchoolData] = useState<SchoolItem | null>(null);
  const [classData, setClassData] = useState<ClassItem[]>([]);
  ``;
  const [staffData, setStaffData] = useState<StaffItem[]>([]);
  const [class_name, setClassName] = useState("");

  //fetch staff
  const fetchStaff = async () => {
    try {
      console.log("fetching staff detail");
      const res = await fetch(`/api/Teachers/${user?.email}/staff`);
      if (!res.ok) throw new Error("Failed to fetch staff");
      const data = await res.json();
      console.log("staff datas::", data);
      setStaffData(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load staff list",
        variant: "destructive",
      });
    }
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
      } else if (user?.role === "staff") {
        console.log(
          "calling to fetch school by staff schoolid",
          staffData,
          "school id",
          staffData[0]?.school_id
        );
        const res = await fetch(`/api/schools/${staffData[0]?.school_id}`);
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

  const fetchClass = async () => {
    try {
      console.log(
        "fetching class for school:",
        schoolData,
        "school id:",
        schoolData?.id
      );
      const res = await fetch(`/api/schools/${schoolData?.id}/classes`);

      if (!res.ok) throw new Error("Failed to fetch class");
      const data = await res.json();
      console.log("class datas::", data);
      setClassName(`Class ${data.grade}${data.section}`);

      setClassData(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load class list",
        variant: "destructive",
      });
    }
  };

  const fetchStudents = async () => {
    try {
      console.log("fetching students ,..");
      const res = await fetch(`/api/schools/all-students/${schoolData?.id}`);
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

  if (user?.role === "staff") {
    //get staff first
    useEffect(() => {
      fetchStaff();
    }, []);

    //get school by staff email
    console.log("current  User ::", user?.role);
    useEffect(() => {
      console.log("staff data ::", staffData);
      if (staffData.length > 0) {
        fetchSchool();
      }
    }, [staffData]);
  } else {
    console.log("current user ::", user?.role);
    useEffect(() => {
      fetchSchool();
    }, []);
  }

  useEffect(() => {
    if (schoolData) {
      fetchClass();
    }
  }, [schoolData]);

  useEffect(() => {
    if (classData && schoolData) {
      fetchStudents();
    }
  }, [classData]);

  // DataTable columns
  // const columns: DataTableColumn<StudentItem>[] = [
  //   {
  //     header: "Name",
  //     accessorKey: "full_name",
  //   },
  //   {
  //     header: "student_email",
  //     accessorKey: "student_email",
  //   },
  //   {
  //     header: "Class",
  //     accessorKey: "className",
  //   },
  //   {
  //     header: "Gender",
  //     accessorKey: "gender",
  //     cell: (student: StudentData) => (
  //       <span className="capitalize">{student.gender}</span>
  //     ),
  //   },
  //   {
  //     header: "Date of Birth",
  //     accessorKey: "dob",

  //     cell: (student: StudentData) => {
  //       const date = new Date(student.dob);
  //       return isNaN(date.getTime()) ? "-" : format(date, "PPP");
  //     },
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
  //     cell: (student: StudentData) => (
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
              <p className="text-3xl font-bold">{studentData.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Classes</CardTitle>
              <CardDescription>Total active classes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {new Set(studentData.map((student) => student.class_id)).size}
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

        {/* Class Distribution
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Class Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {studentsByClass.map((cls, index) => (
              <div key={index} className="border rounded-lg p-4 text-center">
                <p className="font-medium text-primary">{cls.name}</p>
                <p className="text-2xl font-bold">{cls.count}</p>
                <p className="text-xs text-muted-foreground">students</p>
              </div>
            ))}
          </div>
        </div> */}

        <StudentManager
          studentData={studentData}
          classData={classData}
          fetchStudents={fetchStudents}
        />
      </div>
    </DashboardLayout>
  );
}
