import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Redirect, useLocation } from "wouter";
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
import { Edit, FolderPlus, Trash } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ClassItem, StaffItem } from "./type";
import { useSchoolData } from "@/context/SchoolDataContext";

// Class form schema
const formSchema = z.object({
  grade: z.string().min(1, "Grade is required"),
  section: z.string().min(1, "Section is required"),
  class_teacher_id: z.coerce.number().optional().nullable(),
});

export default function ClassesPage() {
  const { user } = useAuth();
  const { classes, loading, schoolData, refetchData } = useSchoolData();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | undefined>(
    undefined
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grade: "",
      section: "",
      class_teacher_id: undefined,
    },
  });

  // Redirect if not school_admin or staff
  if (user?.role !== "school_admin" && user?.role !== "staff") {
    toast({
      title: "Access Denied",
      description: "You do not have permission to view this page.",
      variant: "destructive",
    });
    return <Redirect to="/dashboard" />;
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setEditingClass(undefined);
    }
    setIsDialogOpen(open);
  };

  const openEditDialog = (classItem?: ClassItem) => {
    if (classItem) {
      setEditingClass(classItem);
      form.reset({
        grade: classItem.grade ?? "",
        section: classItem.section ?? "",
        class_teacher_id: classItem.class_teacher_id ?? undefined,
      });
    } else {
      setEditingClass(undefined);
      form.reset({
        grade: "",
        section: "",
        class_teacher_id: undefined,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      const url = editingClass
        ? `/api/classes/${editingClass.id}`
        : "/api/classes";
      const method = editingClass ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          school_id: schoolData.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save class");
      }

      toast({
        title: "Success",
        description: `Class successfully ${
          editingClass ? "updated" : "created"
        }.`,
      });

      refetchData();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    setClassToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (classToDelete) {
      try {
        const response = await fetch(`/api/classes/${classToDelete}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete class");
        }

        toast({
          title: "Success",
          description: "Class successfully deleted.",
        });

        refetchData();
        setIsDeleteModalOpen(false);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    }
  };

  const columns: DataTableColumn<ClassItem>[] = [
    {
      header: "Class",
      accessorKey: "id",
      cell: (classItem: ClassItem) =>
        `Class ${classItem.grade} ${classItem.section}`,
    },
    {
      header: "Class Teacher",
      accessorKey: "class_teacher_id",
      cell: (classItem: ClassItem) => {
        const teacher = schoolData?.teachers?.find(
          (staff: StaffItem) => staff.id === classItem.class_teacher_id
        );
        return teacher?.full_name || "Unassigned";
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

  if (loading) {
    return (
      <DashboardLayout title="Class Management">
        <div className="container py-6">Loading...</div>
      </DashboardLayout>
    );
  }

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
              <p className="text-3xl font-bold">{classes.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Total Students</CardTitle>
              <CardDescription>In all classes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0)}
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
                {classes.length > 0
                  ? Math.round(
                      classes.reduce(
                        (sum, cls) => sum + (cls.studentCount || 0),
                        0
                      ) / classes.length
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
                classes.map(
                  (cls) => cls.grade
                )
              )
            )
              .sort((a, b) => Number(a) - Number(b))
              .map((grade) => {
                const gradeClasses = classes.filter(
                  (cls) => cls.grade === grade
                );
                const totalStudents = gradeClasses.reduce(
                  (sum, cls) => sum + (cls.studentCount || 0),
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
              {user?.role === "school_admin" && (
                <DialogTrigger asChild>
                  <Button onClick={() => openEditDialog()}>
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
                                {schoolData?.teachers?.map((staff: StaffItem) => (
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
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                          ? "Saving..."
                          : editingClass
                          ? "Update Class"
                          : "Create Class"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <DataTable
            data={
              user?.role === "staff"
                ? classes.filter((c) => c.class_teacher_id === user.id)
                : classes
            }
            columns={columns}
            searchPlaceholder="Search classes..."
            onSearch={(query) => {
              console.log("Search query:", query);
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