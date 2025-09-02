import { useState } from "react";
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
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolData } from "@/context/SchoolDataContext";

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

export default function TestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    classes,
    subjects,
    schoolData,
    loading: schoolDataLoading,
  } = useSchoolData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [testToDelete, settestToDelete] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const form = useForm<z.infer<typeof testFormSchema>>({
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
  const { data: tests = [], isLoading: testsLoading } = useQuery({
    queryKey: ["tests", schoolData?.id],
    queryFn: async () => {
      // This endpoint should ideally filter tests by the user's school on the backend
      const response = await fetch("/api/tests");
      if (!response.ok) {
        throw new Error("Failed to fetch tests");
      }
      return response.json();
    },
    enabled: !!user && !!schoolData?.id,
  });

  // Mutation to create a new test with toast feedback
  const createTestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof testFormSchema>) => {
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
      const response = await fetch("/api/tests", {
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
        throw new Error(errorData.message || "Failed to create test");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Created!",
        description: "The new test has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["tests", schoolData?.id] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Redirect users who do not have permission to view the page
  if (
    user?.role !== "school_admin" &&
    user?.role !== "staff" &&
    user?.role !== "student"
  ) {
    toast({
      title: "Access Denied",
      description: "You do not have permission to view this page.",
      variant: "destructive",
    });
    return <Redirect to="/dashboard" />;
  }

  const handleSubmit = (data: z.infer<typeof testFormSchema>) => {
    createTestMutation.mutate(data);
  };
  const handleDelete = (id: number) => {
    settestToDelete(id);
    setIsDeleteModalOpen(true);
  };
  const confirmDelete = async () => {
    if (!testToDelete) return;
    try {
      const response = await fetch(`/api/tests/${testToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete student");

      toast({ title: "Success", description: "Test removed successfully" });
      queryClient.invalidateQueries({
        queryKey: ["tests", schoolData?.id],
      });
      setIsDeleteModalOpen(false);
      settestToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the Test",
        variant: "destructive",
      });
    }
  };
  const isLoading = testsLoading || schoolDataLoading;

  // Helper functions for formatting and UI elements
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();
  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  const getTestStatusBadge = (testDate: string) => {
    const today = new Date();
    const test = new Date(testDate);
    const diffDays = Math.ceil(
      (test.getTime() - today.getTime()) / (1000 * 3600 * 24)
    );

    if (diffDays < 0) {
      return <Badge variant="outline">Completed</Badge>;
    } else if (diffDays === 0) {
      return <Badge variant="default">Today</Badge>;
    } else if (diffDays <= 3) {
      return <Badge variant="destructive">Upcoming</Badge>;
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Test
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Test</DialogTitle>
                  <DialogDescription>
                    Schedule a test or quiz for your students.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter test title" {...field} />
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
                            defaultValue={field.value}
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
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
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
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                        disabled={createTestMutation.isPending}
                      >
                        {createTestMutation.isPending
                          ? "Creating..."
                          : "Create Test"}
                      </Button>
                    </div>
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
            {(tests as any[]).map((test: any) => (
              <Card key={test.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    {/* Left side: Title */}
                    <CardTitle className="text-lg">{test.title}</CardTitle>

                    {/* Right side: Badge + Trash aligned properly */}
                    <div className="flex items-center space-x-2">
                      {getTestTypeBadge(test.test_type)}
                      {getTestStatusBadge(test.test_date)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(test.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <CardDescription className="line-clamp-2">
                    {test.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatDate(test.test_date)} at{" "}
                      {formatTime(test.test_date)}
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Subject: {test.subject_name || "N/A"}
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Class: {test.class_name || "N/A"}
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Duration: {test.duration} minutes
                    </div>
                    <div className="flex items-center">
                      <Target className="mr-2 h-4 w-4" />
                      Max Marks: {test.max_marks}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {test.attempts_count || 0} attempts
                    </span>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        Results
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && (tests as any[]).length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tests found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first test or quiz to assess student knowledge.
              </p>
              {(user?.role === "school_admin" || user?.role === "staff") && (
                <Button onClick={() => setIsDialogOpen(true)}>
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
                Are you sure you want to remove this student? This action cannot
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
      </div>
    </DashboardLayout>
  );
}
