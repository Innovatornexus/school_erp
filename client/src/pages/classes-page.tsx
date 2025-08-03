import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast, useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import DashboardLayout from "@/layout/dashboard-layout";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, FolderPlus, Trash, Users } from "lucide-react";
import { storage } from "server/storage";
import { useAuth } from "@/hooks/use-auth";
import { messages } from "@shared/schema";
import { ClassItem, SchoolItem, StaffItem } from "./type";

// Class form schema
const formSchema = z.object({
  grade: z.string().min(1, "Grade is required"),
  section: z.string().min(1, "Section is required"),
  class_teacher_id: z.number().optional(), // optional if needed
});

// Sample teachers for dropdown

/**
 * Classes management page component
 * Allows school admins to manage class structures
 */
export default function ClassesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classData, setClassData] = useState<ClassItem[]>([]);
  const [schoolData, setSchoolData] = useState<SchoolItem | null>(null);

  const [editingClass, setEditingClass] = useState<ClassItem | undefined>(
    undefined
  );

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<number | null>(null);
  const [staffData, setStaffData] = useState<StaffItem[]>([]);
  const [class_name, setClassName] = useState("");

  //initialise form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grade: "",
      section: "",
      class_teacher_id: undefined,
    },
  });
  const fetchStaff = async () => {
    try {
      if (user?.role === "staff") {
        console.log("fetching staff detail");
        const res = await fetch(`/api/Teachers/${user?.email}/staff`);
        if (!res.ok) throw new Error("Failed to fetch staff");
        const data = await res.json();
        console.log("staff datas::", data);
        setStaffData(data);
      } else if (user?.role === "school_admin") {
        console.log(
          "fetching staff details as admin , schooldata id",
          schoolData?.id
        );
        const res = await fetch(`/api/schools/${schoolData?.id}/teachers`);
        if (!res.ok) throw new Error("Failed to fetch staff");
        const data = await res.json();
        console.log("staff datas::", data);
        setStaffData(data);
      }
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
        //staffData[0]?.school_id because staffData is an array, not a direct object.

        // Arrays don't have a property like school_id; individual elements inside the array have that.

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
      console.log("fetching class for school:", schoolData);
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

  if (user?.role === "staff") {
    //fetcch staff first
    useEffect(() => {
      fetchStaff();
    }, []);
    //using the schoolid from staff fetch school
    useEffect(() => {
      console.log("staff data changed, fetching school");
      if (staffData.length > 0) {
        fetchSchool();
      }
    }, [staffData]);
  } else {
    //fetch school first by school id from admin

    useEffect(() => {
      fetchSchool();
    }, []);
    //fetch school by school id

    useEffect(() => {
      if (schoolData) {
        fetchStaff();
      }
    }, [schoolData]);
  }

  useEffect(() => {
    if (schoolData && staffData) {
      fetchClass();
    }
  }, [schoolData]);

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setEditingClass(undefined); // <== Important
    }
    setIsDialogOpen(open);
  };

  const openEditDialog = (classItem?: (typeof classData)[0]) => {
    if (classItem) {
      // Edit existing class
      setEditingClass(classItem);

      form.reset({
        grade: classItem.grade ?? "",
        section: classItem.section ?? "",
        class_teacher_id: classItem.class_teacher_id ?? undefined,
      });
    } else {
      // Create new class
      setEditingClass(undefined);

      form.reset({
        grade: "",
        section: "",
        class_teacher_id: undefined,
      });
    }

    setIsDialogOpen(true);
  };

  //create class
  const createClass = async (data: {
    grade: string;
    section: string;
    school_id: number;
    class_teacher_id?: number;
    class_teacher_name?: string;
  }) => {
    console.log("creating class:: ", data);
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw errData;
    }

    return res.json();
  };
  //update a class
  const updateClass = async (
    id: number,
    data: {
      grade: string;
      section: string;
      class_teacher_id?: number;
      class_teacher_name?: string;
    } // class_teacher_name is optional
  ) => {
    const res = await fetch(`/api/classes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw errData;
    }

    return res.json();
  };

  // Handle form submission for creating/editing classes
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true); // Optional: show spinner if needed

      if (editingClass) {
        await updateClass(editingClass.id, {
          grade: values.grade,
          section: values.section,
          class_teacher_id: values.class_teacher_id,
          class_teacher_name: staffData.find(
            (staff) => staff.id === values.class_teacher_id
          )?.full_name, // Get teacher name from staffData
        });
        toast({
          title: "Success",
          description: "Class updated successfully!",
        });
      } else {
        await createClass({
          grade: values.grade,
          section: values.section,
          school_id: schoolData?.id as number,
          class_teacher_id: values.class_teacher_id,
          class_teacher_name: staffData.find(
            (staff) => staff.id === values.class_teacher_id
          )?.full_name, // Get teacher name from staffData
        });
        toast({
          title: "Success",
          description: "New class created successfully!",
        });
      }

      form.reset();
      setIsDialogOpen(false);
      setEditingClass(undefined);
      await fetchClass(); // ✅ Refetch updated class list
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle class deletion
  const handleDelete = (id: number) => {
    setClassToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (classToDelete !== null) {
      try {
        const res = await fetch(`/api/classes/${classToDelete}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Delete failed");

        setClassData(classData.filter((cls) => cls.id !== classToDelete));
        toast({
          title: "Class Removed",
          description: "The class has been removed successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete class.",
          variant: "destructive",
        });
      } finally {
        setIsDeleteModalOpen(false);
        setClassToDelete(null);
      }
    }
  };

  // DataTable columns configuration
  const columns: DataTableColumn<ClassItem>[] = [
    {
      header: "Class",
      accessorKey: "id",
      cell: (classItem: ClassItem) => {
        // Return the formatted class name if class exists
        return `Class ${classItem.grade} ${classItem.section}`;
      },
    },

    {
      header: "Class Teacher",
      accessorKey: "class_teacher_id",
      cell: (classItem: ClassItem) => {
        if (Array.isArray(staffData)) {
          const teacher = staffData.find(
            (staff) => staff.id === classItem.class_teacher_id
          );
          return teacher?.full_name || "Unknown";
        } else {
          console.error("staffData is not an array", staffData);
          return "Unknown";
        }
      },
    },

    {
      header: "Students",
      accessorKey: "studentCount",
      cell: (cls: any) => (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          {cls.studentCount} students
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (cls: any) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(cls)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(cls.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Class Management">
      <div className="container py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Total Classes</CardTitle>
              <CardDescription>Active classes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{classData.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Total Students</CardTitle>
              <CardDescription>In all classes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {classData.reduce((sum, cls) => sum + cls.studentCount, 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Average Class Size</CardTitle>
              <CardDescription>Students per class</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {classData.length > 0
                  ? Math.round(
                      classData.reduce(
                        (sum, cls) => sum + cls.studentCount,
                        0
                      ) / classData.length
                    )
                  : 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Class Distribution by Grade */}
        <div className="bg-white p-6 rounded-lg shadow mb-6 h-auto">
          <h2 className="text-xl font-semibold mb-4">
            Class Distribution by Grade
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto">
            {Array.from(
              new Set(
                classData.map(
                  (cls) => cls.grade // No need for `.match(/\d+/)` if you store grade as string/number directly
                )
              )
            )
              .sort((a, b) => Number(a) - Number(b))
              .map((grade) => {
                const gradeClasses = classData.filter(
                  (cls) => cls.grade === grade
                );
                const totalStudents = gradeClasses.reduce(
                  (sum, cls) => sum + cls.studentCount,
                  0
                );

                return (
                  <div key={grade} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Grade {grade}</h3>
                      <Badge variant="outline">
                        {gradeClasses.length} classes
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">
                      {totalStudents} students
                    </p>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {gradeClasses.map((cls) => {
                        // Extract section from class name (e.g., "Class 8A" -> "A")
                        const section = cls.section;

                        return (
                          <div
                            key={cls.id}
                            className="flex justify-between p-2 my-1 bg-blue-50 rounded-md cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                            onClick={() =>
                              navigate(`/classes/${grade}/${section}`)
                            }
                          >
                            <span className="font-medium">
                              Class {cls.grade}
                              {cls.section}
                            </span>

                            <span>{cls.studentCount} students</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Classes Table with Add Class Button */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Class List</h2>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              {user?.role == "school_admin" && (
                <DialogTrigger asChild>
                  <Button>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Add Class
                  </Button>
                </DialogTrigger>
              )}
              <DialogContent className="sm:max-w-[500px]">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingClass ? "Edit Class" : "Add New Class"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingClass
                          ? "Update the class information"
                          : "Fill in the details to add a new class"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <FormField
                        control={form.control}
                        name="grade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grade</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select grade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[...Array(12)].map((_, i) => (
                                  <SelectItem
                                    key={i + 1}
                                    value={(i + 1).toString()}
                                  >
                                    Grade {i + 1}
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
                        name="section"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Section</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select section" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {["A", "B", "C", "D", "E", "F"].map(
                                  (section) => (
                                    <SelectItem key={section} value={section}>
                                      Section {section}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Class Teacher Field */}
                      <FormField
                        control={form.control}
                        name="class_teacher_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class Teacher</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(Number(value))
                              }
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select class teacher" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {staffData.map((staff) => (
                                  <SelectItem
                                    key={staff.id}
                                    value={staff.id.toString()}
                                  >
                                    {staff.full_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit">
                        {editingClass ? "Update Class" : "Create Class"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <DataTable
            data={classData}
            columns={columns}
            searchPlaceholder="Search classes..."
            onSearch={(query) => {
              console.log("Search query:", query);
              // Implement search logic in a real app
            }}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this class? This action cannot be
              undone.
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
    </DashboardLayout>
  );
}
