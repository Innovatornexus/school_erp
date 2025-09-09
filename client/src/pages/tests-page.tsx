import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";
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
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Calendar,
  BookOpen,
  Users,
  FileText,
  Clock,
  Target,
  CheckCircle,
  Trash,
  Edit,
  Eye,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolData } from "@/context/SchoolDataContext";
import type { Test, InsertTest } from "@shared/schema";

// Zod schema for the test creation form
const testFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  subject_id: z.coerce.number().min(1, "Subject is required"),
  class_id: z.coerce.number().min(1, "Class is required"),
  test_date: z.string().min(1, "Test date is required"),
  duration: z.coerce.number().min(1, "Duration must be greater than 0"),
  max_marks: z.coerce.number().min(1, "Max marks must be greater than 0"),
  test_type: z.enum(["quiz", "unit_test", "class_test", "mock_exam"]),
});

type TestFormData = z.infer<typeof testFormSchema>;

export default function TestsPage() {
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
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [testToDelete, setTestToDelete] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const form = useForm<TestFormData>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      title: "",
      description: "",
      subject_id: 0,
      class_id: 0,
      test_date: "",
      duration: 60,
      max_marks: 100,
      test_type: "quiz",
    },
  });

  // Fetch tests for the current school
  const { data: tests = [], isLoading: testsLoading } = useQuery<Test[]>({
    queryKey: ["tests", schoolData?.id],
    queryFn: async () => {
      const response = await fetch("/api/tests");
      if (!response.ok) throw new Error("Failed to fetch tests");
      return response.json();
    },
    enabled: !!user && !!schoolData?.id,
  });

  // Mutation to create a new test
  const createMutation = useMutation({
    mutationFn: async (data: InsertTest) => {
      if (!schoolData?.id || !user?.id) {
        throw new Error("User or School information is missing.");
      }
      const selectedClass = (classes as any[]).find(
        (cls) => cls.id === data.class_id
      );
      const selectedSubject = (subjects as any[]).find(
        (sub) => sub.id === data.subject_id
      );

      const response = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          teacher_id: user.id,
          teacher_name: user.name,
          school_id: schoolData.id,
          class_name: `${selectedClass.grade} - ${selectedClass.section}`,
          subject_name: selectedSubject.subject_name,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create test");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests", schoolData?.id] });
      setIsDialogOpen(false);
      toast({
        title: "Test Created!",
        description: "The new test has been scheduled successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to update an existing test
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<InsertTest>;
    }) => {
      const response = await fetch(`/api/tests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update test");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests", schoolData?.id] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Test updated successfully.",
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

  // Mutation to delete a test
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/tests/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete test");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests", schoolData?.id] });
      setIsDeleteModalOpen(false);
      toast({
        title: "Success",
        description: "Test removed successfully.",
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

  // Redirect users who do not have permission
  if (
    user?.role !== "school_admin" &&
    user?.role !== "staff" &&
    user?.role !== "student"
  ) {
    return <Redirect to="/dashboard" />;
  }

  // Unified form submission handler for create and update
  const onSubmit = (data: TestFormData) => {
    if (editingTest) {
      updateMutation.mutate({ id: editingTest.id, data });
    } else {
      createMutation.mutate(data as InsertTest);
    }
  };

  const openCreateDialog = () => {
    setEditingTest(null);
    form.reset({
      title: "",
      description: "",
      subject_id: 0,
      class_id: 0,
      test_date: "",
      duration: 60,
      max_marks: 100,
      test_type: "quiz",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (test: Test) => {
    setEditingTest(test);
    form.reset({
      ...test,
      // Ensure date is in 'YYYY-MM-DD' format for the input
      test_date: new Date(test.test_date).toISOString().split("T")[0],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setTestToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (testToDelete) {
      deleteMutation.mutate(testToDelete);
    }
  };

  const isLoading = testsLoading || schoolDataLoading;
  const isEditing = !!editingTest;

  // ... Helper functions (formatDate, getTestStatusBadge, etc.) remain the same ...
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const getTestStatusBadge = (testDate: string) => {
    const today = new Date();
    const test = new Date(testDate);
    // Reset time part for accurate day comparison
    today.setHours(0, 0, 0, 0);
    test.setHours(0, 0, 0, 0);

    if (test < today) {
      return <Badge variant="outline">Completed</Badge>;
    } else if (test.getTime() === today.getTime()) {
      return <Badge variant="default">Today</Badge>;
    } else {
      return <Badge variant="secondary">Scheduled</Badge>;
    }
  };

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case "quiz":
        return <Target className="h-4 w-4" />;
      case "unit_test":
        return <FileText className="h-4 w-4" />;
      case "class_test":
        return <BookOpen className="h-4 w-4" />;
      case "mock_exam":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTestTypeBadge = (type: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      quiz: "default",
      unit_test: "secondary",
      class_test: "outline",
      mock_exam: "destructive",
    };
    return (
      <Badge variant={variants[type] || "default"}>
        {getTestTypeIcon(type)}
        <span className="ml-1 capitalize">{type.replace("_", " ")}</span>
      </Badge>
    );
  };

  // Get current teacher for staff role
  const currentTeacher = useMemo(
    () => teachers.find((t) => t.user_id === user?.id),
    [teachers, user]
  );

  // Filter tests based on user role
  const filteredTests = useMemo(() => {
    if (user?.role === "staff" && currentTeacher) {
      // Staff should see tests they created OR tests for classes/subjects they teach
      return tests.filter((test) => {
        // Show if teacher created this test
        if (test.teacher_id === currentTeacher.id) {
          return true;
        }
        // Show if teacher teaches this class and subject
        const testClass = classes.find(c => c.id === test.class_id);
        if (testClass && testClass.subjects) {
          return testClass.subjects.some(
            (mapping: any) => 
              mapping.teacher_id === currentTeacher.id && 
              mapping.subject_id === test.subject_id
          );
        }
        return false;
      });
    }
    return tests; // Admins see all
  }, [tests, user, currentTeacher, classes]);

  // Available classes for staff (only classes they teach)
  const availableClasses = useMemo(() => {
    if (user?.role === "school_admin") {
      return classes;
    }
    if (user?.role === "staff" && currentTeacher) {
      const assignedClassIds = new Set();
      classes.forEach((cls) => {
        if (cls.subjects?.some((mapping: any) => mapping.teacher_id === currentTeacher.id)) {
          assignedClassIds.add(cls.id);
        }
      });
      return classes.filter((cls) => assignedClassIds.has(cls.id));
    }
    return [];
  }, [classes, currentTeacher, user]);

  // Available subjects for staff (only subjects they teach in selected class)
  const availableSubjects = useMemo(() => {
    const selectedClassId = form.watch("class_id");
    if (!selectedClassId) return [];

    const selectedClass = classes.find((c) => c.id === Number(selectedClassId));
    if (!selectedClass?.subjects) return [];

    if (user?.role === "school_admin") {
      const subjectIdsInClass = new Set(
        selectedClass.subjects.map((m: any) => m.subject_id)
      );
      return subjects.filter((s) => subjectIdsInClass.has(s.id));
    }

    if (user?.role === "staff" && currentTeacher) {
      const taughtSubjectIds = new Set(
        selectedClass.subjects
          .filter((mapping: any) => mapping.teacher_id === currentTeacher.id)
          .map((mapping: any) => mapping.subject_id)
      );
      return subjects.filter((s) => taughtSubjectIds.has(s.id));
    }

    return [];
  }, [form.watch("class_id"), classes, subjects, currentTeacher, user]);

  return (
    <DashboardLayout title="Tests">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Tests & Quizzes
            </h1>
            <p className="text-muted-foreground">
              Create and manage class tests, quizzes, and assessments
            </p>
          </div>
          {(user?.role === "school_admin" || user?.role === "staff") && (
            <Dialog
              open={isDialogOpen}
              onOpenChange={(isOpen) => {
                setIsDialogOpen(isOpen);
                if (!isOpen) {
                  setEditingTest(null);
                  form.reset();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Test
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {isEditing ? "Edit Test" : "Create New Test"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditing
                      ? "Update the details for this test or quiz."
                      : "Schedule a new test or quiz for your students."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    {/* Form fields remain the same */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Chapter 3 Quiz"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter test description and instructions"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="test_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select test type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="quiz">Quiz</SelectItem>
                              <SelectItem value="unit_test">
                                Unit Test
                              </SelectItem>
                              <SelectItem value="class_test">
                                Class Test
                              </SelectItem>
                              <SelectItem value="mock_exam">
                                Mock Exam
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
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
                              value={String(field.value)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableSubjects.map((subject: any) => (
                                  <SelectItem
                                    key={subject.id}
                                    value={String(subject.id)}
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
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="test_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Test Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (min)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="60"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="max_marks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Marks</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="100"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                        {isEditing ? "Save Changes" : "Create Test"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
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
            {filteredTests.map((test) => (
              <Card
                key={test.id}
                className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 bg-gradient-to-br from-white to-gray-50"
              >
                <CardHeader className="pb-4">
                  {/* Title */}
                  <div className="flex justify-between items-center rounded-lg border border-gray-300 bg-blue-700 px-3 py-2">
                    <CardTitle className="text-l font-semibold tracking-tight text-white">
                      {test.title}
                    </CardTitle>
                  </div>

                  {/* Description inside outlined box */}
                  <div className="mt-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
                    <CardDescription className="text-gray-700 text-sm">
                      {test.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Badges row */}
                  <div className="flex justify-between items-center mb-3">
                    {getTestTypeBadge(test.test_type)}
                    {getTestStatusBadge(test.test_date)}
                  </div>

                  {/* Test details */}
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>
                        <strong>Date:</strong> {formatDate(test.test_date)}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <BookOpen className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>
                        <strong>Subject:</strong> {test.subject_name || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>
                        <strong>Class:</strong> {test.class_name || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>
                        <strong>Duration:</strong> {test.duration} minutes
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Target className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>
                        <strong>Max Marks:</strong> {test.max_marks}
                      </span>
                    </div>
                  </div>
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
                  {/* Footer row (Date + Action buttons) */}
                  <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                    <span>
                      Added{" "}
                      {new Date(
                        test.created_at || Date.now()
                      ).toLocaleDateString()}
                    </span>

                    {(user?.role === "school_admin" ||
                      user?.id === test.teacher_id) && (
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                          onClick={() => openEditDialog(test)}
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => handleDelete(test.id)}
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

        {!isLoading && tests.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tests found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first test or quiz to assess student knowledge.
              </p>
              {(user?.role === "school_admin" || user?.role === "staff") && (
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Test
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this test? This action cannot be
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
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
