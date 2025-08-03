import { useEffect, useState } from "react";
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
// Note: Assuming type.ts is in the same directory and contains the following:
// export type SubjectItem = {
//   id: number;
//   school_id: number;
//   subject_name: string;
//   subject_description: string;
// };
import { SubjectItem } from "./type";

// Subject form schema
const subjectFormSchema = z.object({
  subject_name: z.string().min(2, "Subject name must be at least 2 characters"),
  subject_description: z.string().optional(),
});

type SubjectFormValues = z.infer<typeof subjectFormSchema>;

/**
 * Subjects management page component
 * Allows school admins to manage subjects and their assignments
 */
export default function SubjectsPage() {
  const { user } = useAuth();
  const [schoolData, setSchoolData] = useState<any | null>(null);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjectData, setSubjectData] = useState<SubjectItem[]>([]);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | undefined>(
    undefined
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<number | null>(null);

  // Initialize form
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      subject_name: "",
      subject_description: "",
    },
  });

  // Fetch school by admin email
  const fetchSchool = async () => {
    try {
      if (user?.role === "school_admin" && user.email) {
        console.log("Fetching school by user email");
        const res = await fetch(`/api/school/${user.email}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch school");
        }
        const data = await res.json();
        setSchoolData(data);
      }
    } catch (error) {
      console.error("School fetch error:", error);
      toast({
        title: "Error",
        description: "Failed to load school data.",
        variant: "destructive",
      });
    }
  };

  // Fetch subjects by school ID
  const fetchSubjects = async () => {
    if (!schoolData?.id) return;

    try {
      console.log("Fetching subjects for school:", schoolData.id);
      const res = await fetch(`/api/schools/${schoolData.id}/subjects`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch subjects");
      }
      const data = await res.json();
      setSubjectData(data);
    } catch (error) {
      console.error("Subjects fetch error:", error);
      toast({
        title: "Error",
        description: "Failed to load subjects list.",
        variant: "destructive",
      });
    }
  };

  // Set form values when editing
  const openEditDialog = (subject?: SubjectItem) => {
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

  // Reset form when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setEditingSubject(undefined);
    }
    setIsDialogOpen(open);
  };

  // Create a subject
  const createSubject = async (data: {
    school_id: number;
    subject_name: string;
    subject_description: string;
  }) => {
    console.log("creating subject:: ", data);
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "school_admin",
        school_id: data.school_id,
        subject_name: data.subject_name,
        subject_description: data.subject_description,
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Failed to create subject");
    }

    return res.json();
  };

  // Update a subject
  const updateSubject = async (
    id: number,
    data: { subject_name: string; subject_description: string }
  ) => {
    const res = await fetch(`/api/subjects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Failed to update subject");
    }

    return res.json();
  };

  // Delete a subject
  const deleteSubject = async (id: number) => {
    const res = await fetch(`/api/subjects/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to delete subject");
    }
  };

  // Handle form submission for creating/editing subjects
  const onSubmit = async (values: SubjectFormValues) => {
    try {
      setIsSubmitting(true);
      if (!schoolData) {
        throw new Error("School data not available. Please refresh.");
      }

      if (editingSubject) {
        await updateSubject(editingSubject.id, {
          subject_name: values.subject_name,
          subject_description: values.subject_description || "",
        });
        toast({
          title: "Success",
          description: "Subject updated successfully!",
        });
      } else {
        await createSubject({
          subject_name: values.subject_name,
          subject_description: values.subject_description || "",
          school_id: schoolData.id,
        });
        toast({
          title: "Success",
          description: "New subject created successfully!",
        });
      }

      form.reset();
      setIsDialogOpen(false);
      setEditingSubject(undefined);
      await fetchSubjects();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle subject deletion
  const handleDelete = (id: number) => {
    setSubjectToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (subjectToDelete !== null) {
      try {
        await deleteSubject(subjectToDelete);
        toast({
          title: "Success",
          description: "The subject has been removed successfully.",
        });
        await fetchSubjects();
      } catch (error: any) {
        console.error("Delete error:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete subject.",
          variant: "destructive",
        });
      } finally {
        setIsDeleteModalOpen(false);
        setSubjectToDelete(null);
      }
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchSchool();
  }, [user]);

  useEffect(() => {
    if (schoolData?.id) {
      fetchSubjects();
    }
  }, [schoolData]);

  // DataTable columns configuration
  const columns = [
    {
      header: "Subject Name",
      accessorKey: "subject_name",
    },
    {
      header: "Description",
      accessorKey: "subject_description",
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row: any) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // The categorizeSubjects logic below is based on the old dummy data
  // and needs to be updated to match the new SubjectItem type.
  // For now, I'll remove the code that uses it, as it will cause errors.
  // When you have a full API for subject-teacher relationships, this can be re-implemented.
  const categorizedSubjects = {
    high: [],
    medium: [],
    low: [],
  };

  return (
    <DashboardLayout title="Subject Management">
      <div className="container py-6">
        {/* Stats Cards - Removed old logic for now */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Total Subjects</CardTitle>
              <CardDescription>Offered in curriculum</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{subjectData.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Total Teachers</CardTitle>
              <CardDescription>Across all subjects</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder until subject-teacher data is available */}
              <p className="text-3xl font-bold">...</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Class Coverage</CardTitle>
              <CardDescription>Subject-class mappings</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder until subject-class data is available */}
              <p className="text-3xl font-bold">...</p>
            </CardContent>
          </Card>
        </div>

        {/* Subject Distribution - Removed for now as data structure changed */}
        {/*
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Subject Distribution by Teacher Allocation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <BookOpen className="h-5 w-5 text-success mr-2" />
                <h3 className="font-medium">Well Staffed (5+ teachers)</h3>
              </div>
              <p className="text-2xl font-bold text-success">
                {categorizedSubjects.high.length} subjects
              </p>
              <div className="mt-2 text-sm text-muted-foreground">
                {categorizedSubjects.high.map((s) => s.name).join(", ")}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <BookOpen className="h-5 w-5 text-amber-500 mr-2" />
                <h3 className="font-medium">Adequate (3-4 teachers)</h3>
              </div>
              <p className="text-2xl font-bold text-amber-500">
                {categorizedSubjects.medium.length} subjects
              </p>
              <div className="mt-2 text-sm text-muted-foreground">
                {categorizedSubjects.medium.map((s) => s.name).join(", ")}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <BookOpen className="h-5 w-5 text-destructive mr-2" />
                <h3 className="font-medium">Understaffed (<3 teachers)</h3>
              </div>
              <p className="text-2xl font-bold text-destructive">
                {categorizedSubjects.low.length} subjects
              </p>
              <div className="mt-2 text-sm text-muted-foreground">
                {categorizedSubjects.low.map((s) => s.name).join(", ")}
              </div>
            </div>
          </div>
        </div>
        */}

        {/* Subjects Table with Add Subject Button */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Subject List</h2>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button>
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
                              <Input placeholder="Mathematics" {...field} />
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
            data={subjectData}
            columns={columns}
            searchPlaceholder="Search subjects..."
            onSearch={(query) => {
              // Implement search logic in a real app
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
              Are you sure you want to remove this subject? This action cannot
              be undone and may affect class schedules.
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
