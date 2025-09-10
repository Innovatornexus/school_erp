// src/pages/ExamsPage.tsx

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  Clock,
  Edit,
  Trash,
  Eye,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/layout/dashboard-layout";
import { useSchoolData } from "@/context/SchoolDataContext";
import { Exam, Subject, Class, Teacher } from "@/pages/type";

// No changes to schema needed here
const examSubjectSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  examDate: z.string().min(1, "Exam date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

const examFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  term: z.string().min(1, "Term is required"),
  classId: z.string().min(1, "Class is required"),
  subjects: z
    .array(examSubjectSchema)
    .min(1, "At least one subject is required"),
});

// Using shared types from types.ts

export default function ExamsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const {
    classes,
    subjects,
    teachers,
    schoolData,
    loading: schoolDataLoading,
  } = useSchoolData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deleteExamId, setDeleteExamId] = useState<string | null>(null);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof examFormSchema>>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: "",
      term: "",
      classId: "",
      subjects: [],
    },
  });
  console.log("subjects :", subjects);

  useEffect(() => {
    if (isDialogOpen && !editingExam) {
      form.reset({
        title: "",
        term: "",
        classId: "",
        subjects: [],
      });
    }
  }, [isDialogOpen, editingExam, form]);

  useEffect(() => {
    if (!isDialogOpen) {
      setEditingExam(null);
    }
  }, [isDialogOpen]);

  const { data: exams = [], isLoading: examsLoading } = useQuery<Exam[]>({
    queryKey: ["exams", schoolData?.id],
    queryFn: async () => {
      const response = await fetch(`/api/schools/${schoolData!.id}/exams`);
      if (!response.ok) {
        throw new Error("Failed to fetch exams");
      }
      return response.json();
    },
    enabled: !!schoolData?.id,
  });

  // Get current teacher for staff role
  const currentTeacher = useMemo(
    () => teachers.find((t) => t.userId === user?.id),
    [teachers, user]
  );

  // Filter exams based on user role
  const filteredExams = useMemo(() => {
    if (user?.role === "staff" && currentTeacher) {
      // Staff should see exams for classes/subjects they teach
      return exams.filter((exam) => {
        // Find the class for this exam
        const examClass = classes.find((c) => c.id === exam.classId);
        if (examClass && examClass.subjects) {
          // Check if teacher teaches any subject in this class
          return examClass.subjects.some(
            (mapping: any) => mapping.teacherId === currentTeacher.id
          );
        }
        return false;
      });
    }
    return exams; // Admins see all
  }, [exams, user, currentTeacher, classes]);

  // Available classes for staff (only classes they teach)
  const availableClasses = useMemo(() => {
    if (user?.role === "school_admin") {
      return classes;
    }
    if (user?.role === "staff" && currentTeacher) {
      const assignedClassIds = new Set();
      classes.forEach((cls) => {
        if (
          cls.subjects?.some(
            (mapping: any) => mapping.teacherId === currentTeacher.id
          )
        ) {
          assignedClassIds.add(cls.id);
        }
      });
      return classes.filter((cls) => assignedClassIds.has(cls.id));
    }
    return [];
  }, [classes, currentTeacher, user]);

  // Available subjects for staff (only subjects they teach in selected class)
  const availableSubjectsForForm = useMemo(() => {
    const selectedClassId = form.watch("classId");
    if (!selectedClassId) return [];

    const selectedClass = classes.find((c) => c.id === selectedClassId);
    if (!selectedClass?.subjects) return [];

    if (user?.role === "school_admin") {
      const subjectIdsInClass = new Set(
        selectedClass.subjects.map((m: any) => m.subjectId)
      );
      return subjects.filter((s) => subjectIdsInClass.has(s.id));
    }

    if (user?.role === "staff" && currentTeacher) {
      const taughtSubjectIds = new Set(
        selectedClass.subjects
          .filter((mapping: any) => mapping.teacherId === currentTeacher.id)
          .map((mapping: any) => mapping.subjectId)
      );
      return subjects.filter((s) => taughtSubjectIds.has(s.id));
    }

    return [];
  }, [form.watch("classId"), classes, subjects, currentTeacher, user]);

  const createExamMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), // Pass the transformed data directly
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create exam");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Exam scheduled successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["exams", schoolData?.id] });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const updateExamMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/exams/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete exam");
      }
      return true;
    },
    onSuccess: () => {
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
    if (!schoolData?.id) {
      toast({
        title: "Error",
        description: "School data not found.",
        variant: "destructive",
      });
      return;
    }

    const selectedClass = classes.find((cls) => cls.id === data.classId);

    const transformedData = {
      title: data.title,
      term: data.term,
      classId: data.classId,
      className: selectedClass
        ? `${selectedClass.grade} - ${selectedClass.section}`
        : "N/A",
      schoolId: schoolData.id,
      startDate: data.subjects.reduce(
        (earliest, s) => (s.examDate < earliest ? s.examDate : earliest),
        data.subjects[0].examDate
      ),
      endDate: data.subjects.reduce(
        (latest, s) => (s.examDate > latest ? s.examDate : latest),
        data.subjects[0].examDate
      ),
      subjects: data.subjects.map((subject) => {
        const selectedSubject = subjects.find(
          (s) => s.id === subject.subjectId
        );
        return {
          subjectId: subject.subjectId,
          subjectName: selectedSubject?.subjectName || "",
          examDate: subject.examDate,
          startTime: subject.startTime,
          endTime: subject.endTime,
          maxMarks: 100,
        };
      }),
    };

    if (editingExam) {
      updateExamMutation.mutate({ id: editingExam.id, data: transformedData });
    } else {
      createExamMutation.mutate(transformedData);
    }
  };

  const handleEdit = async (exam: Exam) => {
    setEditingExam(exam);
    try {
      const response = await fetch(`/api/exams/${exam.id}/subjects`);
      if (!response.ok) throw new Error("Failed to fetch exam subjects");
      const examSubjects = await response.json();

      form.reset({
        title: exam.title,
        term: exam.term,
        classId: exam.classId,
        subjects: examSubjects.map((s: any) => ({
          subjectId: s.subjectId,
          examDate: s.examDate,
          startTime: s.startTime || "",
          endTime: s.endTime || "",
        })),
      });
      setIsDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load exam subjects.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (examId: string) => setDeleteExamId(examId);
  const confirmDelete = () => {
    if (deleteExamId) {
      deleteExamMutation.mutate(deleteExamId);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const getExamStatusBadge = (startDate: string, endDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Ensure end date is inclusive

    if (today < start) return <Badge variant="secondary">Upcoming</Badge>;
    if (today >= start && today <= end)
      return <Badge variant="default">Ongoing</Badge>;
    return <Badge variant="outline">Completed</Badge>;
  };

  const getDaysUntilExam = (startDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const diffTime = start.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isLoading = examsLoading || schoolDataLoading;

  return (
    <DashboardLayout title="Exams">
      <div className="space-y-6">
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
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Schedule Exam
                </Button>
              </DialogTrigger>
              {/* Form Dialog Content is unchanged */}
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>
                    {editingExam ? "Edit Exam" : "Schedule New Exam"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingExam
                      ? "Update the examination details."
                      : "Create a new examination period."}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleSubmit)}
                      className="space-y-4"
                    >
                      {/* All form fields like Title, Term, Class are unchanged */}
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exam Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Midterm Examination"
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
                        name="classId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(String(value))
                              }
                              value={String(field.value)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableClasses.map((cls: any) => (
                                  <SelectItem
                                    key={cls.id}
                                    value={String(cls.id)}
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

                      {/* Dynamic Subjects Section is unchanged */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base font-medium">
                            Exam Subjects
                          </FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              form.setValue("subjects", [
                                ...form.getValues("subjects"),
                                {
                                  subjectId: "",
                                  examDate: "",
                                  startTime: "",
                                  endTime: "",
                                },
                              ])
                            }
                          >
                            <Plus className="mr-2 h-4 w-4" /> Add Subject
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
                                onClick={() =>
                                  form.setValue(
                                    "subjects",
                                    form
                                      .getValues("subjects")
                                      .filter((_, i) => i !== index)
                                  )
                                }
                              >
                                Remove
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`subjects.${index}.subjectId`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <Select
                                      onValueChange={(v) =>
                                        field.onChange(Number(v))
                                      }
                                      value={String(field.value)}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select subject" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {availableSubjectsForForm.map(
                                          (s: any) => (
                                            <SelectItem
                                              key={s.id}
                                              value={String(s.id)}
                                            >
                                              {s.subjectName}
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
                                name={`subjects.${index}.examDate`}
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
                                name={`subjects.${index}.startTime`}
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
                                name={`subjects.${index}.endTime`}
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
                            Click "Add Subject" to get started.
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
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
                            createExamMutation.isPending ||
                            updateExamMutation.isPending
                          }
                        >
                          {createExamMutation.isPending ||
                          updateExamMutation.isPending
                            ? "Saving..."
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

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              /* Skeleton loader unchanged */ <Card
                key={i}
                className="animate-pulse"
              >
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
        ) : exams.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredExams.map((exam) => (
              <Card key={exam.id}>
                <CardHeader>
                  <CardTitle>{exam.title}</CardTitle>
                  <CardDescription>
                    {exam.term} • {exam.className}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    {getExamStatusBadge(exam.startDate, exam.endDate)}
                    {getDaysUntilExam(exam.startDate) > 0 && (
                      <span className="text-muted-foreground">
                        Starts in {getDaysUntilExam(exam.startDate)} days
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>
                        {formatDate(exam.startDate)} -{" "}
                        {formatDate(exam.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      {/* ✨ FIX: Use the new subjectsCount property from the API */}
                      <BookOpen className="mr-2 h-4 w-4" />
                      <span>{exam.subjectsCount || 0} subjects</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex gap-2">
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => setLocation(`/exam-schedule/${exam.id}`)}
                      >
                        <Calendar className="mr-2 h-4 w-4" /> View Details
                      </Button>
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => setLocation(`/exam-results/${exam.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" /> View Results
                      </Button>
                    </div>
                    {(user?.role === "school_admin" ||
                      user?.role === "staff") && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(exam)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(exam.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            {/* "No exams scheduled" view is unchanged */}
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No exams scheduled</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first exam schedule to get started.
              </p>
              {(user?.role === "school_admin" || user?.role === "staff") && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Exam
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <AlertDialog
          open={!!deleteExamId}
          onOpenChange={() => setDeleteExamId(null)}
        >
          {/* Delete confirmation dialog is unchanged */}
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the exam and all associated
                results. This action cannot be undone.
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
