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
  Download,
  FileText,
  BookOpen,
  Users,
  Eye,
  Trash,
  Edit,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolData } from "@/context/SchoolDataContext";
import type { Material, InsertMaterial } from "@shared/schema";

// Zod schema for the material form
const materialFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  subject_id: z.coerce.number().min(1, "Subject is required"),
  class_id: z.coerce.number().min(1, "Class is required"),
  material_type: z.enum(["notes", "presentation", "video", "document", "link"]),
  file_url: z.string().url().optional().or(z.literal("")),
  content: z.string().optional(),
});

type MaterialFormData = z.infer<typeof materialFormSchema>;

export default function MaterialsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    classes,
    subjects,
    schoolData,
    loading: schoolDataLoading,
  } = useSchoolData();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<number | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      title: "",
      description: "",
      subject_id: 0,
      class_id: 0,
      material_type: "notes",
      file_url: "",
      content: "",
    },
  });

  // Fetch materials specific to the school
  const { data: materials = [], isLoading: materialsLoading } = useQuery<
    Material[]
  >({
    queryKey: ["materials", schoolData?.id],
    queryFn: async () => {
      const response = await fetch(`/api/materials`);
      if (!response.ok) throw new Error("Failed to fetch materials");
      return response.json();
    },
    enabled: !!user && !!schoolData?.id,
  });

  // Create material mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertMaterial) => {
      if (!schoolData?.id || !user?.id) {
        throw new Error("User or School information is missing.");
      }
      const selectedClass = (classes as any[]).find(
        (cls) => cls.id === data.class_id
      );
      const selectedSubject = (subjects as any[]).find(
        (sub) => sub.id === data.subject_id
      );

      const response = await fetch("/api/materials", {
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
        throw new Error(errorData.message || "Failed to create material");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["materials", schoolData?.id],
      });
      setIsDialogOpen(false);
      toast({
        title: "Success!",
        description: "The new learning material has been added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Operation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update material mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<InsertMaterial>;
    }) => {
      const response = await fetch(`/api/materials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update material");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["materials", schoolData?.id],
      });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Material updated successfully.",
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

  // Delete material mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/materials/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete material");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["materials", schoolData?.id],
      });
      setIsDeleteModalOpen(false);
      toast({
        title: "Success",
        description: "Material removed successfully.",
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

  // Unified form submission handler
  const onSubmit = (data: MaterialFormData) => {
    if (editingMaterial) {
      updateMutation.mutate({ id: editingMaterial.id, data });
    } else {
      createMutation.mutate(data as InsertMaterial);
    }
  };

  const openEditDialog = (material: Material) => {
    setEditingMaterial(material);
    form.reset({
      ...material,
      file_url: material.file_url || "",
      content: material.content || "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingMaterial(null);
    form.reset({
      title: "",
      description: "",
      subject_id: 0,
      class_id: 0,
      material_type: "notes",
      file_url: "",
      content: "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setMaterialToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (materialToDelete) {
      deleteMutation.mutate(materialToDelete);
    }
  };

  // Redirect if user role is not permitted
  if (
    user?.role !== "school_admin" &&
    user?.role !== "staff" &&
    user?.role !== "student"
  ) {
    return <Redirect to="/dashboard" />;
  }

  const isLoading = materialsLoading || schoolDataLoading;
  const isEditing = !!editingMaterial;

  const getMaterialTypeIcon = (type: string) => {
    // ... icon logic remains the same
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
    // ... badge logic remains the same
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
            <Dialog
              open={isDialogOpen}
              onOpenChange={(isOpen) => {
                setIsDialogOpen(isOpen);
                if (!isOpen) {
                  setEditingMaterial(null);
                  form.reset();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {isEditing
                      ? "Edit Learning Material"
                      : "Add Learning Material"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditing
                      ? "Update the details of this educational resource."
                      : "Share a new educational resource with your students."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    {/* ... Your FormFields go here (they are correct) ... */}
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
                              value={String(field.value)}
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
                                {(classes as any[]).map((cls: any) => (
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

                    <FormField
                      control={form.control}
                      name="file_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>File URL or Link</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/file.pdf"
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
                        {isEditing ? "Save Changes" : "Add Material"}
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
            {materials.map((material) => (
              <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="pb-4">
                  <div className="flex justify-between  items-center rounded-lg border border-gray-300 bg-blue-700 px-3 py-2">
                    {/* Title */}
                    <CardTitle className="text-l font-semibold text-gray-800 tracking-tight text-white">
                      {material.title}
                    </CardTitle>
                  </div>

                  {/* Description inside outlined box */}
                  <div className="mt-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
                    <CardDescription className="text-gray-700 text-sm">
                      {material.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Badge */}
                  <div className="flex-shrink-0 ">
                    {getMaterialTypeBadge(material.material_type)}
                  </div>
                  {/* Subject */}
                  <div className="flex items-center text-gray-700 text-sm">
                    <BookOpen className="mr-2 h-4 w-4 text-indigo-500" />
                    <span>
                      <strong>Subject:</strong> {material.subject_name || "N/A"}
                    </span>
                  </div>

                  {/* Class */}
                  <div className="flex items-center text-gray-700 text-sm">
                    <Users className="mr-2 h-4 w-4 text-indigo-500" />
                    <span>
                      <strong>Class:</strong> {material.class_name || "N/A"}
                    </span>
                  </div>

                  {/* View Button inside list */}
                  {material.file_url && (
                    <div className="flex items-center">
                      <Eye className="mr-2 h-4 w-4 text-indigo-500" />
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

                  {/* Footer row */}

                  <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                    <span>
                      Added{" "}
                      {new Date(
                        material.created_at || Date.now()
                      ).toLocaleDateString()}
                    </span>
                    {/* Action buttons */}
                    {(user?.role === "school_admin" ||
                      user?.id === material.teacher_id) && (
                      <div className="mt-4 flex justify-end gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                          onClick={() => openEditDialog(material)}
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => handleDelete(material.id)}
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

        {!isLoading && materials.length === 0 && (
          // ... Empty State Card ...
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No materials found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start sharing educational resources by adding your first
                material.
              </p>
              {(user?.role === "school_admin" || user?.role === "staff") && (
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Material
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this material? This action
                cannot be undone.
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
