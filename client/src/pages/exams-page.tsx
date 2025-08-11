import { useState } from "react";
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
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/layout/dashboard-layout";
import { useSchoolData } from "@/context/SchoolDataContext";

const examFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  term: z.string().min(1, "Term is required"),
  class_id: z.number().min(1, "Class is required"),
});

export default function ExamsPage() {
  const { user } = useAuth();
  const { classes, schoolData, loading: schoolDataLoading } = useSchoolData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof examFormSchema>>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: "",
      start_date: "",
      end_date: "",
      term: "",
      class_id: 0,
    },
  });

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
    mutationFn: async (data: z.infer<typeof examFormSchema>) => {
      if (!schoolData?.id) {
        throw new Error("School ID is not available.");
      }
      const response = await fetch("/api/exams", {
        // Assuming POST endpoint is still /api/exams
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          school_id: schoolData.id,
        }),
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

  const handleSubmit = (data: z.infer<typeof examFormSchema>) => {
    createExamMutation.mutate(data);
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
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Schedule New Exam</DialogTitle>
                  <DialogDescription>
                    Create a new examination period for students.
                  </DialogDescription>
                </DialogHeader>
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
                            <Input placeholder="Enter exam title" {...field} />
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
                              <SelectItem value="1st Term">1st Term</SelectItem>
                              <SelectItem value="2nd Term">2nd Term</SelectItem>
                              <SelectItem value="3rd Term">3rd Term</SelectItem>
                              <SelectItem value="Mid-term">Mid-term</SelectItem>
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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
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
                        disabled={
                          createExamMutation.isPending || !schoolData?.id
                        }
                      >
                        {createExamMutation.isPending
                          ? "Scheduling..."
                          : "Schedule Exam"}
                      </Button>
                    </div>
                  </form>
                </Form>
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
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    {getExamStatusBadge(exam.start_date, exam.end_date)}
                  </div>
                  <CardDescription>
                    {exam.term} • Class {exam.class_name || "N/A"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatDate(exam.start_date)} -{" "}
                      {formatDate(exam.end_date)}
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      Class: {exam.class_name || "N/A"}
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <BookOpen className="mr-2 h-4 w-4" />
                      {exam.subjects_count || 0} subjects
                    </div>

                    {getDaysUntilExam(exam.start_date) > 0 && (
                      <div className="flex items-center text-sm text-blue-600">
                        <Clock className="mr-2 h-4 w-4" />
                        {getDaysUntilExam(exam.start_date)} days to start
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Term: {exam.term}
                    </span>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        <Award className="h-4 w-4 mr-1" />
                        Results
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
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
      </div>
    </DashboardLayout>
  );
}