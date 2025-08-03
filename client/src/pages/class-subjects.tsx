import React, { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/layout/dashboard-layout";
import { ChevronLeft, PlusCircle } from "lucide-react";
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

type SubjectItem = { id: number; subject_name: string };
type TeacherItem = { id: number; full_name: string };
type ClassItem = { id: number; grade: string; section: string };
type ClassSubjectMapping = {
  id: number;
  subject_name: string;
  teacher_name: string | null;
};
type SchoolItem = { id: number; name: string };

export default function ClassSubjectsPage() {
  const [match, params] = useRoute("/classes/:gradeId/:sectionId/subjects");
  const [, navigate] = useLocation();
  const { user } = useAuth() as { user: any };
  const { toast } = useToast();

  const grade = params?.gradeId;
  const section = params?.sectionId;
  const [subjectData, setSubjectData] = useState<SubjectItem[]>([]);
  const [schoolData, setSchoolData] = useState<SchoolItem | null>(null);
  const [classId, setClassId] = useState<number | null>(null);

  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [mappings, setMappings] = useState<ClassSubjectMapping[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [staffData, setStaffData] = useState<TeacherItem[]>([]);

  // Fetch school data based on user role
  useEffect(() => {
    const fetchSchool = async () => {
      try {
        if (user?.role === "school_admin") {
          const res = await fetch(`/api/school/${user?.email}`);
          if (!res.ok) throw new Error("Failed to fetch school");
          setSchoolData(await res.json());
        } else if (user?.role === "staff") {
          // Fetch staff first to get school_id
          const staffRes = await fetch(`/api/Teachers/${user?.email}/staff`);
          if (!staffRes.ok) throw new Error("Failed to fetch staff");
          const staffArr = await staffRes.json();
          setStaffData(staffArr);
          if (staffArr.length > 0) {
            const schoolRes = await fetch(
              `/api/schools/${staffArr[0]?.school_id}`
            );
            if (!schoolRes.ok) throw new Error("Failed to fetch school");
            setSchoolData(await schoolRes.json());
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load school",
          variant: "destructive",
        });
      }
    };
    if (user?.email && user?.role) fetchSchool();
    // eslint-disable-next-line
  }, [user]);

  // Fetch classes for the school and find the classId
  useEffect(() => {
    const fetchClass = async () => {
      if (!schoolData?.id) return;
      try {
        const res = await fetch(`/api/schools/${schoolData.id}/classes`);
        if (!res.ok) throw new Error("Failed to fetch class");
        const data: ClassItem[] = await res.json();
        const found = data.find(
          (c) => c.grade === grade && c.section === section
        );
        if (found) setClassId(found.id);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load class list",
          variant: "destructive",
        });
      }
    };
    if (schoolData?.id && grade && section) fetchClass();
  }, [schoolData, grade, section, toast]);

  const fetchSubjects = async () => {
    if (!schoolData?.id) return;

    try {
      console.log("Fetching subjects for school:", schoolData.id);
      const res = await fetch(`/api/schools/${schoolData.id}/subjects`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch subjects");
      }
      const data = await res.json();
      console.log("Subjects data:", data);
      setSubjectData(data);
    } catch (error) {
      console.error("Subjects fetch error:", error);
      toast({
        title: "Error",
        description: "Failed to load subjects list.",
        variant: "destructive",
      });
    }
  };
  // Fetch subjects when schoolData is loaded
  useEffect(() => {
    if (schoolData?.id) {
      fetchSubjects();
    }
    // eslint-disable-next-line
  }, [schoolData]);

  // Fetch teachers for the school
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!schoolData?.id) return;
      try {
        let res;
        if (user?.role === "school_admin") {
          res = await fetch(`/api/schools/${schoolData.id}/teachers`);
        } else if (user?.role === "staff") {
          res = await fetch(`/api/Teachers/${user?.email}/staff`);
        }
        if (res && res.ok) setTeachers(await res.json());
      } catch {
        setTeachers([]);
      }
    };
    if (schoolData?.id) fetchTeachers();
  }, [schoolData, user]);

  // Fetch current mappings
  useEffect(() => {
    const fetchAndProcessMappings = async () => {
      if (!classId) return;
      try {
        const res = await fetch(`/api/classes/${classId}/subjects`);
        if (!res.ok) throw new Error("Failed to fetch mappings");

        type Mapping = {
          id: number;
          subject_id: number;
          teacher_id: number | null;
        };
        const rawMappings: Mapping[] = await res.json();

        const processedMappings = rawMappings.map((mapping) => {
          const subject = subjectData.find((s) => s.id === mapping.subject_id);
          const teacher = teachers.find((t) => t.id === mapping.teacher_id);
          return {
            id: mapping.id,
            subject_name: subject?.subject_name || "Unknown Subject",
            teacher_name: teacher?.full_name || null,
          };
        });
        setMappings(processedMappings);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load subject mappings.",
          variant: "destructive",
        });
      }
    };

    fetchAndProcessMappings();
  }, [classId, subjectData, teachers, toast]);

  // Assign subject to class
  const handleAssign = async () => {
    if (!classId || !selectedSubject) return;
    const payload = {
      role: "school_admin",
      class_id: classId,

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
      const mappingsRes = await fetch(`/api/classes/${classId}/subjects`);
      if (mappingsRes.ok) {
        type Mapping = { id: number; subject_id: number; teacher_id: number | null };
        const rawMappings: Mapping[] = await mappingsRes.json();
        const processedMappings = rawMappings.map((mapping) => {
          const subject = subjectData.find((s) => s.id === mapping.subject_id);
          const teacher = teachers.find((t) => t.id === mapping.teacher_id);
          return {
            id: mapping.id,
            subject_name: subject?.subject_name || "Unknown Subject",
            teacher_name: teacher?.full_name || null,
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
                      {subjectData.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.subject_name}
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
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.full_name}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.length > 0 ? (
                  mappings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.subject_name}</TableCell>
                      <TableCell>{m.teacher_name || "Unassigned"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center">
                      No subjects assigned yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}