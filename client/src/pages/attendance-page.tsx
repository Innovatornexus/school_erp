import { useEffect, useState, useMemo, ChangeEvent } from "react";
// At the top of attendance-page.tsx
import { format, eachDayOfInterval, getDay } from "date-fns";
import DashboardLayout from "@/layout/dashboard-layout";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon } from "lucide-react"; // Assuming you have this icon

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Save,
  Search,
  Users,
  Download,
  XCircle,
  Pencil,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolData } from "@/context/SchoolDataContext";
import { Switch } from "@/components/ui/switch";

// Interfaces
interface Student {
  id: number;
  full_name: string;
  roll_no?: string;
  class_id: number;
  present: boolean;
}

interface Class {
  id: number;
  grade: string;
  section: string;
  class_teacher_id?: number;
}

interface Teacher {
  id: number;
  user_id: number;
  full_name: string;
  subject_specialization: string[];
  present: boolean;
}

interface DataTableProps {
  data: any[];
  columns: any[];
  searchPlaceholder: string;
}

// DataTable Component for Reports
const DataTable = ({ data, columns, searchPlaceholder }: DataTableProps) => {
  const [filter, setFilter] = useState("");

  const filteredData = useMemo(() => {
    if (!filter) return data;
    return data.filter((row: any) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [data, filter]);

  return (
    <div>
      <div className="flex items-center py-4">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={filter}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFilter(e.target.value)
            }
            className="pl-8"
          />
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col: any) => (
                <TableHead key={col.header}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((row: any, index: number) => (
                <TableRow key={row.id || index}>
                  {columns.map((col: any) => (
                    <TableCell key={`${col.accessorKey}-${row.id || index}`}>
                      {col.cell ? col.cell({ row }) : row[col.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Main Attendance Page Component
export default function AttendancePage() {
  const { user } = useAuth() as { user: any };
  const { classes, students, teachers, loading } = useSchoolData();
  const { toast } = useToast();

  // State for Marking Attendance
  const [date, setDate] = useState<Date>(new Date());
  const [attendanceType, setAttendanceType] = useState<"student" | "teacher">(
    "student"
  );
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [studentsToMark, setStudentsToMark] = useState<Student[]>([]);
  const [teachersToMark, setTeachersToMark] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Add new state variables inside the component
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [holidayYear, setHolidayYear] = useState(new Date().getFullYear());
  const [selectedHolidays, setSelectedHolidays] = useState<Date[]>([]);

  // State for UI control
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State for 'Cancel' functionality
  const [originalStudentsState, setOriginalStudentsState] = useState<Student[]>(
    []
  );
  const [originalTeachersState, setOriginalTeachersState] = useState<Teacher[]>(
    []
  );

  // State for Reports
  const [reportType, setReportType] = useState<"student" | "teacher">(
    "student"
  );
  const [reportTimePeriod, setReportTimePeriod] = useState<"month" | "term">(
    "month"
  );
  const [reportMonth, setReportMonth] = useState<string>(
    new Date().getMonth().toString()
  );
  const [reportYear, setReportYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [reportClass, setReportClass] = useState<string>("");
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSummary, setReportSummary] = useState<any>(null);
  const [showAttendanceReport, setShowAttendanceReport] = useState(false);

  const availableClasses = useMemo(() => {
    if (!classes.length || !user) return [];
    if (["school_admin", "super_admin"].includes(user.role)) {
      return classes;
    } else if (user.role === "staff") {
      const currentTeacher = teachers.find((t: any) => t.user_id === user.id);
      return currentTeacher
        ? classes.filter(
            (cls: any) => cls.class_teacher_id === currentTeacher.id
          )
        : [];
    }
    return [];
  }, [classes, user, teachers]);

  // Reset UI state when selection changes
  const resetAttendanceState = () => {
    setIsAttendanceMarked(false);
    setIsEditingAttendance(false);
    setStudentsToMark([]);
    setTeachersToMark([]);
    setSearchQuery("");
  };

  useEffect(() => {
    const fetchStudentAttendance = async () => {
      if (!selectedClass) {
        resetAttendanceState();
        return;
      }
      resetAttendanceState(); // Ensure clean state before fetch
      const classIdNum = parseInt(selectedClass);
      const classStudents = students.filter(
        (student: any) => student.class_id === classIdNum
      );

      try {
        const response = await fetch(
          `/api/classes/${selectedClass}/attendance?date=${date.toISOString()}`
        );
        if (!response.ok) throw new Error("API fetch failed");

        const attendanceData = await response.json();
        if (attendanceData && attendanceData.length > 0) {
          setIsAttendanceMarked(true);
          const studentsWithAttendance = classStudents.map((student: any) => {
            const record = attendanceData.find(
              (r: any) => r.student_id === student.id
            );
            return {
              ...student,
              present: record ? record.status === "present" : true,
            };
          });
          setStudentsToMark(studentsWithAttendance);
        } else {
          setIsAttendanceMarked(false);
          setStudentsToMark(
            classStudents.map((s: any) => ({ ...s, present: true }))
          );
        }
      } catch (error) {
        setIsAttendanceMarked(false);
        setStudentsToMark(
          classStudents.map((s: any) => ({ ...s, present: true }))
        );
      }
    };

    if (attendanceType === "student") {
      fetchStudentAttendance();
    }
  }, [selectedClass, date, students, attendanceType]);

  useEffect(() => {
    const fetchTeacherAttendance = async () => {
      if (!teachers.length || !user?.school_id) return;
      resetAttendanceState(); // Ensure clean state before fetch

      try {
        const response = await fetch(
          `/api/schools/${
            user.school_id
          }/teacher-attendance?date=${date.toISOString()}`
        );
        if (!response.ok) throw new Error("API fetch failed");

        const attendanceData = await response.json();
        if (attendanceData && attendanceData.length > 0) {
          setIsAttendanceMarked(true);
          const teachersWithAttendance = teachers.map((teacher: any) => {
            const record = attendanceData.find(
              (r: any) => r.teacher_id === teacher.id
            );
            return {
              ...teacher,
              present: record ? record.status === "present" : true,
            };
          });
          setTeachersToMark(teachersWithAttendance);
        } else {
          setIsAttendanceMarked(false);
          setTeachersToMark(
            teachers.map((t: any) => ({ ...t, present: true }))
          );
        }
      } catch (error) {
        setIsAttendanceMarked(false);
        setTeachersToMark(teachers.map((t: any) => ({ ...t, present: true })));
      }
    };

    if (attendanceType === "teacher") {
      fetchTeacherAttendance();
    }
  }, [attendanceType, date, teachers, user?.school_id]);

  // Handlers for interaction
  const toggleStudentAttendance = (studentId: number) => {
    setStudentsToMark((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, present: !s.present } : s))
    );
  };

  const toggleTeacherAttendance = (teacherId: number) => {
    setTeachersToMark((prev) =>
      prev.map((t) => (t.id === teacherId ? { ...t, present: !t.present } : t))
    );
  };

  const markAll = (present: boolean) => {
    if (attendanceType === "student") {
      setStudentsToMark(studentsToMark.map((s) => ({ ...s, present })));
    } else {
      setTeachersToMark(teachersToMark.map((t) => ({ ...t, present })));
    }
  };

  const handleReset = () => {
    // Re-trigger the appropriate useEffect to re-fetch original data
    if (attendanceType === "student") {
      const classIdNum = parseInt(selectedClass);
      const classStudents = students.filter(
        (student: any) => student.class_id === classIdNum
      );
      setStudentsToMark(classStudents.map((s) => ({ ...s, present: true })));
    } else {
      setTeachersToMark(teachers.map((t) => ({ ...t, present: true })));
    }
  };

  // API Interaction: Save (Create)
  const saveAttendance = async () => {
    setIsSaving(true);
    const isStudent = attendanceType === "student";
    const url = isStudent
      ? "/api/bulk-student-attendance"
      : "/api/bulk-teacher-attendance";
    const payload = isStudent
      ? studentsToMark.map((s) => ({
          student_id: s.id,
          roll_no: s.roll_no,
          class_id: parseInt(selectedClass),
          date: format(date, "yyyy-MM-dd"),
          day: format(date, "EEEE"),
          status: s.present ? "present" : "absent",
        }))
      : teachersToMark.map((t) => ({
          teacher_id: t.id,
          teacher_name: t.full_name,
          date: format(date, "yyyy-MM-dd"),
          day: format(date, "EEEE"),
          status: t.present ? "present" : "absent",
        }));

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("Payload ::", payload);
      if (!response.ok) throw new Error("Failed to save attendance");

      toast({
        title: "Attendance Saved ✅",
        description: "The records have been saved successfully.",
      });
      setIsAttendanceMarked(true);
    } catch (error) {
      toast({
        title: "Error ❌",
        description: "Could not save attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // API Interaction: Update
  const updateAttendance = async () => {
    setIsSaving(true);
    const isStudent = attendanceType === "student";
    const url = isStudent
      ? "/api/bulk-student-attendance"
      : "/api/bulk-teacher-attendance";
    const originalStateMap = new Map(
      (isStudent ? originalStudentsState : originalTeachersState).map((p) => [
        p.id,
        p.present,
      ])
    );

    const changedRecords = (isStudent ? studentsToMark : teachersToMark).filter(
      (p) => {
        const originalStatus = originalStateMap.get(p.id);
        return originalStatus !== undefined && p.present !== originalStatus;
      }
    );

    if (changedRecords.length === 0) {
      toast({
        title: "No Changes Detected",
        description: "You haven't made any changes.",
      });
      setIsSaving(false);
      setIsEditingAttendance(false);
      return;
    }

    const payload = isStudent
      ? (changedRecords as Student[]).map((s) => ({
          student_id: s.id,
          class_id: parseInt(selectedClass),
          date: format(date, "yyyy-MM-dd"),
          day: format(date, "EEEE"), // <-- ADD THIS LINE
          status: s.present ? "present" : "absent",
        }))
      : (changedRecords as Teacher[]).map((t) => ({
          teacher_id: t.id,
          teacher_name: t.full_name,
          date: format(date, "yyyy-MM-dd"),
          day: format(date, "EEEE"), // <-- ADD THIS LINE
          status: t.present ? "present" : "absent",
        }));
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("Payload update::", payload);
      if (!response.ok) throw new Error("Failed to update attendance");

      toast({
        title: "Attendance Updated ✅",
        description: `${changedRecords.length} record(s) have been saved.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed ❌",
        description: "Could not save changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setIsEditingAttendance(false);
    }
  };

  // Filtering and Calculated values
  const filteredPeople = useMemo(() => {
    const people =
      attendanceType === "student" ? studentsToMark : teachersToMark;
    if (!searchQuery) return people;
    return people.filter(
      (p) =>
        p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (attendanceType === "student" &&
          (p as Student).roll_no
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, studentsToMark, teachersToMark, attendanceType]);

  // Add this new handler function inside your AttendancePage component
  const handleSaveHolidays = async () => {
    if (!selectedHolidays) {
      toast({ title: "No dates selected", variant: "destructive" });
      return;
    }

    const allDates = new Set(
      selectedHolidays.map((d) => format(d, "yyyy-MM-dd"))
    );

    // Automatically add all Sundays for the year
    const yearStartDate = new Date(holidayYear, 0, 1);
    const yearEndDate = new Date(holidayYear, 11, 31);
    const daysInYear = eachDayOfInterval({
      start: yearStartDate,
      end: yearEndDate,
    });

    daysInYear.forEach((day) => {
      if (getDay(day) === 0) {
        // 0 is Sunday
        allDates.add(format(day, "yyyy-MM-dd"));
      }
    });

    const payload = {
      year: holidayYear,
      holidays: Array.from(allDates).map((dateStr) => ({
        date: dateStr,
        name: "Holiday/Sunday", // You can enhance the dialog to add names per date
      })),
    };

    try {
      const response = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to save holidays");

      toast({
        title: "Holidays Saved!",
        description: "The holiday calendar has been updated.",
      });
      setIsHolidayDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not save holidays.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = async () => {
    if (reportType === "student" && !reportClass) {
      toast({
        title: "Class Required",
        description: "Please select a class to generate a student report.",
        variant: "destructive",
      });
      return;
    }
    setReportLoading(true);
    setShowAttendanceReport(true);
    setReportData([]);
    setReportSummary(null);
    // Use URLSearchParams to build the query string
    const params = new URLSearchParams({
      reportType: reportType,
      periodType: reportTimePeriod, // Use 'monthly' or 'yearly'
      year: reportYear,
    });
    if (reportTimePeriod === "month") {
      params.append("month", reportMonth);
    }
    if (reportType === "student" && reportClass) {
      params.append("classId", reportClass);
    }
    try {
      const response = await fetch(
        `/api/reports/attendance?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch report data.");
      }
      const result = await response.json();
      console.log("report response ::", result);
      // Assuming the API returns data in the format: { data: [], summary: {} }
      setReportData(result.data || []);
      setReportSummary(result.summary || null);
    } catch (error) {
      console.log("report error ", error);
      toast({
        title: "Report Generation Failed",
        description:
          "Could not generate the report. Please check the API and try again.",
        variant: "destructive",
      });
      setShowAttendanceReport(false);
    } finally {
      setReportLoading(false);
    }
  };
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  // ---- JSX ----
  if (loading) {
    return (
      <DashboardLayout title="Attendance Management">
        <div className="container py-6 flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading school data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Attendance Management">
      <div className="container py-6">
        <Tabs defaultValue="mark">
          <TabsList className="mb-6">
            <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
            <TabsTrigger value="report">Attendance Reports</TabsTrigger>
          </TabsList>

          {/* Mark Attendance Tab */}
          <TabsContent value="mark">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
              <Card className="justify-items-center">
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-w-[270px]">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      className="rounded-md border w-full"
                      disabled={(d) => d > new Date()}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Select Group</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {["school_admin", "super_admin"].includes(user.role) && (
                    <Select
                      value={attendanceType}
                      onValueChange={(v) => setAttendanceType(v as any)}
                    >
                      {" "}
                      <p>Select Attendance Type</p>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <p>Select Class Type</p>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {attendanceType === "student" && (
                    <Select
                      onValueChange={setSelectedClass}
                      value={selectedClass}
                      disabled={availableClasses.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            availableClasses.length === 0
                              ? "No classes available"
                              : "Select a class"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableClasses.map((cls: any) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.grade} {cls.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* NEW: Add Holidays Button */}
                  <Dialog
                    open={isHolidayDialogOpen}
                    onOpenChange={setIsHolidayDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <CalendarIcon className="mr-2 h-4 w-4" /> Manage
                        Holidays
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Manage Holidays for {holidayYear}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <Calendar
                          mode="multiple"
                          selected={selectedHolidays}
                          // Change the onSelect handler like this:
                          onSelect={(days) => setSelectedHolidays(days || [])}
                          defaultMonth={new Date(holidayYear, 0)}
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          Select all holidays for the year. Sundays are added
                          automatically.
                        </p>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="ghost">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleSaveHolidays}>
                          Save Holidays
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    className="w-full"
                    onClick={() => markAll(true)}
                    disabled={
                      isAttendanceMarked ||
                      (attendanceType === "student" && !selectedClass)
                    }
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark All Present
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleReset}
                    disabled={
                      isAttendanceMarked ||
                      (attendanceType === "student" && !selectedClass)
                    }
                  >
                    <Clock className="mr-2 h-4 w-4" /> Reset Changes
                  </Button>
                  {!isAttendanceMarked && (
                    <Button
                      className="w-full"
                      onClick={saveAttendance}
                      disabled={
                        isSaving ||
                        (attendanceType === "student" && !selectedClass)
                      }
                    >
                      <Save className="mr-2 h-4 w-4" />{" "}
                      {isSaving ? "Saving..." : "Save Attendance"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {((attendanceType === "student" && selectedClass) ||
              attendanceType === "teacher") && (
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>
                      {isAttendanceMarked
                        ? "Daily Attendance"
                        : "Mark Attendance"}
                    </CardTitle>
                    <CardDescription>
                      {attendanceType === "student"
                        ? availableClasses.find(
                            (c) => c.id.toString() === selectedClass
                          )?.grade +
                          " " +
                          availableClasses.find(
                            (c) => c.id.toString() === selectedClass
                          )?.section
                        : "All Teachers"}{" "}
                      | {format(date, "EEEE, PPP")}
                    </CardDescription>
                  </div>
                  {isAttendanceMarked && !isEditingAttendance && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (attendanceType === "student")
                          setOriginalStudentsState(studentsToMark);
                        else setOriginalTeachersState(teachersToMark);
                        setIsEditingAttendance(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Button>
                  )}
                  {isEditingAttendance && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (attendanceType === "student")
                          setStudentsToMark(originalStudentsState);
                        else setTeachersToMark(originalTeachersState);
                        setIsEditingAttendance(false);
                      }}
                    >
                      <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="relative w-full md:w-1/3 mb-4">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or roll no..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  {filteredPeople.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredPeople.map((person) => (
                        <div
                          key={person.id}
                          className="border rounded-lg p-4 flex flex-row items-center gap-5"
                        >
                          <img
                            src={
                              attendanceType === "student"
                                ? "https://cdn-icons-png.flaticon.com/512/4196/4196591.png"
                                : "https://cdn-icons-png.flaticon.com/512/4288/4288270.png"
                            }
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="w-px bg-blue-500 self-stretch" />
                          <div className="flex flex-col justify-between h-full w-full">
                            <div>
                              <p className="font-bold text-lg">
                                {person.full_name}
                              </p>
                              {attendanceType === "student" && (
                                <p className="text-sm text-muted-foreground">
                                  Roll No: {(person as Student).roll_no || "NA"}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center mt-2 gap-3">
                              <h2 className="text-sm font-medium">Status:</h2>
                              {isEditingAttendance || !isAttendanceMarked ? (
                                <div className="flex items-center space-x-2">
                                  <Label htmlFor={`att-switch-${person.id}`}>
                                    {person.present ? "Present" : "Absent"}
                                  </Label>
                                  <Switch
                                    id={`att-switch-${person.id}`}
                                    checked={person.present}
                                    onCheckedChange={() =>
                                      attendanceType === "student"
                                        ? toggleStudentAttendance(person.id)
                                        : toggleTeacherAttendance(person.id)
                                    }
                                  />
                                </div>
                              ) : (
                                <Badge
                                  variant={
                                    person.present ? "default" : "destructive"
                                  }
                                >
                                  {person.present ? "Present" : "Absent"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No results found.
                    </p>
                  )}
                </CardContent>
                {isEditingAttendance && (
                  <CardFooter className="flex justify-end">
                    <Button onClick={updateAttendance} disabled={isSaving}>
                      {isSaving ? "Updating..." : "Update Attendance"}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )}
          </TabsContent>

          {/* Tab 2: Attendance Reports (The component calls this 'Tab 3' in comments, but it's the 2nd visible tab) */}
          <TabsContent value="report">
            {/* The report section JSX remains unchanged as its logic was already sound, pending the fetch implementation */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Report Options</CardTitle>
                  <CardDescription>Configure attendance report</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select
                      value={reportType}
                      onValueChange={(v) => setReportType(v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Time Period</Label>
                    {/* The 'reportTimePeriod' state is now for 'monthly' or 'yearly' */}
                    <Select
                      value={reportTimePeriod}
                      onValueChange={(v) => setReportTimePeriod(v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Conditionally show month dropdown only for monthly reports */}
                  {reportTimePeriod === "month" && (
                    <div className="space-y-2">
                      <Label>Month</Label>
                      <Select
                        value={reportMonth}
                        onValueChange={setReportMonth}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month, index) => (
                            <SelectItem key={month} value={index.toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {reportType === "student" && (
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Select
                        value={reportClass}
                        onValueChange={setReportClass}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableClasses.map((cls: any) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.grade} {cls.section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={handleGenerateReport}
                    disabled={reportLoading}
                  >
                    {reportLoading ? "Generating..." : "Generate Report"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={reportData.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" /> Export Report
                  </Button>
                </CardContent>
              </Card>
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>Attendance Report</CardTitle>
                  {showAttendanceReport && (
                    <CardDescription>
                      {reportType === "student" && reportClass
                        ? `${
                            availableClasses.find(
                              (c) => c.id.toString() === reportClass
                            )?.grade
                          } ${
                            availableClasses.find(
                              (c) => c.id.toString() === reportClass
                            )?.section
                          }`
                        : "All Teachers"}{" "}
                      | {months[parseInt(reportMonth)]} {reportYear}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {!showAttendanceReport ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Generate a Report</h3>
                      <p>Select options from the left to create a report.</p>
                    </div>
                  ) : reportLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2">Fetching report data...</p>
                    </div>
                  ) : (
                    <>
                      <DataTable
                        data={reportData}
                        columns={
                          reportType === "student"
                            ? [
                                { header: "Name", accessorKey: "name" },
                                {
                                  header: "Roll No",
                                  accessorKey: "roll_no",
                                },
                                {
                                  header: "Present Days",
                                  accessorKey: "daysPresent",
                                  cell: ({ row }: any) =>
                                    `${row.daysPresent}/${reportSummary.totalWorkingDays}`,
                                },
                                {
                                  header: "Percentage",
                                  accessorKey: "percentage",
                                  cell: ({ row }: any) => `${row.percentage}%`,
                                },
                              ]
                            : [
                                { header: "Name", accessorKey: "name" },

                                {
                                  header: "Present Days",
                                  accessorKey: "daysPresent",
                                  cell: ({ row }: any) =>
                                    `${row.daysPresent}/${reportSummary.totalWorkingDays}`,
                                },
                                {
                                  header: "Percentage",
                                  accessorKey: "percentage",
                                  cell: ({ row }: any) => `${row.percentage}%`,
                                },
                              ]
                        }
                        searchPlaceholder={`Search ${reportType}s...`}
                      />
                      {reportSummary && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-green-50 p-4 rounded-md">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <span className="font-medium">
                                Good ({">"}=90%)
                              </span>
                            </div>
                            <p className="text-2xl font-bold mt-2">
                              {reportSummary.good} {reportType}s
                            </p>
                          </div>
                          <div className="bg-amber-50 p-4 rounded-md">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="h-5 w-5 text-amber-600" />
                              <span className="font-medium">
                                Average (75-89%)
                              </span>
                            </div>
                            <p className="text-2xl font-bold mt-2">
                              {reportSummary.average} {reportType}s
                            </p>
                          </div>
                          <div className="bg-red-50 p-4 rounded-md">
                            <div className="flex items-center space-x-2">
                              <XCircle className="h-5 w-5 text-red-600" />
                              <span className="font-medium">
                                Poor ({"<"}75%)
                              </span>
                            </div>
                            <p className="text-2xl font-bold mt-2">
                              {reportSummary.poor} {reportType}s
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
