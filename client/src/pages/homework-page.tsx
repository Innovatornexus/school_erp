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
  CardFooter,
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
  Users,
  BookOpen,
  User,
  ClipboardList,
  Eye,
  Paperclip,
  Trash,
  Edit,
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
  classId: z.coerce.number().min(1, "Class is required"),
  subjectId: z.coerce.number().min(1, "Subject is required"),
  assignedDate: z.string().min(1, "Assigned date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  instructions: z.string().optional(),
  attachmentUrl: z.string().url().optional().or(z.literal("")),
});

type HomeworkFormData = z.infer<typeof homeworkSchema>;

// FIX: Added type definitions to resolve 'implicit any' errors
interface ClassSubjectMapping {
  id: number;
  subjectId: number;
  teacherId: number;
}

interface StudentInClass {
  userId: number;
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
      classId: 0,
      subjectId: 0,
      assignedDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      instructions: "",
      attachmentUrl: "",
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
      if (!schoolData?.id || !user?.id) {
        throw new Error("User or School information is missing.");
      }
      // ✅ find selected class and subject
      const selectedClass = (classes as any[]).find(
        (cls) => cls.id === data.class_id
      );
      const selectedSubject = (subjects as any[]).find(
        (sub) => sub.id === data.subject_id
      );
      const response = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          teacher_id: user.id,
          teacher_name: user.name,
          school_id: schoolData.id,
          // ✅ build names properly
          class_name: `${selectedClass.grade} - ${selectedClass.section}`,
          subject_name: selectedSubject.subject_name,
        }),
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

    let homeworkData: InsertHomework;

    if (user?.role === "school_admin") {
      homeworkData = {
        ...data,
        teacher_id: user?.id || 0, // school admin assigns directly
        school_id: schoolData?.id || 0,
        status: "active",
      };
    } else {
      homeworkData = {
        ...data,
        teacher_id: teacher?.id || 0, // teacher’s staff ID
        school_id: schoolData?.id || 0,
        status: "active",
      };
    }

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
                        name="subject_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(Number(value))
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(subjects as any[]).map((subject: any) => (
                                  <SelectItem
                                    key={subject.id}
                                    value={subject.id.toString()}
                                  >
                                    {subject.subject_name}
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
                        name="class_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(Number(value))
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(classes as any[]).map((cls: any) => (
                                  <SelectItem
                                    key={cls.id}
                                    value={cls.id.toString()}
                                  >
                                    {cls.grade} - {cls.section}
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

        {/* Main container with conditional rendering for loading state */}
        {isLoading ? (
          // Skeleton loader shown while data is fetching
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="flex justify-between items-center pt-4">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Main content grid when data is loaded
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(homework as any[]).map((hw: any) => (
                <Card
                  key={hw.id}
                  className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 bg-gradient-to-br from-white to-gray-50 flex flex-col"
                >
                  <CardHeader className="pb-4">
                    {/* Header with Title */}
                    <div className="flex justify-between items-center rounded-lg border border-gray-300 bg-blue-700 px-3 py-2">
                      <CardTitle className="text-lg font-semibold text-white tracking-tight">
                        {hw.title}
                      </CardTitle>
                    </div>

                    {/* Description inside outlined box */}
                    <div className="mt-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
                      <CardDescription className="text-gray-700 text-sm">
                        {hw.description}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  {/* Content Section */}
                  <CardContent className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center">
                      <BookOpen className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>
                        <strong>Subject:</strong> {hw.subject_name || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>
                        <strong>Class:</strong> {hw.class_name || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>
                        <strong>Due Date:</strong>{" "}
                        {new Date(hw.due_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>
                        <strong>Assigned By:</strong> {hw.teacher_name || "N/A"}
                      </span>
                    </div>

                    {hw.attachment_url && (
                      <div className="flex items-center">
                        <Paperclip className="mr-2 h-4 w-4 text-indigo-500" />
                        <a
                          href={hw.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          View Attachment
                        </a>
                      </div>
                    )}

                    <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                      <span>
                        Assigned on{" "}
                        {new Date(
                          hw.created_at || Date.now()
                        ).toLocaleDateString()}
                      </span>

                      {/* Action buttons */}
                      {(user?.role === "school_admin" ||
                        user?.id === hw.teacher_id) && (
                        <div className="mt-4 flex justify-end gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                            onClick={() => openEditDialog(hw)}
                          >
                            <Edit className="h-4 w-4" /> Edit
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => deleteMutation.mutate(hw.id)}
                          >
                            <Trash className="h-4 w-4" /> Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty state card when no homework is found */}
            {!isLoading && (homework as any[]).length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    No Homework Found
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    It looks like there's no homework assigned yet. If you're a
                    teacher, you can assign some now.
                  </p>
                  {canCreateHomework && (
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Assign Homework
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
