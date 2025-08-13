import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  CalendarIcon,
  Edit2,
  Trash2,
  BookOpen,
  User,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolData } from "@/context/SchoolDataContext";
import type { Homework, InsertHomework } from "@shared/schema";
import { ConsoleLogWriter } from "drizzle-orm";

// Zod schema for the homework form
const homeworkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  class_id: z.coerce.number().min(1, "Class is required"),
  subject_id: z.coerce.number().min(1, "Subject is required"),
  assigned_date: z.string().min(1, "Assigned date is required"),
  due_date: z.string().min(1, "Due date is required"),
  instructions: z.string().optional(),
  attachment_url: z.string().url().optional().or(z.literal("")),
});

type HomeworkFormData = z.infer<typeof homeworkSchema>;

// FIX: Added type definitions to resolve 'implicit any' errors
interface ClassSubjectMapping {
  id: number;
  subject_id: number;
  teacher_id: number;
}

interface StudentInClass {
  user_id: number;
}

export default function HomeworkPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    classes,
    subjects,
    teachers,
    schoolData,
    loading: schoolDataLoading,
  } = useSchoolData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  console.log("checking homework::", schoolData);
  const form = useForm<HomeworkFormData>({
    resolver: zodResolver(homeworkSchema),
    defaultValues: {
      title: "",
      description: "",
      class_id: 0,
      subject_id: 0,
      assigned_date: new Date().toISOString().split("T")[0],
      due_date: "",
      instructions: "",
      attachment_url: "",
    },
  });

  // Fetch homework data
  const { data: homework = [], isLoading: homeworkLoading } = useQuery<
    Homework[]
  >({
    queryKey: ["homework", schoolData?.id],
    queryFn: async () => {
      const response = await fetch("/api/homework");
      if (!response.ok) throw new Error("Failed to fetch homework");
      return response.json();
    },
    enabled: !!user && !!schoolData?.id,
  });

  // FIX: Expanded mutation definitions to provide full type information to TypeScript

  // Create homework mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertHomework) => {
      const response = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create homework");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework", schoolData?.id] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Homework created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update homework mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<InsertHomework>;
    }) => {
      const response = await fetch(`/api/homework/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update homework");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework", schoolData?.id] });
      setIsDialogOpen(false);
      setEditingHomework(null);
      form.reset();
      toast({
        title: "Success",
        description: "Homework updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete homework mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/homework/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete homework");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework", schoolData?.id] });
      toast({
        title: "Success",
        description: "Homework deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: HomeworkFormData) => {
    // Find the teacher record to get the staff ID
    const teacher = teachers.find((t) => t.user_id === user?.id);

    const homeworkData: InsertHomework = {
      ...data,
      // Use the teacher's staff ID, not the user ID
      teacher_id: teacher?.id || 0,
      school_id: schoolData?.id || 0,
      status: "active",
    };
    console.log("checking homework", homeworkData);
    if (editingHomework) {
      updateMutation.mutate({ id: editingHomework.id, data: homeworkData });
    } else {
      createMutation.mutate(homeworkData);
    }
  };

  const openEditDialog = (hw: Homework) => {
    setEditingHomework(hw);
    form.reset({
      ...hw,
      instructions: hw.instructions || "",
      attachment_url: hw.attachment_url || "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingHomework(null);
    form.reset({
      title: "",
      description: "",
      class_id: 0,
      subject_id: 0,
      assigned_date: new Date().toISOString().split("T")[0],
      due_date: "",
      instructions: "",
      attachment_url: "",
    });
    setIsDialogOpen(true);
  };

  const currentTeacher = useMemo(
    () => teachers.find((t) => t.user_id === user?.id),
    [teachers, user]
  );

  // Memoized list of homework filtered by user role
  const filteredHomework = useMemo(() => {
    if (user?.role === "staff" && currentTeacher) {
      // A teacher sees homework they have created
      return homework.filter((hw) => hw.teacher_id === currentTeacher.id);
    }
    if (user?.role === "student") {
      const studentClassId = classes.find((c) =>
        c.students?.some((s: StudentInClass) => s.user_id === user.id)
      )?.id;
      return homework.filter((hw) => hw.class_id === studentClassId);
    }
    return homework; // Admins see all
  }, [homework, user, classes, currentTeacher]);

  const availableClasses = useMemo(() => {
    if (user?.role === "school_admin") {
      return classes;
    }
    if (user?.role === "staff") {
      if (!currentTeacher) return [];
      const assignedClassIds = new Set();
      classes.forEach((cls) => {
        if (
          cls.subjects?.some(
            (mapping: ClassSubjectMapping) =>
              mapping.teacher_id === currentTeacher.id
          )
        ) {
          assignedClassIds.add(cls.id);
        }
      });
      return classes.filter((cls) => assignedClassIds.has(cls.id));
    }
    return [];
  }, [classes, currentTeacher, user]);

  const availableSubjects = useMemo(() => {
    const selectedClassId = form.watch("class_id");
    if (!selectedClassId) return [];

    const selectedClass = classes.find((c) => c.id === Number(selectedClassId));
    if (!selectedClass?.subjects) return [];

    if (user?.role === "school_admin") {
      const subjectIdsInClass = new Set(
        selectedClass.subjects.map((m: ClassSubjectMapping) => m.subject_id)
      );
      return subjects.filter((s) => subjectIdsInClass.has(s.id));
    }

    if (user?.role === "staff") {
      if (!currentTeacher) return [];
      const taughtSubjectIds = new Set(
        selectedClass.subjects
          .filter(
            (mapping: ClassSubjectMapping) =>
              mapping.teacher_id === currentTeacher.id
          )
          .map((mapping: ClassSubjectMapping) => mapping.subject_id)
      );
      return subjects.filter((s) => taughtSubjectIds.has(s.id));
    }

    return [];
  }, [form.watch("class_id"), classes, subjects, currentTeacher, user]);

  const canCreateHomework =
    user?.role === "staff" || user?.role === "school_admin";
  const isLoading = homeworkLoading || schoolDataLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="Homework">
        <div className="p-8 text-center">Loading homework...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Homework Management">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Daily Homework</h1>
            <p className="text-muted-foreground mt-2">
              {canCreateHomework
                ? "Manage daily homework assignments for your subjects"
                : "View daily homework assignments for your class"}
            </p>
          </div>
          {canCreateHomework && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" /> Add Homework
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingHomework ? "Edit Homework" : "Add New Homework"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingHomework
                      ? "Update the homework assignment details."
                      : "Create a new homework assignment for students."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    {/* Form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Title, Class, Subject, and other fields... */}
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Chapter 5 Reading"
                                {...field}
                              />
                            </FormControl>
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
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue("subject_id", 0); // Reset subject
                              }}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableClasses.map((cls) => (
                                  <SelectItem
                                    key={cls.id}
                                    value={cls.id.toString()}
                                  >
                                    {cls.grade} {cls.section}
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
                        name="subject_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value?.toString()}
                              disabled={
                                !form.watch("class_id") ||
                                availableSubjects.length === 0
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a subject" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableSubjects.map((sub) => (
                                  <SelectItem
                                    key={sub.id}
                                    value={sub.id.toString()}
                                  >
                                    {sub.subject_name}
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
                        name="due_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the homework assignment..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="instructions"
                      render={({ field }) => (
                        <FormItem>
                          {" "}
                          <FormLabel>Instructions (Optional)</FormLabel>{" "}
                          <FormControl>
                            <Textarea
                              placeholder="Add any special instructions..."
                              {...field}
                            />
                          </FormControl>{" "}
                          <FormMessage />{" "}
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="attachment_url"
                      render={({ field }) => (
                        <FormItem>
                          {" "}
                          <FormLabel>Attachment URL (Optional)</FormLabel>{" "}
                          <FormControl>
                            <Input
                              placeholder="https://example.com/worksheet.pdf"
                              {...field}
                            />
                          </FormControl>{" "}
                          <FormMessage />{" "}
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          createMutation.isPending || updateMutation.isPending
                        }
                      >
                        {editingHomework
                          ? "Update Homework"
                          : "Create Homework"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Homework Cards */}
        <div className="grid gap-6">
          {filteredHomework.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Homework Found
                </h3>
                <p className="text-muted-foreground text-center">
                  {canCreateHomework
                    ? "Get started by creating your first homework assignment."
                    : "No homework has been assigned for your class yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredHomework.map((hw) => {
              const className = classes.find((c) => c.id === hw.class_id);
              const subjectName = subjects.find(
                (s) => s.id === hw.subject_id
              )?.name;
              return (
                <Card key={hw.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{hw.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {className
                            ? `${className.grade} ${className.section}`
                            : `Class ${hw.class_id}`}{" "}
                          | {subjectName || `Subject ${hw.subject_id}`}
                        </CardDescription>
                      </div>
                      {/* FIX: Correctly check if the logged-in teacher is the author */}
                      {canCreateHomework &&
                        hw.teacher_id === currentTeacher?.id && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(hw)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(hw.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {hw.description}
                    </p>
                    {hw.instructions && (
                      <div className="mb-4 p-3 bg-secondary rounded-md">
                        <h4 className="font-semibold text-sm mb-1">
                          Instructions:
                        </h4>
                        <p className="text-sm text-secondary-foreground">
                          {hw.instructions}
                        </p>
                      </div>
                    )}
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon className="h-4 w-4" /> Due:{" "}
                          {new Date(hw.due_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User className="h-4 w-4" /> By:{" "}
                          {teachers.find((t) => t.id === hw.teacher_id)
                            ?.full_name || "N/A"}
                        </span>
                      </div>
                      {hw.attachment_url && (
                        <Button variant="link" asChild>
                          <a
                            href={hw.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Attachment
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
