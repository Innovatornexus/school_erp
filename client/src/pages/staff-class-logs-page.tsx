import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/layout/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSchoolData } from "@/context/SchoolDataContext";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

export default function StaffClassLogsPage() {
  const { user } = useAuth() as { user: any };
  const toast = useToast();
  const queryClient = useQueryClient();
  const {
    classes,
    teachers,
    subjects,
    ispending: isLoadingClasses,
  } = useSchoolData();

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    null
  );
  const [logDate, setLogDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [coveredTopics, setCoveredTopics] = useState("");
  const [notes, setNotes] = useState("");

  const filteredClasses = useMemo(() => {
    if (!classes || !teachers || !user) return [];
    try {
      const currentTeacher = teachers.find(
        (teacher: any) => teacher.user_id === user.id
      );
      if (!currentTeacher) return [];

      const teacherId: number = currentTeacher.id;

      return classes
        .filter((cls: any) =>
          cls.subjects?.some((sub: any) => sub.teacher_id === teacherId)
        )
        .sort((a: any, b: any) => {
          if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
          return a.section.localeCompare(b.section);
        });
    } catch (error) {
      console.error("Error filtering classes:", error);
      return [];
    }
  }, [classes, teachers, user]);

  const subjectsForSelectedClass = useMemo(() => {
    if (!selectedClassId || !classes) return [];
    const selectedClass = classes.find(
      (cls: any) => cls.id === selectedClassId
    );
    return selectedClass?.subjects || [];
  }, [selectedClassId, classes]);

  useEffect(() => {
    if (
      filteredClasses.length > 0 &&
      !filteredClasses.find((cls: any) => cls.id === selectedClassId)
    ) {
      setSelectedClassId(null);
      setSelectedSubjectId(null);
    }
  }, [filteredClasses, selectedClassId]);

  const createClassLogMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClassId || !selectedSubjectId)
        throw new Error("Class and subject must be selected");

      const currentTeacher = teachers.find(
        (teacher: any) => teacher.user_id === user.id
      );
      if (!currentTeacher) throw new Error("Teacher not found");

      const res = await fetch("/api/class-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: selectedClassId,
          teacher_id: currentTeacher.id,
          subject_id: selectedSubjectId,
          log_date: logDate,
          covered_topics: coveredTopics,
          notes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save class log");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.toast({
        title: "Class log saved",
        description: "The class log has been saved successfully.",
      });
      setCoveredTopics("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["class-logs"] });
    },
    onError: (error: any) => {
      toast.toast({
        variant: "destructive",
        title: "Error saving log",
        description: error.message || "An unexpected error occurred.",
      });
    },
  });

  const handleSubmit = () => {
    createClassLogMutation.mutate();
  };

  return (
    <DashboardLayout title="Class Logs">
      <div className="p-6 max-w-3xl mx-auto">
        <div className="space-y-4">
          <div>
            <Label>Class</Label>
            <Select
              onValueChange={(val) => {
                setSelectedClassId(Number(val));
                setSelectedSubjectId(null); // Reset subject when class changes
              }}
              value={selectedClassId?.toString() || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingClasses ? (
                  <SelectItem value="loading" disabled>
                    Loading classes...
                  </SelectItem>
                ) : filteredClasses.length > 0 ? (
                  filteredClasses.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.grade} {cls.section}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-classes" disabled>
                    No classes assigned to you
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedClassId && (
            <div>
              <Label>Subject</Label>
              <Select
                onValueChange={(val) => setSelectedSubjectId(Number(val))}
                value={selectedSubjectId?.toString() || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjectsForSelectedClass.length > 0 ? (
                    subjectsForSelectedClass.map((sub: any) => (
                      <SelectItem
                        key={sub.subject_id}
                        value={sub.subject_id.toString()}
                      >
                        {
                          subjects.find((s: any) => s.id === sub.subject_id)
                            ?.subject_name
                        }
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-subjects" disabled>
                      No subjects available for this class
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
            />
          </div>

          <div>
            <Label>Covered Topics</Label>
            <Textarea
              value={coveredTopics}
              onChange={(e) => setCoveredTopics(e.target.value)}
              rows={5}
            />
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={
              createClassLogMutation.isPending ||
              !selectedClassId ||
              !selectedSubjectId ||
              !coveredTopics.trim()
            }
          >
            {createClassLogMutation.isPending ? "Saving..." : "Save Log"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
