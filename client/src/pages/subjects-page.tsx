import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/layout/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Edit, PlusCircle, Trash } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SubjectItem, StaffItem, ClassItem } from "./type";
import { useSchoolData } from "@/context/SchoolDataContext";
import { Redirect } from "wouter";

// Subject form schema
const subjectFormSchema = z.object({
  subject_name: z.string().min(2, "Subject name must be at least 2 characters"),
  subject_description: z.string().optional(),
});

type SubjectFormValues = z.infer<typeof subjectFormSchema>;

export default function SubjectsPage() {
  const { user } = useAuth();
  const { subjects, teachers, classes, loading, schoolData, refetchData } =
    useSchoolData();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | undefined>(
    undefined
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<number | null>(null);

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      subject_name: "",
      subject_description: "",
    },
  });

  const { subjectData, high, medium, low } = useMemo(() => {
    // Return default data if the source arrays aren't ready yet
    if (!subjects.length || !teachers.length || !classes.length) {
      const data = subjects.map((s: SubjectItem) => ({
        ...s,
        teachers: 0,
        classCount: 0,
        classNames: [],
      }));
      return { subjectData: data, high: [], medium: [], low: data };
    }

    // --- New, reliable calculation logic using class-subject mappings ---
    const teacherIdsBySubjectId: Record<number, Set<number>> = {};
    const classInfoBySubjectId: Record<
      number,
      { count: number; names: string[] }
    > = {};

    // Iterate through all classes and their subject mappings
    classes.forEach((cls: ClassItem) => {
      const className = `Class ${cls.grade} ${cls.section}`;
      (cls.subjects || []).forEach(
        (mapping: { subject_id: number; teacher_id: number | null }) => {
          const { subject_id, teacher_id } = mapping;

          // Aggregate unique teacher IDs for each subject
          if (teacher_id) {
            if (!teacherIdsBySubjectId[subject_id]) {
              teacherIdsBySubjectId[subject_id] = new Set();
            }
            teacherIdsBySubjectId[subject_id].add(teacher_id);
          }

          // Aggregate class counts and names for each subject
          if (!classInfoBySubjectId[subject_id]) {
            classInfoBySubjectId[subject_id] = { count: 0, names: [] };
          }
          classInfoBySubjectId[subject_id].count += 1;
          classInfoBySubjectId[subject_id].names.push(className);
        }
      );
    });
    // --- End of new logic ---

    // Map the aggregated data to each subject
    const data = subjects.map((subject) => ({
      ...subject,
      // Get the count of unique teachers from the Set size
      teachers: teacherIdsBySubjectId[subject.id]?.size || 0,
      classCount: classInfoBySubjectId[subject.id]?.count || 0,
      classNames: classInfoBySubjectId[subject.id]?.names || [],
    }));

    // The rest of the logic remains the same
    const high = data.filter((s) => s.teachers >= 5);
    const medium = data.filter((s) => s.teachers >= 3 && s.teachers < 5);
    const low = data.filter((s) => s.teachers < 3);

    return { subjectData: data, high, medium, low };
  }, [subjects, teachers, classes]); // Add 'classes' to the dependency array

  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return subjectData;
    }
    return subjectData.filter((subject) =>
      subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subjectData, searchTerm]);

  const openEditDialog = (subject?: SubjectData) => {
    if (subject) {
      setEditingSubject(subject);
      form.reset({
        subject_name: subject.subject_name,
        subject_description: subject.subject_description,
      });
    } else {
      setEditingSubject(undefined);
      form.reset({
        subject_name: "",
        subject_description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setEditingSubject(undefined);
    }
    setIsDialogOpen(open);
  };
  const openAddDialog = () => {
    setEditingSubject(undefined); // Clear any previous editing state
    form.reset({ subject_name: "", subject_description: "" }); // Reset the form to be blank
    setIsDialogOpen(true); // Open the dialog
  };
  const onSubmit = async (values: SubjectFormValues) => {
    try {
      setIsSubmitting(true);
      const url = editingSubject
        ? `/api/subjects/${editingSubject.id}`
        : "/api/subjects";
      const method = editingSubject ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          schoolId: schoolData?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save subject");
      }

      toast({
        title: "Success",
        description: `Subject successfully ${
          editingSubject ? "updated" : "created"
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
    setSubjectToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (subjectToDelete) {
      try {
        const response = await fetch(`/api/subjects/${subjectToDelete}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete subject");
        }

        toast({
          title: "Success",
          description: "Subject successfully deleted.",
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

  type SubjectData = (typeof subjectData)[0];

  const columns = [
    {
      header: "Subject Name",
      accessorKey: "subject_name",
    },
    {
      header: "Description",
      accessorKey: "subject_description",
      cell: (subject: SubjectData) => (
        <span className="text-sm text-gray-600">
          {subject.subject_description || "N/A"}
        </span>
      ),
    },
    {
      header: "Teachers",
      accessorKey: "teachers",
      cell: (subject: SubjectData) => (
        <Badge variant="outline">{subject.teachers} teachers</Badge>
      ),
    },
    {
      header: "Classes",
      accessorKey: "classCount",
      cell: (subject: SubjectData) => (
        <div className="flex items-center gap-2 max-w-xs">
          {subject.classCount > 0 ? (
            <>
              <Badge>{subject.classCount} classes</Badge>
              <span
                className="text-xs text-gray-500 truncate"
                title={subject.classNames.join(", ")}
              >
                {subject.classNames.join(", ")}
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-500">Not assigned</span>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (subject: SubjectData) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(subject)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(subject.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Subject Management">
        <div className="container py-6">Loading...</div>
      </DashboardLayout>
    );
  }

  if (user?.role !== "school_admin" && user?.role !== "staff") {
    toast({
      title: "Access Denied",
      description: "You do not have permission to view this page.",
      variant: "destructive",
    });
    return <Redirect to="/dashboard" />;
  }

  return (
    <DashboardLayout title="Subject Management">
      <div className="container py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Total Subjects</CardTitle>
              <CardDescription>Offered in curriculum</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{subjects.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Total Teachers</CardTitle>
              <CardDescription>Across all subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {subjectData.reduce(
                  (sum: number, subject: { teachers: number }) =>
                    sum + subject.teachers,
                  0
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Class Coverage</CardTitle>
              <CardDescription>Subject-class mappings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {subjectData.reduce(
                  (sum: number, subject: { classCount: number }) =>
                    sum + subject.classCount,
                  0
                )}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Subject Distribution by Teacher Allocation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <BookOpen className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="font-medium">Well Staffed (5+ teachers)</h3>
              </div>
              <p className="text-2xl font-bold text-green-500">
                {high.length} subjects
              </p>
              <div className="mt-2 text-sm text-muted-foreground">
                {high
                  .map((s: { subject_name: string }) => s.subject_name)
                  .join(", ")}
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <BookOpen className="h-5 w-5 text-amber-500 mr-2" />
                <h3 className="font-medium">Adequate (3-4 teachers)</h3>
              </div>
              <p className="text-2xl font-bold text-amber-500">
                {medium.length} subjects
              </p>
              <div className="mt-2 text-sm text-muted-foreground">
                {medium
                  .map((s: { subject_name: string }) => s.subject_name)
                  .join(", ")}
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <BookOpen className="h-5 w-5 text-red-500 mr-2" />
                <h3 className="font-medium">Understaffed ({"<"}3 teachers)</h3>
              </div>
              <p className="text-2xl font-bold text-red-500">
                {low.length} subjects
              </p>
              <div className="mt-2 text-sm text-muted-foreground">
                {low
                  .map((s: { subject_name: string }) => s.subject_name)
                  .join(", ")}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Subject List</h2>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingSubject ? "Edit Subject" : "Add New Subject"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingSubject
                          ? "Update the subject information"
                          : "Fill in the details to add a new subject"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <FormField
                        control={form.control}
                        name="subject_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter Subject name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="subject_description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Brief description of the subject"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                          ? "Saving..."
                          : editingSubject
                          ? "Update Subject"
                          : "Add Subject"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <DataTable
            data={filteredData}
            columns={columns}
            searchPlaceholder="Search subjects..."
            onSearch={setSearchTerm}
          />
        </div>
      </div>
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this subject? This action cannot
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
    </DashboardLayout>
  );
}
