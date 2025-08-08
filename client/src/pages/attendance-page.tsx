import { useEffect, useState, useMemo, ChangeEvent } from "react";
import { format } from "date-fns";
import DashboardLayout from "@/layout/dashboard-layout";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
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
  UserCircle,
  MoreVertical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolData } from "@/context/SchoolDataContext";
import { Switch } from "@/components/ui/switch";
import { CardFooter } from "@/components/ui/card";
import { Pencil, X } from "lucide-react";
// Interfaces for our data structures
interface Student {
  id: number;
  full_name: string;
  roll_number?: string;
  class_id: number;
  present: boolean;
}

interface Class {
  id: number;
  grade: string;
  section: string;
  class_teacher_id?: number;
  class_teacher_name?: string;
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
  onSearch?: (query: string) => void;
}

// A basic DataTable component for displaying reports
const DataTable = ({
  data,
  columns,
  searchPlaceholder,
  onSearch,
}: DataTableProps) => {
  const [filter, setFilter] = useState("");

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setFilter(query);
    if (onSearch) {
      onSearch(query);
    }
  };

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
            onChange={handleSearchChange}
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

export default function AttendancePage() {
  const { user } = useAuth() as { user: any };
  const { classes, students, teachers, loading } = useSchoolData();
  const { toast } = useToast();
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);
  const [originalStudentsState, setOriginalStudentsState] = useState<Student[]>(
    []
  );
  // State for Marking Attendance
  const [date, setDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [studentsToMark, setStudentsToMark] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [attendanceType, setAttendanceType] = useState<"student" | "teacher">(
    "student"
  );
  const [teachersToMark, setTeachersToMark] = useState<Teacher[]>([]);

  // State for Reports
  const [reportType, setReportType] = useState<"student" | "teacher">(
    "student"
  );
  const [reportTimePeriod, setReportTimePeriod] = useState<
    "week" | "month" | "term"
  >("month");
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

  const currentTeacher = useMemo(() => {
    if (!user || !teachers.length) return null;
    return teachers.find((t: any) => t.user_id === user.id);
  }, [user, teachers]);

  const availableClasses = useMemo(() => {
    if (!classes.length) return [];
    if (user?.role === "school_admin" || user?.role === "super_admin") {
      return classes;
    } else if (user?.role === "staff" && currentTeacher) {
      return classes.filter(
        (cls: any) => cls.class_teacher_id === currentTeacher.id
      );
    }
    return [];
  }, [classes, user, currentTeacher]);

  // Fetch student attendance when class or date changes
  useEffect(() => {
    const fetchStudentAttendance = async () => {
      if (!selectedClass) {
        setStudentsToMark([]);
        return;
      }
      const classIdNum = parseInt(selectedClass);
      const classStudents = students.filter(
        (student: any) => student.class_id === classIdNum
      );

      try {
        const response = await fetch(
          `/api/classes/${selectedClass}/attendance?date=${date.toISOString()}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch attendance data");
        }
        const attendanceData = await response.json();

        const studentsWithAttendance = classStudents.map((student: any) => {
          const attendanceRecord = attendanceData.find(
            (record: any) => record.student_id === student.id
          );
          return {
            ...student,
            present: attendanceRecord
              ? attendanceRecord.status === "present"
              : true, // Default to present if no record found
          };
        });
        setStudentsToMark(studentsWithAttendance);
      } catch (error) {
        // On error or if no records exist, default all to present
        setStudentsToMark(
          classStudents.map((s: any) => ({ ...s, present: true }))
        );
      }
    };

    if (attendanceType === "student") {
      fetchStudentAttendance();
    }
  }, [selectedClass, date, students, attendanceType]);

  // Fetch teacher attendance when date changes
  useEffect(() => {
    const fetchTeacherAttendance = async () => {
      if (!teachers.length || !user?.school_id) return;

      try {
        const response = await fetch(
          `/api/schools/${
            user.school_id
          }/teacher-attendance?date=${date.toISOString()}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch teacher attendance");
        }
        const attendanceData = await response.json();
        const teachersWithAttendance = teachers.map((teacher: any) => {
          const attendanceRecord = attendanceData.find(
            (record: any) => record.teacher_id === teacher.id
          );
          return {
            ...teacher,
            present: attendanceRecord
              ? attendanceRecord.status === "present"
              : true,
          };
        });
        setTeachersToMark(teachersWithAttendance);
      } catch (error) {
        setTeachersToMark(teachers.map((t: any) => ({ ...t, present: true })));
      }
    };

    if (attendanceType === "teacher") {
      fetchTeacherAttendance();
    }
  }, [attendanceType, date, teachers, user?.school_id]);

  const toggleStudentAttendance = (studentId: number) => {
    setStudentsToMark((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, present: !student.present }
          : student
      )
    );
  };

  const toggleTeacherAttendance = (teacherId: number) => {
    setTeachersToMark((prev) =>
      prev.map((teacher) =>
        teacher.id === teacherId
          ? { ...teacher, present: !teacher.present }
          : teacher
      )
    );
  };

  const markAllStudentsPresent = () => {
    setStudentsToMark((prev) =>
      prev.map((student) => ({ ...student, present: true }))
    );
  };

  const markAllTeachersPresent = () => {
    setTeachersToMark((prev) =>
      prev.map((teacher) => ({ ...teacher, present: true }))
    );
  };

  const saveStudentAttendance = async () => {
    setIsSaving(true);
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const classId = parseInt(selectedClass);

      // Step 1: Check if attendance already exists
      const checkResponse = await fetch(
        `/api/classes/${classId}/attendance?date=${formattedDate}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!checkResponse.ok) {
        throw new Error("Failed to check existing attendance");
      }

      const existingAttendance = await checkResponse.json();

      if (existingAttendance && existingAttendance.length > 0) {
        toast({
          title: "Already Marked",
          description: `Attendance for ${format(
            date,
            "PPP"
          )} has already been recorded.`,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
      const attendanceData = studentsToMark.map((student) => ({
        student_id: student.id,
        class_id: parseInt(selectedClass),
        date: format(date, "yyyy-MM-dd"),
        status: student.present ? "present" : "absent",
      }));
      const response = await fetch(`/api/bulk-student-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceData),
      });

      if (!response.ok) throw new Error("Failed to save attendance");

      toast({
        title: "Attendance Saved",
        description: `Attendance for ${format(date, "PPP")} has been recorded.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveTeacherAttendance = async () => {
    setIsSaving(true);
    try {
      const formattedDate = format(date, "yyyy-MM-dd");

      // We don't need to check for existing attendance here,
      // as the backend should handle upserts or throw errors if duplication is not allowed.
      // The initial fetch already informs the user if data exists.

      const attendanceData = teachersToMark.map((teacher) => ({
        teacher_id: teacher.id,
        date: formattedDate,
        status: teacher.present ? "present" : "absent",
      }));

      const response = await fetch(`/api/bulk-teacher-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceData),
      });

      if (!response.ok) {
        throw new Error("Failed to save teacher attendance");
      }

      toast({
        title: "Teacher Attendance Saved",
        description: `Teacher attendance for ${format(
          date,
          "PPP"
        )} has been recorded.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save teacher attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  const updateStudentAttendance = async () => {
    setIsSaving(true);
    try {
      // Create a map of the original state for efficient lookups
      const originalStateMap = new Map(
        originalStudentsState.map((student) => [student.id, student.present])
      );

      // NEW: Filter the list to find only the students whose status has changed
      const changedStudents = studentsToMark.filter((student) => {
        const originalStatus = originalStateMap.get(student.id);
        // A student's record has changed if their current 'present' status
        // is different from what it was when "Edit" was clicked.
        return (
          originalStatus !== undefined && student.present !== originalStatus
        );
      });

      // If no changes were made, inform the user and stop.
      if (changedStudents.length === 0) {
        toast({
          title: "No Changes Detected",
          description: "You haven't made any changes to the attendance.",
        });
        setIsSaving(false);
        return;
      }

      // Prepare the data payload using ONLY the changed records
      const attendanceData = changedStudents.map((student) => ({
        student_id: student.id,
        class_id: parseInt(selectedClass),
        date: format(date, "yyyy-MM-dd"),
        status: student.present ? "present" : "absent",
      }));

      console.log(
        "Sending only updated records to the server:",
        attendanceData
      );

      // Call the PUT endpoint with the smaller, optimized payload
      const response = await fetch(`/api/bulk-student-attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceData),
      });

      if (!response.ok) {
        throw new Error("Failed to update attendance records");
      }

      // After a successful update, the new state becomes the original for the next edit session
      setOriginalStudentsState(studentsToMark);

      toast({
        title: "Attendance Updated ✅",
        description: `${changedStudents.length} record(s) have been saved successfully.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed ❌",
        description: "Could not save the attendance changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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

    try {
      // FIX: Replace mock data generation with a real API call.
      const params = new URLSearchParams({
        reportType: reportType,
        timePeriod: reportTimePeriod,
        month: reportMonth,
        year: reportYear,
      });
      if (reportType === "student" && reportClass) {
        params.append("classId", reportClass);
      }

      const response = await fetch(
        `/api/reports/attendance?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch report data.");
      }
      const result = await response.json();

      // Assuming the API returns data in the format: { data: [], summary: {} }
      setReportData(result.data || []);
      setReportSummary(result.summary || null);
    } catch (error) {
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

  // Add this function alongside your other state management functions
  const setStudentAttendance = (studentId: number, status: boolean) => {
    setStudentsToMark((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, present: status } : student
      )
    );
  };
  const filteredStudents = studentsToMark.filter(
    (student: any) =>
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.roll_number &&
        student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const presentCount = studentsToMark.filter((s) => s.present).length;
  const absentCount = studentsToMark.length - presentCount;
  const attendancePercentage =
    studentsToMark.length > 0
      ? Math.round((presentCount / studentsToMark.length) * 100)
      : 0;

  const teacherPresentCount = teachersToMark.filter((t) => t.present).length;
  const teacherAbsentCount = teachersToMark.length - teacherPresentCount;
  const teacherAttendancePercentage =
    teachersToMark.length > 0
      ? Math.round((teacherPresentCount / teachersToMark.length) * 100)
      : 0;

  const canMarkAttendance = ["school_admin", "super_admin", "staff"].includes(
    user?.role || ""
  );

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

  // The rest of the JSX remains the same, with one key change to the save button's onClick.
  return (
    <DashboardLayout title="Attendance Management">
      <div className="container py-6">
        <Tabs defaultValue={canMarkAttendance ? "mark" : "report"}>
          <TabsList className="mb-6">
            <TabsTrigger value="mark" disabled={!canMarkAttendance}>
              Mark Attendance
            </TabsTrigger>
            <TabsTrigger value="report">Attendance Reports</TabsTrigger>
          </TabsList>

          {/* Tab 1: Mark Attendance */}
          <TabsContent value="mark">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                  <CardDescription>Choose the attendance date</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    className="rounded-md border"
                    disabled={(d) =>
                      d > new Date() || d < new Date("2023-01-01")
                    }
                  />
                  <p className="mt-4 text-sm text-muted-foreground text-center">
                    Marking attendance for:{" "}
                    <span className="font-medium">{format(date, "PPP")}</span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mark Attendance</CardTitle>
                  <CardDescription>Select category and class</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(user?.role === "school_admin" ||
                    user?.role === "super_admin") && (
                    <Select
                      value={attendanceType}
                      onValueChange={(value) => {
                        setAttendanceType(value as "student" | "teacher");
                        setSelectedClass("");
                        setStudentsToMark([]);
                        setTeachersToMark([]);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {attendanceType === "student" && (
                    <>
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
                      {selectedClass && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800"
                            >
                              Present: {presentCount}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-800"
                            >
                              Absent: {absentCount}
                            </Badge>
                          </div>
                          <Progress
                            value={attendancePercentage}
                            className="h-2"
                          />
                          <p className="text-sm text-muted-foreground">
                            Attendance:{" "}
                            <span className="font-medium">
                              {attendancePercentage}%
                            </span>
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  {attendanceType === "teacher" && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800"
                        >
                          Present: {teacherPresentCount}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-red-100 text-red-800"
                        >
                          Absent: {teacherAbsentCount}
                        </Badge>
                      </div>
                      <Progress
                        value={teacherAttendancePercentage}
                        className="h-2"
                      />
                      <p className="text-sm text-muted-foreground">
                        Attendance:{" "}
                        <span className="font-medium">
                          {teacherAttendancePercentage}%
                        </span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>Manage attendance entries</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full"
                    onClick={
                      attendanceType === "teacher"
                        ? markAllTeachersPresent
                        : markAllStudentsPresent
                    }
                    disabled={
                      (attendanceType === "student" &&
                        (!selectedClass || studentsToMark.length === 0)) ||
                      (attendanceType === "teacher" &&
                        teachersToMark.length === 0)
                    }
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark All Present
                  </Button>

                  {/* The Reset button re-triggers the data fetch useEffects by changing state */}
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      if (attendanceType === "student" && selectedClass) {
                        // Re-trigger the student fetch useEffect
                        setDate(new Date(date.getTime()));
                      } else if (attendanceType === "teacher") {
                        // Re-trigger the teacher fetch useEffect
                        setDate(new Date(date.getTime()));
                      }
                    }}
                    disabled={
                      attendanceType === "student"
                        ? !selectedClass || studentsToMark.length === 0
                        : teachersToMark.length === 0
                    }
                  >
                    <Clock className="mr-2 h-4 w-4" /> Reset Changes
                  </Button>

                  {/* FIX: The onClick handler now points to the correct, refactored functions */}
                  <Button
                    className="w-full"
                    variant="default"
                    onClick={
                      attendanceType === "teacher"
                        ? saveTeacherAttendance
                        : saveStudentAttendance
                    }
                    disabled={
                      (attendanceType === "student"
                        ? !selectedClass || studentsToMark.length === 0
                        : teachersToMark.length === 0) || isSaving
                    }
                  >
                    <Save className="mr-2 h-4 w-4" />{" "}
                    {isSaving ? "Saving..." : "Save Attendance"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {attendanceType === "student" && selectedClass && (
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Mark Student Attendance</CardTitle>
                    <CardDescription>
                      {
                        availableClasses.find(
                          (c) => c.id.toString() === selectedClass
                        )?.grade
                      }{" "}
                      {
                        availableClasses.find(
                          (c) => c.id.toString() === selectedClass
                        )?.section
                      }{" "}
                      | {format(date, "PPP")}
                    </CardDescription>
                  </div>

                  {/* NEW: Edit/Cancel Button in the top right */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (isEditingAttendance) {
                        // If CANCEL is clicked, revert changes to the original state
                        setStudentsToMark(originalStudentsState);
                        setIsEditingAttendance(false);
                      } else {
                        // If EDIT is clicked, save the current state as the original
                        setOriginalStudentsState(studentsToMark);
                        setIsEditingAttendance(true);
                      }
                    }}
                  >
                    {isEditingAttendance ? (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </>
                    )}
                  </Button>
                </CardHeader>

                <CardContent>
                  {filteredStudents.length > 0 ? (
                    // NEW: Responsive grid layout to utilize width
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          className="border rounded-lg p-4 flex flex-col justify-between"
                        >
                          {/* Student Info Section */}
                          <div>
                            <p className="font-bold text-lg">
                              {student.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Roll No: {student.roll_number || "NA"}
                            </p>
                          </div>

                          {/* NEW: Conditional display for Read-only vs. Edit mode */}
                          <div className="flex items-center justify-between mt-4">
                            <p className="text-sm font-medium">Status:</p>
                            {isEditingAttendance ? (
                              // EDIT MODE: Show a toggle switch
                              <div className="flex items-center space-x-2">
                                <Label htmlFor={`att-switch-${student.id}`}>
                                  {student.present ? "Present" : "Absent"}
                                </Label>
                                <Switch
                                  id={`att-switch-${student.id}`}
                                  checked={student.present}
                                  onCheckedChange={() =>
                                    toggleStudentAttendance(student.id)
                                  }
                                />
                              </div>
                            ) : (
                              // READ-ONLY MODE: Show a status badge
                              <Badge
                                variant={
                                  student.present ? "default" : "destructive"
                                }
                              >
                                {student.present ? "Present" : "Absent"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      {studentsToMark.length > 0
                        ? "No students match your search."
                        : "No students in this class."}
                    </p>
                  )}
                </CardContent>

                {/* NEW: CardFooter with Update button, only shows in Edit Mode */}
                {isEditingAttendance && (
                  <CardFooter className="flex justify-end">
                    <Button
                      onClick={async () => {
                        await updateStudentAttendance();
                        setIsEditingAttendance(false);
                      }}
                      disabled={isSaving}
                    >
                      {isSaving ? "Updating..." : "Update Attendance"}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )}
            {attendanceType === "teacher" && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Mark Teacher Attendance</CardTitle>
                  <CardDescription>
                    All Teachers | {format(date, "PPP")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teachersToMark.length > 0 ? (
                    teachersToMark.map((teacher) => (
                      <div
                        key={teacher.id}
                        className="flex items-center justify-between p-2 border rounded-md mb-2"
                      >
                        <p className="font-medium">{teacher.full_name}</p>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`t-att-${teacher.id}`}
                            checked={teacher.present}
                            onCheckedChange={() =>
                              toggleTeacherAttendance(teacher.id)
                            }
                          />
                          <Label htmlFor={`t-att-${teacher.id}`}>
                            {teacher.present ? "Present" : "Absent"}
                          </Label>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No teachers found.
                    </p>
                  )}
                </CardContent>
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
                    <Select
                      value={reportTimePeriod}
                      onValueChange={(v) => setReportTimePeriod(v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Weekly</SelectItem>
                        <SelectItem value="month">Monthly</SelectItem>
                        <SelectItem value="term">Term-wise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Select value={reportMonth} onValueChange={setReportMonth}>
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
                                  accessorKey: "rollNumber",
                                },
                                {
                                  header: "Present Days",
                                  accessorKey: "daysPresent",
                                  cell: ({ row }: any) =>
                                    `${row.daysPresent}/${reportSummary.totalSchoolDays}`,
                                },
                                {
                                  header: "Percentage",
                                  accessorKey: "percentage",
                                  cell: ({ row }: any) => `${row.percentage}%`,
                                },
                              ]
                            : [
                                { header: "Name", accessorKey: "name" },
                                { header: "Subject", accessorKey: "subject" },
                                {
                                  header: "Present Days",
                                  accessorKey: "daysPresent",
                                  cell: ({ row }: any) =>
                                    `${row.daysPresent}/${reportSummary.totalSchoolDays}`,
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
