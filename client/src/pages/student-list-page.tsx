import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast, useToast } from "@/hooks/use-toast";
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
import { ClassItem, StudentItem } from "./type";
import { useAuth } from "@/hooks/use-auth";
import { error } from "console";

type Props = {
  studentData: StudentItem[];
  classData: ClassItem[];
  fetchStudents: () => Promise<void>;
};
type StudentFormValues = z.infer<typeof studentFormSchema>;
// Student form schema aligned with DB schema
const studentFormSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  student_email: z.string().min(3, "email  must be at least 3 characters"),
  status: z.enum(["Active", "Inactive"]),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z
    .string()
    .min(6, "Confirm password must be at least 6 characters"),
  dob: z.date({
    required_error: "Date of birth is required",
  }),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
  }),
  class_id: z.number({
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

export const StudentManager = ({
  studentData,
  classData,
  fetchStudents,
}: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      full_name: "",
      student_email: "",
      password: "",
      confirmPassword: "",
      gender: "male",
      dob: undefined,
      class_id: undefined,
      parent_contact: "",
      admissionDate: new Date(),
      parent_name: "",
      address: "",
      status: "Active",
    },
  });

  //create student
  const createStudent = async (data: StudentFormValues) => {
    try {
      // 1. First, create a user (needed to get user_id)
      console.log("creating a student :: ", data);
      const userRes = await fetch("/api/register/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.full_name,
          email: data.student_email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          role: "student",
        }),
      });

      if (!userRes.ok) {
        // If not, read the error message from the response body
        const errorData = await userRes.json();
        // Throw a new error with the message from the server
        throw new Error(errorData.message || "Failed to create user");
      }
      const newUser = await userRes.json();
      const userId = newUser.id;

      // 2. Then create the student using user_id
      const studentRes = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          user_id: userId,
          school_id: 1, // hardcoded or dynamic
          admission_date: "2024-06-01", // hardcoded or dynamic
        }),
      });

      if (!studentRes.ok) throw new Error("Failed to create student");
      await fetchStudents(); // refresh student list
    } catch (error) {
      console.error("Error creating student:", error);
      throw error;
    }
  };

  //fetch students

  //onsubmit handle
  const onSubmit = async (data: StudentFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingStudent) {
        console.log("editing student ::", data);
        const res = await fetch(`/api/students/${editingStudent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update student");
      } else {
        await createStudent(data);
      }

      toast({
        title: "Success",
        description: editingStudent ? "Student updated" : "Student added",
      });

      setIsDialogOpen(false);
      await fetchStudents();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setEditingStudent(null);
    }
    setIsDialogOpen(open);
  };

  const openEditDialog = (student: StudentItem) => {
    setEditingStudent(student);
    const classfind = classData.find((cls) => cls.id === student.class_id);

    form.reset({
      full_name: student.full_name,
      student_email: student.student_email,
      gender: student.gender as "male" | "female" | "other",
      dob: student.dob,
      class_id: student?.class_id || undefined,
      parent_contact: student.parent_contact,
      admissionDate: student.admissionDate,
      parent_name: student.parent_name,
      status: student.status,
      password: "", // Or dummy password
    });
    setIsDialogOpen(true);
  };

  //handle student status
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

  // Handle delete
  const handleDelete = (id: number) => {
    setStudentToDelete(id);
    setIsDeleteModalOpen(true);
  };

  //confirm delete of student
  const confirmDelete = async () => {
    if (!studentToDelete) return;

    try {
      const response = await fetch(`/api/students/${studentToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Error",
            description: "Student not found",
            variant: "destructive",
          });
        } else {
          throw new Error("Failed to delete student");
        }
        return;
      }

      // ✅ Instead of setStudentData, simply refetch students from server
      await fetchStudents();

      toast({
        title: "Success",
        description: "Student removed successfully",
      });

      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the student",
        variant: "destructive",
      });
    }
  };

  // DataTable columns
  const columns: DataTableColumn<StudentItem>[] = [
    {
      header: "Name",
      accessorKey: "full_name",
    },
    {
      header: "student email",
      accessorKey: "student_email",
    },
    {
      header: "Class",
      accessorKey: "class_id", // just to satisfy the type requirement
      cell: (student: StudentItem) => {
        const classItem = classData.find((cls) => cls.id === student.class_id);
        return classItem
          ? `Class ${classItem.grade} ${classItem.section}`
          : "Class not found";
      },
    },

    {
      header: "Gender",
      accessorKey: "gender",
      cell: (student: StudentItem) => (
        <span className="capitalize">{student.gender}</span>
      ),
    },
    {
      header: "Date of Birth",
      accessorKey: "dob",

      cell: (student: StudentItem) => {
        const date = new Date(student.dob);
        return isNaN(date.getTime()) ? "-" : format(date, "PPP");
      },
    },
    {
      header: "Parent Contact",
      accessorKey: "parent_contact",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (student) => (
        <button
          onClick={() => handleToggleStatus(student)} // define this function in your component
          className={`text-sm px-2 py-1 rounded ${
            student.status === "Active" ? "bg-green-200" : "bg-red-200"
          }`}
        >
          {student.status === "Active" ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (student: StudentItem) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(student)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(student.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filteredStudents = studentData.filter((student) => {
    const matchesSearchTerm = student.full_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const studentClass = classData.find((cls) => cls.id === student.class_id);

    const matchesGrade = selectedGrade
      ? studentClass?.grade.toString() === selectedGrade
      : true;
    const matchesSection = selectedSection
      ? studentClass?.section.toLowerCase() === selectedSection.toLowerCase()
      : true;

    return matchesSearchTerm && matchesGrade && matchesSection;
  });

  const grades = Array.from(new Set(filteredStudents.map((student) => {
    const studentClass = classData.find((cls) => cls.id === student.class_id);
    return studentClass?.grade;
  }).filter(Boolean))).sort(
    (a, b) => a - b
  );
  const sections = Array.from(
    new Set(filteredStudents.map((student) => {
      const studentClass = classData.find((cls) => cls.id === student.class_id);
      return studentClass?.section;
    }).filter(Boolean))
  ).sort();

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Student List</h2>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          {user?.role == "school_admin" && (
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
          )}

          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>
                    {editingStudent ? "Edit Student" : "Add New Student"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingStudent
                      ? "Update the student's information"
                      : "Fill in the details to add a new student"}
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="grid gap-4 py-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="student_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student Email </FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="pl-3 text-left font-normal"
                                >
                                  {field.value &&
                                  !isNaN(new Date(field.value).getTime()) ? (
                                    format(new Date(field.value), "PP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0 bg-white rounded-lg shadow-lg border border-gray-200"
                              align="start"
                            >
                              <div className="p-4">
                                {" "}
                                {/* Tailwind padding container */}
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  captionLayout="dropdown-buttons" // Modified
                                  fromYear={1950}
                                  toYear={new Date().getFullYear()}
                                  initialFocus
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="class_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(Number(value))
                            } // 👈 convert string to number here
                            value={field.value?.toString()} // 👈 show number as string for Select to understand
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classData.map((cls) => (
                                <SelectItem
                                  key={cls.id}
                                  value={cls.id.toString()}
                                >
                                  Class {cls.grade} {cls.section}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parent_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent name</FormLabel>
                          <FormControl>
                            <Input placeholder="Parent name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="parent_contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent Contact</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Parent phone number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="admissionDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Admission Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className="pl-3 text-left font-normal"
                                >
                                  {field.value instanceof Date &&
                                  !isNaN(field.value.getTime())
                                    ? format(field.value, "PP")
                                    : "Pick a date"}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date: Date) =>
                                  date > new Date() ||
                                  date < new Date("2010-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </ScrollArea>
                <DialogFooter className="mt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Saving..."
                      : editingStudent
                      ? "Update Student"
                      : "Add Student"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex space-x-4 mb-4">
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select
          onValueChange={setSelectedGrade}
          value={selectedGrade}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {grades.map((grade) => (
              <SelectItem key={grade} value={grade.toString()}>
                Grade {grade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          onValueChange={setSelectedSection}
          value={selectedSection}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map((section) => (
              <SelectItem key={section} value={section}>
                Section {section}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filteredStudents}
        columns={columns}
        searchPlaceholder="Search students..."
        onSearch={(query) => {
          // Optional: implement search logic here if needed
        }}
      />

      {/* delete confirmation page */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this student? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
