import React, { useEffect, useState } from "react";
import { useLocation, useRoute, Redirect, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/layout/dashboard-layout";
import { ChevronLeft, Edit, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSchoolData } from "@/context/SchoolDataContext";
import { ClassItem, SubjectItem, StaffItem } from "./type";

type ClassSubjectMapping = {
  id: number;
  subject_name: string;
  teacher_name: string | null;
  teacher_id: number | null;
  subject_id: number;
};

export default function ClassSubjectsPage() {
  const { user } = useAuth() as { user: any };
  const { toast } = useToast();

  // Redirect if not school_admin or staff
  if (user?.role !== "school_admin" && user?.role !== "staff") {
    toast({
      title: "Access Denied",
      description: "You do not have permission to view this page.",
      variant: "destructive",
    });
    return <Redirect to="/dashboard" />;
  }

  const [match, params] = useRoute("/classes/:gradeId/:sectionId/subjects");
  const [, navigate] = useLocation();
  const { schoolData, classes, subjects, teachers, refetchData, loading } =
    useSchoolData();

  const grade = params?.gradeId;
  const section = params?.sectionId;

  const selectedClass = classes.find(
    (cls: ClassItem) => cls.grade === grade && cls.section === section
  );

  const [mappings, setMappings] = useState<ClassSubjectMapping[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] =
    useState<ClassSubjectMapping | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");

  // Fetch current mappings
  useEffect(() => {
    if (selectedClass && subjects.length > 0 && teachers) {
      const classSubjects = selectedClass.subjects || [];
      const processedMappings = classSubjects.map((mapping: any) => {
        const subject = subjects.find((s) => s.id === mapping.subject_id);
        const teacher = teachers.find(
          (t: StaffItem) => t.id === mapping.teacher_id
        );
        return {
          id: mapping.id,
          subject_id: mapping.subject_id,
          teacher_id: mapping.teacher_id,
          subject_name: subject?.subjectName || "Unknown Subject",
          teacher_name: teacher?.fullName || null,
        };
      });
      setMappings(processedMappings);
    }
  }, [selectedClass, subjects, teachers]);

  // If no match or still loading, return loading state or redirect
  if (!match || loading) {
    return (
      <DashboardLayout title="Loading Class Subjects...">
        <div className="container py-6">Loading...</div>
      </DashboardLayout>
    );
  }

  // Assign subject to class
  const handleAssign = async () => {
    if (!selectedClass?.id || !selectedSubject) return;
    const payload = {
      role: "school_admin",
      class_id: selectedClass.id,
      teacher_id:
        selectedTeacher && selectedTeacher !== "unassigned"
          ? Number(selectedTeacher)
          : null,
      subject_id: Number(selectedSubject),
    };
    console.log("Assigning subject with payload:", payload);
    const res = await fetch("/api/class-subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast({ title: "Success", description: "Assigned successfully" });
      setIsDialogOpen(false);
      setSelectedSubject("");
      setSelectedTeacher("");
      // Refresh mappings
      const mappingsRes = await fetch(
        `/api/classes/${selectedClass.id}/subjects`
      );
      if (mappingsRes.ok) {
        type Mapping = {
          id: number;
          subject_id: number;
          teacher_id: number | null;
        };
        const rawMappings: Mapping[] = await mappingsRes.json();
        const processedMappings = rawMappings.map((mapping) => {
          const subject = subjects.find((s) => s.id === mapping.subject_id);
          const teacher = teachers.find(
            (t: StaffItem) => t.id === mapping.teacher_id
          );
          return {
            id: mapping.id,
            subject_id: mapping.subject_id,
            teacher_id: mapping.teacher_id,
            subject_name: subject?.subjectName || "Unknown Subject",
            teacher_name: teacher?.fullName || null,
          };
        });
        setMappings(processedMappings);
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to assign",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (mapping: ClassSubjectMapping) => {
    setEditingMapping(mapping);
    setSelectedTeacher(mapping.teacher_id ? mapping.teacher_id.toString() : "");
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingMapping) return;

    const payload = {
      teacher_id: selectedTeacher ? Number(selectedTeacher) : null,
    };

    try {
      const res = await fetch(`/api/class-subjects/${editingMapping.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update mapping");

      toast({ title: "Success", description: "Teacher updated successfully" });
      setIsEditDialogOpen(false);
      setEditingMapping(null);

      // Refresh mappings
      const mappingsRes = await fetch(
        `/api/classes/${selectedClass.id}/subjects`
      );
      if (mappingsRes.ok) {
        type Mapping = {
          id: number;
          subject_id: number;
          teacher_id: number | null;
        };
        const rawMappings: Mapping[] = await mappingsRes.json();
        const processedMappings = rawMappings.map((mapping) => {
          const subject = subjects.find((s) => s.id === mapping.subject_id);
          const teacher = teachers.find(
            (t: StaffItem) => t.id === mapping.teacher_id
          );
          return {
            id: mapping.id,
            subject_id: mapping.subject_id,
            teacher_id: mapping.teacher_id,
            subject_name: subject?.subjectName || "Unknown Subject",
            teacher_name: teacher?.fullName || null,
          };
        });
        setMappings(processedMappings);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update teacher assignment",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title={`Class ${grade}${section} subjects Details`}>
      <div className="container py-6">
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate(`/classes/${grade}/${section}`)}
            className="mb-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Class details
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Assign Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Subject to Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label>Subject</label>
                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s: SubjectItem) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.subjectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label>Teacher</label>
                  <Select
                    value={selectedTeacher}
                    onValueChange={setSelectedTeacher}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {teachers.map((t: StaffItem) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAssign}>Assign</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <h1 className="text-2xl font-bold mb-4">
          Class {grade} {section} - Subjects
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Subjects and Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.length > 0 ? (
                  mappings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        {user?.role === "staff" ? (
                          <Link
                            href={`/teacher/classes/${selectedClass?.id}/subjects/${m.subject_id}`}
                          >
                            <Button variant="link" className="p-0 h-auto">
                              {m.subject_name}
                            </Button>
                          </Link>
                        ) : (
                          m.subject_name
                        )}
                      </TableCell>
                      <TableCell>{m.teacher_name || "Unassigned"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(m)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      No subjects assigned yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Teacher for {editingMapping?.subject_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label>Teacher</label>
              <Select
                value={selectedTeacher}
                onValueChange={setSelectedTeacher}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teachers.map((t: StaffItem) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
