import { useEffect, useMemo, useState } from "react";
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
import { BookOpen, Edit, PlusCircle, Search, Trash } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SubjectItem } from "./type";
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
  const { subjects, loading, schoolData, refetchData } = useSchoolData();
  // Inside the SubjectsPage component, with other useState hooks
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
  // Inside the SubjectsPage component, before the columns definition

  const filteredSubjects = useMemo(() => {
    if (!searchTerm) {
      return subjects; // Return all subjects if search is empty
    }

    return subjects.filter((subject) =>
      subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subjects, searchTerm]); // Dependencies for the memo
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

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setEditingSubject(undefined);
    }
    setIsDialogOpen(open);
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
          school_id: schoolData.id,
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

  if (loading) {
    return (
      <DashboardLayout title="Subject Management">
        <div className="container py-6">Loading...</div>
      </DashboardLayout>
    );
  }

  // Redirect if not school_admin or staff
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
        {/* Stats Cards */}
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
          {/* ... (other stats cards) */}
        </div>

        {/* Subjects Table with Add Subject Button */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Subject List</h2>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              {user?.role === "school_admin" && (
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Subject
                  </Button>
                </DialogTrigger>
              )}
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
                                placeholder="e.g., Study of numbers, shapes, and patterns"
                                {...field}
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

          {/* NEW: Add the Search Input field */}
          <div className="flex items-center py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by subject name..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="max-w-sm pl-10"
              />
            </div>
          </div>

          <DataTable
            data={filteredSubjects} // <-- USE the new filtered list here
            columns={columns}
            searchPlaceholder="Search subjects..."
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
