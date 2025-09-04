import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Calendar,
  BookOpen,
  Users,
  FileText,
  Clock,
  Award,
  Edit,
  Trash,
  Eye,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/layout/dashboard-layout";
import { useSchoolData } from "@/context/SchoolDataContext";

const examSubjectSchema = z.object({
  subject_id: z.number().min(1, "Subject is required"),
  exam_date: z.string().min(1, "Exam date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
});

const examFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  term: z.string().min(1, "Term is required"),
  class_id: z.number().min(1, "Class is required"),
  subjects: z
    .array(examSubjectSchema)
    .min(1, "At least one subject is required"),
});

export default function ExamsPage() {
  const { user } = useAuth();
  const {
    classes,
    subjects,
    schoolData,
    loading: schoolDataLoading,
  } = useSchoolData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [deleteExamId, setDeleteExamId] = useState<number | null>(null);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof examFormSchema>>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: "",
      term: "",
      class_id: 0,
      subjects: [],
    },
  });

  // Reset form when dialog opens for create mode
  useEffect(() => {
    if (isDialogOpen && !editingExam) {
      form.reset({
        title: "",
        term: "",
        class_id: 0,
        subjects: [],
      });
    }
  }, [isDialogOpen, editingExam, form]);

  // Reset editing state when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingExam(null);
    }
  }, [isDialogOpen]);

  // 2. Update useQuery to fetch exams by school ID using the new endpoint
  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["exams", schoolData?.id], // A more specific query key
    queryFn: async () => {
      const response = await fetch(`/api/schools/${schoolData.id}/exams`);
      if (!response.ok) {
        throw new Error("Failed to fetch exams");
      }
      return response.json();
    },
    enabled: !!schoolData?.id, // Only run the query when schoolData.id is available
  });

  // Create exam mutation with toast notifications
  const createExamMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!schoolData?.id) {
        throw new Error("School ID is not available.");
      }
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create exam");
      }
      return response.json();
    },
    // 3. Add toast notifications for success and error
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Exam scheduled successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["exams", schoolData?.id] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Update exam mutation
  const updateExamMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/exams/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update exam");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Exam updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["exams", schoolData?.id] });
      setIsDialogOpen(false);
      setEditingExam(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Delete exam mutation
  const deleteExamMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/exams/${id}`, {
        method: "DELETE",
      });

      // Handle non-successful HTTP responses (e.g., 404, 500)
      if (!response.ok) {
        // Try to parse error JSON, but have a fallback
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete exam");
        } catch (e) {
          throw new Error(`Failed to delete exam. Status: ${response.status}`);
        }
      }

      // ✨ FIX: Handle the '204 No Content' success case
      if (response.status === 204) {
        return true; // Or return null, or response; anything to signify success.
      }

      // If the API ever returns a body on successful DELETE (like a confirmation message)
      return response.json();
    },

    onSuccess: () => {
      // This will now be called correctly!
      toast({
        title: "Success!",
        description: "Exam deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["exams", schoolData?.id] });
      setDeleteExamId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: z.infer<typeof examFormSchema>) => {
    // Transform the data to match the API schema
    const transformedData = {
      title: data.title,
      term: data.term,
      class_id: data.class_id,
      class_name:
        classes.find((cls) => cls.id === data.class_id)?.grade +
        " - " +
        classes.find((cls) => cls.id === data.class_id)?.section,
      school_id: schoolData?.id || 0,
      // Calculate start_date and end_date from subjects
      start_date:
        data.subjects.length > 0
          ? data.subjects.reduce(
              (earliest, subject) =>
                subject.exam_date < earliest ? subject.exam_date : earliest,
              data.subjects[0].exam_date
            )
          : new Date().toISOString().split("T")[0],
      end_date:
        data.subjects.length > 0
          ? data.subjects.reduce(
              (latest, subject) =>
                subject.exam_date > latest ? subject.exam_date : latest,
              data.subjects[0].exam_date
            )
          : new Date().toISOString().split("T")[0],
      // Transform subjects array into separate arrays
      subject_ids: data.subjects.map((subject) => subject.subject_id),
      subject_names: data.subjects.map((subject) => ""), // Will be populated by backend
      subject_exam_dates: data.subjects.map((subject) => subject.exam_date),
      subject_exam_start_times: data.subjects.map(
        (subject) => subject.start_time
      ),
      subject_exam_end_times: data.subjects.map((subject) => subject.end_time),
    };

    if (editingExam) {
      updateExamMutation.mutate({ id: editingExam.id, data: transformedData });
    } else {
      createExamMutation.mutate(transformedData);
    }
  };

  const handleEdit = (exam: any) => {
    setEditingExam(exam);
    // Transform exam data back to form format
    // Convert the separate arrays back into subjects array
    const subjects =
      exam.subject_ids?.map((subjectId: number, index: number) => ({
        subject_id: subjectId,
        exam_date: exam.subject_exam_dates?.[index] || "",
        start_time: exam.subject_exam_start_times?.[index] || "",
        end_time: exam.subject_exam_end_times?.[index] || "",
      })) || [];

    const formData = {
      title: exam.title,
      term: exam.term,
      class_id: exam.class_id,
      subjects: subjects,
    };
    form.reset(formData);
    setIsDialogOpen(true);
  };

  const handleDelete = (examId: number) => {
    setDeleteExamId(examId);
  };

  const confirmDelete = () => {
    if (deleteExamId) {
      deleteExamMutation.mutate(deleteExamId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getExamStatusBadge = (startDate: string, endDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (today < start) {
      return <Badge variant="secondary">Upcoming</Badge>;
    } else if (today >= start && today <= end) {
      return <Badge variant="default">Ongoing</Badge>;
    } else {
      return <Badge variant="outline">Completed</Badge>;
    }
  };

  const getDaysUntilExam = (startDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isLoading = examsLoading || schoolDataLoading;

  return (
    <DashboardLayout title="Exams">
      {/* Add the Toaster component here or in your root layout */}
      {/* <Toaster richColors /> */}
      <div className="space-y-6">
        {/* ... The rest of the JSX remains largely the same ... */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Examinations</h1>
            <p className="text-muted-foreground">
              Manage exam schedules and track student performance
            </p>
          </div>

          {(user?.role === "school_admin" || user?.role === "staff") && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={schoolDataLoading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Exam
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>
                    {editingExam ? "Edit Exam" : "Schedule New Exam"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingExam
                      ? "Update the examination details."
                      : "Create a new examination period for students."}
                  </DialogDescription>
                </DialogHeader>

                {/* Scrollable form */}
                <div className="flex-1 overflow-y-auto pr-2">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleSubmit)}
                      className="space-y-4"
                    >
                      {/* Form fields are unchanged */}
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exam Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter exam title"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="term"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Term</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select term" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1st Term">
                                  1st Term
                                </SelectItem>
                                <SelectItem value="2nd Term">
                                  2nd Term
                                </SelectItem>
                                <SelectItem value="3rd Term">
                                  3rd Term
                                </SelectItem>
                                <SelectItem value="Mid-term">
                                  Mid-term
                                </SelectItem>
                                <SelectItem value="Final">Final</SelectItem>
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
                                {(classes || []).map((cls: any) => (
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

                      {/* Subjects Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base font-medium">
                            Exam Subjects
                          </FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentSubjects =
                                form.getValues("subjects");
                              form.setValue("subjects", [
                                ...currentSubjects,
                                {
                                  subject_id: 0,
                                  exam_date: "",
                                  start_time: "",
                                  end_time: "",
                                },
                              ]);
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Subject
                          </Button>
                        </div>

                        {form.watch("subjects").map((_, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">
                                Subject {index + 1}
                              </h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const currentSubjects =
                                    form.getValues("subjects");
                                  form.setValue(
                                    "subjects",
                                    currentSubjects.filter(
                                      (_, i) => i !== index
                                    )
                                  );
                                }}
                              >
                                Remove
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`subjects.${index}.subject_id`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <Select
                                      onValueChange={(value) =>
                                        field.onChange(Number(value))
                                      }
                                      value={String(field.value)}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select subject" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {(subjects || []).map(
                                          (subject: any) => (
                                            <SelectItem
                                              key={subject.id}
                                              value={String(subject.id)}
                                            >
                                              {subject.subject_name}
                                            </SelectItem>
                                          )
                                        )}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`subjects.${index}.exam_date`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Exam Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`subjects.${index}.start_time`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Time</FormLabel>
                                    <FormControl>
                                      <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`subjects.${index}.end_time`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>End Time</FormLabel>
                                    <FormControl>
                                      <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}

                        {form.watch("subjects").length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No subjects added yet. Click "Add Subject" to get
                            started.
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end space-x-2">
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
                            (createExamMutation.isPending ||
                              updateExamMutation.isPending) &&
                            !schoolData?.id
                          }
                        >
                          {createExamMutation.isPending ||
                          updateExamMutation.isPending
                            ? editingExam
                              ? "Updating..."
                              : "Scheduling..."
                            : editingExam
                            ? "Update Exam"
                            : "Schedule Exam"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* The rest of the component's rendering logic is unchanged */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(exams as any[]).map((exam: any) => (
              <Card
                key={exam.id}
                className="rounded-2xl  shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 bg-gradient-to-br from-white to-gray-50"
              >
                <CardHeader className="pb-4">
                  {/* Title */}
                  <div className="flex justify-between items-center rounded-lg border border-gray-300 bg-blue-700 px-3 py-2">
                    <CardTitle className="text-l font-semibold tracking-tight text-white">
                      {exam.title}
                    </CardTitle>
                  </div>

                  {/* Description inside outlined box */}
                  <div className="mt-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
                    <CardDescription className="text-gray-700 text-sm">
                      {exam.term} • Class {exam.class_name || "N/A"}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Badges row */}
                  <div className="flex justify-between items-center mb-3">
                    <Badge variant="secondary">{exam.term}</Badge>
                    {getExamStatusBadge(exam.start_date, exam.end_date)}
                  </div>

                  {/* Exam details */}
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>
                        <strong>Date:</strong> {formatDate(exam.start_date)} -{" "}
                        {formatDate(exam.end_date)}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>
                        <strong>Class:</strong> {exam.class_name || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <BookOpen className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>
                        <strong>Subjects:</strong>{" "}
                        {exam.subject_ids?.length || 0} subjects
                      </span>
                    </div>

                    {getDaysUntilExam(exam.start_date) > 0 && (
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-indigo-500" />
                        <span>
                          <strong>Days to start:</strong>{" "}
                          {getDaysUntilExam(exam.start_date)} days
                        </span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Eye className="mr-2 h-4 w-4 text-indigo-500" />
                      <a
                        href="#"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        View Result
                      </a>
                    </div>
                  </div>

                  {/* Footer row (Date + Action buttons) */}
                  <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                    <span>
                      Created{" "}
                      {new Date(
                        exam.created_at || Date.now()
                      ).toLocaleDateString()}
                    </span>

                    {(user?.role === "school_admin" ||
                      user?.role === "staff") && (
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleEdit(exam)}
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => handleDelete(exam.id)}
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
        )}

        {!isLoading && (exams as any[]).length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No exams scheduled</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first exam schedule to start tracking student
                assessments.
              </p>
              {(user?.role === "school_admin" || user?.role === "staff") && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule First Exam
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteExamId}
          onOpenChange={() => setDeleteExamId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to delete this exam?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                exam schedule and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
