import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast"; // -> Correct: Import the useToast hook
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
  Download,
  FileText,
  BookOpen,
  Users,
  Upload,
  Eye,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolData } from "@/context/SchoolDataContext"; // -> Use context for shared data

const materialFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  subject_id: z.coerce.number().min(1, "Subject is required"),
  class_id: z.coerce.number().min(1, "Class is required"),
  material_type: z.enum(["notes", "presentation", "video", "document", "link"]),
  file_url: z.string().optional(),
  content: z.string().optional(),
});

export default function MaterialsPage() {
  const { user } = useAuth();
  const { toast } = useToast(); // -> Correct: Initialize the toast hook
  const {
    classes,
    subjects,
    schoolData,
    loading: schoolDataLoading,
  } = useSchoolData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  console.log("subject data ", subjects);
  const form = useForm<z.infer<typeof materialFormSchema>>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      title: "",
      description: "",
      subject_id: 0,
      class_id: 0,
      material_type: "notes",
    },
  });

  // Fetch materials specific to the school
  const { data: materials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ["materials", schoolData?.id],
    queryFn: async () => {
      const response = await fetch(`/api/materials`); // This endpoint fetches all materials
      if (!response.ok) throw new Error("Failed to fetch materials");
      return response.json();
    },
    enabled: !!user && !!schoolData?.id,
  });

  // Create material mutation with updated toast notifications
  const createMaterialMutation = useMutation({
    mutationFn: async (data: z.infer<typeof materialFormSchema>) => {
      if (!schoolData?.id || !user?.id) {
        throw new Error("User or School information is missing.");
      }
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          teacher_id: user.id,
          school_id: schoolData.id,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create material");
      }
      return response.json();
    },
    onSuccess: () => {
      // -> Correct: Use toast with object syntax
      toast({
        title: "Success!",
        description: "The new learning material has been added.",
      });
      queryClient.invalidateQueries({
        queryKey: ["materials", schoolData?.id],
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      // -> Correct: Use toast with object syntax for errors
      toast({
        title: "Operation Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Redirect if user role is not permitted
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

  const handleSubmit = (data: z.infer<typeof materialFormSchema>) => {
    createMaterialMutation.mutate(data);
  };

  const isLoading = materialsLoading || schoolDataLoading;

  const getMaterialTypeIcon = (type: string) => {
    switch (type) {
      case "notes":
        return <FileText className="h-4 w-4" />;
      case "presentation":
        return <BookOpen className="h-4 w-4" />;
      case "video":
        return <Eye className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "link":
        return <Download className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getMaterialTypeBadge = (type: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      notes: "default",
      presentation: "secondary",
      video: "destructive",
      document: "outline",
      link: "default",
    };

    return (
      <Badge variant={variants[type] || "default"}>
        {getMaterialTypeIcon(type)}
        <span className="ml-1 capitalize">{type}</span>
      </Badge>
    );
  };

  return (
    <DashboardLayout title="Materials">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Learning Materials
            </h1>
            <p className="text-muted-foreground">
              Manage and share educational resources with students
            </p>
          </div>

          {(user?.role === "school_admin" || user?.role === "staff") && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Learning Material</DialogTitle>
                  <DialogDescription>
                    Share educational resources with your students.
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
                          <FormLabel>Material Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter material title"
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
                              placeholder="Enter material description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="material_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select material type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="notes">Notes</SelectItem>
                              <SelectItem value="presentation">
                                Presentation
                              </SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="document">Document</SelectItem>
                              <SelectItem value="link">
                                External Link
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

                    <FormField
                      control={form.control}
                      name="file_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>File URL or Link</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter file URL or external link"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter text content or notes"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                        disabled={createMaterialMutation.isPending}
                      >
                        {createMaterialMutation.isPending
                          ? "Adding..."
                          : "Add Material"}
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
            {(materials as any[]).map((material: any) => (
              <Card
                key={material.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{material.title}</CardTitle>
                    {getMaterialTypeBadge(material.material_type)}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {material.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Subject: {material.subject_name || "N/A"}
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Class: {material.class_name || "N/A"}
                    </div>
                    {material.file_url && (
                      <div className="flex items-center">
                        <Upload className="mr-2 h-4 w-4" />
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          View Resource
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Added{" "}
                      {new Date(
                        material.created_at || Date.now()
                      ).toLocaleDateString()}
                    </span>
                    <div className="space-x-2">
                      {material.file_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={material.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Access
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && (materials as any[]).length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No materials found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start sharing educational resources by adding your first
                material.
              </p>
              {(user?.role === "school_admin" || user?.role === "staff") && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Material
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
