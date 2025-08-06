import { useState } from "react";
import DashboardLayout from "@/layout/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TimetableUploadPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Fetch classes for staff user
  const { data: classes, isLoading } = useQuery({
    queryKey: ["staffClasses"],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/teachers/${user.id}/classes`);
      if (!res.ok) throw new Error("Failed to fetch classes");
      return res.json();
    },
  });

  const uploadTimetableMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClassId) throw new Error("Class not selected");
      if (!imageFile) throw new Error("No image file selected");

      // For simplicity, assume backend accepts base64 image string
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const res = await fetch("/api/timetables/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: selectedClassId,
          school_id: (user as any)?.school_id,
          image_url: base64,
          upload_date: new Date().toISOString().split("T")[0],
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to upload timetable");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.toast({
        title: "Timetable uploaded",
        description: "The timetable image has been uploaded successfully.",
      });
      setImageFile(null);
      queryClient.invalidateQueries({ queryKey: ["staffClasses"] });
    },
    onError: (error: any) => {
      toast.toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleSubmit = () => {
    uploadTimetableMutation.mutate();
  };

  return (
    <DashboardLayout title="Upload Timetable">
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div>
          <Label>Class</Label>
          <Select
            onValueChange={(val) => setSelectedClassId(Number(val))}
            value={selectedClassId?.toString() || ""}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="">Loading...</SelectItem>
              ) : (
                classes?.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.grade} {cls.section}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Timetable Image</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={
            uploadTimetableMutation.isLoading || !selectedClassId || !imageFile
          }
        >
          {uploadTimetableMutation.isLoading
            ? "Uploading..."
            : "Upload Timetable"}
        </Button>
      </div>
    </DashboardLayout>
  );
}
