import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Search } from "lucide-react";
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
import { format } from "date-fns";
import { CalendarIcon, Edit, Trash, UserPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClassItem, StudentItem } from "./type";
import { useAuth } from "@/hooks/use-auth";

type Props = {
  studentData: StudentItem[];
  classData: ClassItem[];
  fetchStudents: () => Promise<void>;
};

// Student form schema aligned with DB schema (camelCase)
const studentFormSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    status: z.enum(["Active", "Inactive"], {required_error: "Please select a status"}),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters"),
    dateOfBirth: z.date({
      required_error: "Date of birth is required",
    }),
    gender: z.enum(["male", "female", "other"], {
      required_error: "Please select a gender",
    }),
    classId: z.string({
      required_error: "Please select a class",
    }),
    parentId: z.string().optional(),
    parentContact: z.string().min(10, "Please enter a valid contact number"),
    admissionDate: z.date({
      required_error: "Admission date is required",
    }),
    parentName: z.string().optional(),
    address: z.string().optional(),
    schoolId: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type StudentFormValues = z.infer<typeof studentFormSchema>;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      fullName: "",
      studentEmail: "",
      password: "",
      confirmPassword: "",
      gender: undefined, // Let placeholder show
      dob: undefined,
      classId: undefined,
      parentContact: "",
      admissionDate: new Date(),
      parentName: "",
      address: "",
      status: "Active",
    },
  });

  const createStudent = async (data: StudentFormValues) => {
    try {
      const userRes = await fetch("/api/register/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.fullName,
          email: data.studentEmail,
          password: data.password,
          confirmPassword: data.confirmPassword,
          role: "student",
        }),
      });

      if (!userRes.ok) {
        const errorData = await userRes.json();
        throw new Error(errorData.message || "Failed to create user");
      }
      const newUser = await userRes.json();
      const userId = newUser.id;

      const studentRes = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          userId: userId,
          schoolId: user?.schoolId,
          admissionDate: format(data.admissionDate, "yyyy-MM-dd"),
          dob: format(data.dob, "yyyy-MM-dd"),
        }),
      });

      if (!studentRes.ok) throw new Error("Failed to create student");
      await fetchStudents();
    } catch (error) {
      console.error("Error creating student:", error);
      throw error;
    }
  };

  const onSubmit = async (data: StudentFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingStudent) {
        const res = await fetch(`/api/students/${editingStudent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            dob: format(data.dob, "yyyy-MM-dd"),
            admissionDate: format(data.admissionDate, "yyyy-MM-dd"),
          }),
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
    form.reset({
      fullName: student.fullName,
      studentEmail: student.studentEmail,
      gender: student.gender as "male" | "female" | "other",
      dob: new Date(student.dob),
      classId: student.classId,
      parentContact: student.parentContact,
      admissionDate: new Date(student.admissionDate),
      parentName: student.parentName,
      status: student.status,
      password: "dummyPassword", // Set dummy passwords for validation
      confirmPassword: "dummyPassword",
    });
    setIsDialogOpen(true);
  };

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
      await fetchStudents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: number) => {
    setStudentToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      const response = await fetch(`/api/students/${studentToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete student");
      await fetchStudents();
      toast({ title: "Success", description: "Student removed successfully" });
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the student",
        variant: "destructive",
      });
    }
  };

  const columns: DataTableColumn<StudentItem>[] = [
    { header: "Roll No", accessorKey: "rollNo" },
    { header: "Name", accessorKey: "fullName" },
    {
      header: "Class",
      accessorKey: "classId",
      cell: (student: StudentItem) => {
        const classItem = classData.find((cls) => cls.id === student.classId);
        return classItem
          ? `Class ${classItem.grade} ${classItem.section}`
          : "N/A";
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
      cell: (student: StudentItem) => format(new Date(student.dob), "PPP"),
    },
    { header: "Parent Contact", accessorKey: "parentContact" },
    {
      header: "Status",
      accessorKey: "status",
      cell: (student) => (
        <button
          onClick={() => handleToggleStatus(student)}
          className={`text-sm px-2 py-1 rounded ${
            student.status === "Active"
              ? "bg-green-200 text-green-800"
              : "bg-red-200 text-red-800"
          }`}
        >
          {student.status}
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

  // FIX: Derive filter options from the complete 'classData' list, not the filtered students.
  const { grades, sections } = useMemo(() => {
    const uniqueGrades = [...new Set(classData.map((cls) => cls.grade))].sort(
      (a: any, b: any) => a - b
    );
    const uniqueSections = [
      ...new Set(classData.map((cls) => cls.section)),
    ].sort();
    return { grades: uniqueGrades, sections: uniqueSections };
  }, [classData]);

  const filteredStudents = useMemo(() => {
    return studentData.filter((student) => {
      const studentClass = classData.find((cls) => cls.id === student.classId);
      const matchesSearchTerm =
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade =
        !selectedGrade || studentClass?.grade.toString() === selectedGrade;
      const matchesSection =
        !selectedSection || studentClass?.section === selectedSection;
      return matchesSearchTerm && matchesGrade && matchesSection;
    });
  }, [studentData, classData, searchTerm, selectedGrade, selectedSection]);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Student List</h2>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          {user?.role === "school_admin" && (
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" /> Add Student
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
                      name="fullName"
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
                      name="studentEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="john.doe@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {!editingStudent && (
                      <>
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
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
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
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
                                <Input
                                  type="date"
                                  value={
                                    field.value
                                      ? format(field.value, "yyyy-MM-dd")
                                      : ""
                                  }
                                  onChange={(e) =>
                                    field.onChange(new Date(e.target.value))
                                  }
                                />
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            ></PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="classId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(Number(value))
                            }
                            value={field.value?.toString()}
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
                      name="parentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Parent name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="parentContact"
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
                                  {field.value
                                    ? format(field.value, "PPP")
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="max-w-sm pl-10"
          />
        </div>
        {/* FIX: Use the corrected onValueChange handler */}
        <Select
          onValueChange={(value) =>
            setSelectedGrade(value === "all" ? "" : value)
          }
          value={selectedGrade}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {grades.map((grade) => (
              <SelectItem key={grade} value={String(grade)}>
                Grade {grade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) =>
            setSelectedSection(value === "all" ? "" : value)
          }
          value={selectedSection}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map((section) =>
              section ? (
                <SelectItem key={section} value={section}>
                  Section {section}
                </SelectItem>
              ) : null
            )}
          </SelectContent>
        </Select>
      </div>
      <DataTable data={filteredStudents} columns={columns} />
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
