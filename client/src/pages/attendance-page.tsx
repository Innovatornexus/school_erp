import { useEffect, useState, useMemo } from "react";
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
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Save,
  Search,
  User,
  Users,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolData } from "@/context/SchoolDataContext";

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
}

export default function AttendancePage() {
  const { user } = useAuth() as { user: any };
  const { classes, students, teachers, loading } = useSchoolData();
  const { toast } = useToast();

  console.log("Teachers from useSchoolData:", teachers);

  const [date, setDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [studentsToMark, setStudentsToMark] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAttendanceReport, setShowAttendanceReport] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [attendanceType, setAttendanceType] = useState<"student" | "teacher">(
    "student"
  );
  const [teachersToMark, setTeachersToMark] = useState<any[]>([]);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");

  // State for View Attendance tab
  const [viewingDate, setViewingDate] = useState<Date>(new Date());
  const [viewingAttendanceType, setViewingAttendanceType] = useState<
    "student" | "teacher"
  >("student");
  const [viewingSelectedClass, setViewingSelectedClass] = useState<string>("");
  const [viewingStudentAttendanceData, setViewingStudentAttendanceData] =
    useState<any[]>([]);
  const [viewingTeacherAttendanceData, setViewingTeacherAttendanceData] =
    useState<any[]>([]);
  const [viewingSearchQuery, setViewingSearchQuery] = useState("");

  // Get current teacher based on logged-in user
  const currentTeacher = useMemo(() => {
    if (!user || !teachers.length) return null;
    return teachers.find((t: any) => t.user_id === user.id);
  }, [user, teachers]);

  // Filter classes based on user role
  const availableClasses = useMemo(() => {
    if (!classes.length) return [];

    if (user?.role === "school_admin" || user?.role === "super_admin") {
      // Admins can see all classes
      return classes;
    } else if (user?.role === "staff" && currentTeacher) {
      // Teachers can only see classes where they are the class teacher
      return classes.filter(
        (cls: any) => cls.class_teacher_id === currentTeacher.id
      );
    }

    return [];
  }, [classes, user, currentTeacher]);

  // Get students for selected class
  const getClassStudents = (classId: string) => {
    const classIdNum = parseInt(classId);
    return students.filter((student: any) => student.class_id === classIdNum);
  };

  // Get all teachers for attendance
  const getAllTeachers = () => {
    return teachers.map((teacher: any) => ({
      ...teacher,
      present: true,
    }));
  };

  // Toggle teacher attendance
  const toggleTeacherAttendance = (teacherId: number) => {
    setTeachersToMark((prev: any[]) =>
      prev.map((teacher) =>
        teacher.id === teacherId
          ? { ...teacher, present: !teacher.present }
          : teacher
      )
    );
  };

  // Mark all teachers as present
  const markAllTeachersPresent = () => {
    setTeachersToMark((prev: any[]) =>
      prev.map((teacher) => ({ ...teacher, present: true }))
    );
  };

  // Handle class selection
  const handleClassChange = async (classId: string) => {
    setSelectedClass(classId);
    const classStudents = getClassStudents(classId);

    try {
      const response = await fetch(
        `/api/classes/${classId}/attendance?date=${date.toISOString()}`
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
            : true,
        };
      });
      setStudentsToMark(studentsWithAttendance);
    } catch (error) {
      setStudentsToMark(
        classStudents.map((s: any) => ({ ...s, present: true }))
      );
    }
  };

  // Handle viewing attendance
  const handleViewAttendance = async () => {
    console.log("Attempting to view attendance...");
    console.log("Selected class:", viewingSelectedClass);
    console.log("Date:", viewingDate);
    console.log("Attendance type:", viewingAttendanceType);
    console.log("User role:", user?.role);

    setViewingStudentAttendanceData([]);
    setViewingTeacherAttendanceData([]);

    try {
      if (viewingAttendanceType === "student") {
        let studentAttendanceResponse;

        if (user?.role === "school_admin" || user?.role === "super_admin") {
          // Admin can view all classes or specific class
          if (viewingSelectedClass) {
            console.log(
              "Admin viewing student attendance for selected class..."
            );
            studentAttendanceResponse = await fetch(
              `/api/classes/${viewingSelectedClass}/attendance?date=${viewingDate.toISOString()}`
            );
          } else {
            console.log("Admin viewing all student attendance...");
            studentAttendanceResponse = await fetch(
              `/api/schools/${
                user.school_id
              }/student-attendance?date=${viewingDate.toISOString()}`
            );
          }
        } else if (user?.role === "staff") {
          // Staff can only view their assigned classes
          if (viewingSelectedClass) {
            console.log(
              "Staff viewing student attendance for selected class..."
            );
            studentAttendanceResponse = await fetch(
              `/api/classes/${viewingSelectedClass}/attendance?date=${viewingDate.toISOString()}`
            );
          } else {
            // Show message to select a class
            toast({
              title: "Select Class",
              description: "Please select a class to view attendance.",
              variant: "default",
            });
            return;
          }
        } else {
          throw new Error("Invalid role for student attendance.");
        }

        if (!studentAttendanceResponse.ok) {
          throw new Error("Failed to fetch student attendance data");
        }
        const data = await studentAttendanceResponse.json();
        console.log("Fetched student attendance data:", data);

        if (data.length === 0) {
          toast({
            title: "No Data",
            description:
              "No attendance records found for the selected date and class.",
            variant: "default",
          });
        }

        setViewingStudentAttendanceData(data);
      } else if (viewingAttendanceType === "teacher") {
        let teacherAttendanceResponse;

        if (user?.role === "school_admin" || user?.role === "super_admin") {
          // Admin can view all teacher attendance
          console.log("Admin viewing all teacher attendance...");
          teacherAttendanceResponse = await fetch(
            `/api/schools/${
              user.school_id
            }/teacher-attendance?date=${viewingDate.toISOString()}`
          );
        } else if (user?.role === "staff") {
          // Staff can only view their assigned classes
          if (viewingSelectedClass) {
            console.log("Staff viewing teachers for selected class...");
            teacherAttendanceResponse = await fetch(
              `/api/classes/${viewingSelectedClass}/teachers`
            );
          } else {
            // Show message to select a class
            toast({
              title: "Select Class",
              description: "Please select a class to view teacher attendance.",
              variant: "default",
            });
            return;
          }
        } else {
          throw new Error("Invalid role for teacher attendance.");
        }

        if (!teacherAttendanceResponse.ok) {
          throw new Error("Failed to fetch teacher attendance data");
        }
        const data = await teacherAttendanceResponse.json();
        console.log("Fetched teacher attendance data:", data);

        if (data.length === 0) {
          toast({
            title: "No Data",
            description: "No attendance records found for the selected date.",
            variant: "default",
          });
        }

        setViewingTeacherAttendanceData(data);
      }
    } catch (error) {
      console.error("Error viewing attendance:", error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load teachers when attendance type changes to teacher
  useEffect(() => {
    console.log("attendanceType changed:", attendanceType);
    if (attendanceType === "teacher" && teachers.length > 0) {
      console.log("Populating teachersToMark with:", teachers);
      setTeachersToMark(getAllTeachers());
    }
  }, [attendanceType, teachers]);

  // Effect to load attendance data when viewingDate, viewingAttendanceType, or viewingSelectedClass changes
  useEffect(() => {
    if (viewingDate && user?.school_id) {
      handleViewAttendance();
    }
  }, [
    viewingDate,
    viewingAttendanceType,
    viewingSelectedClass,
    user?.school_id,
  ]);

  // Effect to load attendance data when viewingDate, viewingAttendanceType, or viewingSelectedClass changes
  useEffect(() => {
    if (viewingDate && user?.school_id) {
      handleViewAttendance();
    }
  }, [
    viewingDate,
    viewingAttendanceType,
    viewingSelectedClass,
    user?.school_id,
  ]);

  console.log("teachersToMark state:", teachersToMark);

  // Toggle student attendance
  const toggleAttendance = (studentId: number) => {
    setStudentsToMark((prev: any[]) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, present: !student.present }
          : student
      )
    );
  };

  // Mark all as present
  const markAllPresent = () => {
    setStudentsToMark((prev: any[]) =>
      prev.map((student) => ({ ...student, present: true }))
    );
  };

  // Save attendance records
  const saveAttendance = async () => {
    setIsSaving(true);

    try {
      const attendanceData = studentsToMark.map((student) => ({
        student_id: student.id,
        class_id: parseInt(selectedClass),
        date: format(date, "yyyy-MM-dd"),
        status: student.present ? "present" : "absent",
        entry_id: user?.id || 0,
        entry_name: user?.name || "Unknown",
      }));
      console.log("Attendance Data:", attendanceData);
      const response = await fetch(`/api/bulk-student-attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(attendanceData),
      });

      if (!response.ok) {
        throw new Error("Failed to save attendance");
      }

      toast({
        title: "Attendance Saved",
        description: `Attendance for ${format(
          date,
          "PPP"
        )} has been recorded successfully.`,
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
      const attendanceData = teachersToMark.map((teacher) => ({
        teacher_id: teacher.id,
        date: format(date, "yyyy-MM-dd"),
        status: teacher.present ? "present" : "absent",
        entry_id: user?.id || 0,
        entry_name: user?.name || "Unknown",
      }));
      console.log("Teacher Attendance Data:", attendanceData);
      const response = await fetch(`/api/bulk-teacher-attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        )} has been recorded successfully.`,
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

  // Filter students by search query
  const filteredStudents = studentsToMark.filter(
    (student: any) =>
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.roll_number &&
        student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate attendance statistics
  const presentCount = studentsToMark.filter((s) => s.present).length;
  const absentCount = studentsToMark.length - presentCount;
  const attendancePercentage =
    studentsToMark.length > 0
      ? Math.round((presentCount / studentsToMark.length) * 100)
      : 0;

  // Calculate teacher attendance statistics
  const teacherPresentCount = teachersToMark.filter((t) => t.present).length;
  const teacherAbsentCount = teachersToMark.length - teacherPresentCount;
  const teacherAttendancePercentage =
    teachersToMark.length > 0
      ? Math.round((teacherPresentCount / teachersToMark.length) * 100)
      : 0;

  // Check if user can mark attendance
  const canMarkAttendance = ["school_admin", "super_admin", "staff"].includes(
    user?.role || ""
  );

  if (loading) {
    return (
      <DashboardLayout title="Attendance Management">
        <div className="container py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">
                Loading attendance data...
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Attendance Management">
      <div className="container py-6">
        <Tabs defaultValue={canMarkAttendance ? "mark" : "view"}>
          <TabsList className="mb-6">
            <TabsTrigger value="mark" disabled={!canMarkAttendance}>
              Mark Attendance
            </TabsTrigger>
            <TabsTrigger value="view">View Attendance</TabsTrigger>
            <TabsTrigger value="report">Attendance Reports</TabsTrigger>
          </TabsList>

          {/* Tab 1: Mark Attendance */}
          <TabsContent value="mark">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Date Picker */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                  <CardDescription>Choose the attendance date</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center items-center space-x-2">
                    <Calendar
                      mode="single"
                      selected={viewingDate}
                      onSelect={(date) => date && setViewingDate(date)}
                      className="rounded-md border"
                      disabled={(date) =>
                        date > new Date() || date < new Date("2023-01-01")
                      }
                    />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground text-center">
                    Marking attendance for:{" "}
                    <span className="font-medium">{format(date, "PPP")}</span>
                  </p>
                </CardContent>
              </Card>

              {/* Middle Column - Attendance Type and Class Selection for Admin */}
              {(user?.role === "school_admin" ||
                user?.role === "super_admin") && (
                <Card>
                  <CardHeader>
                    <CardTitle>Mark Attendance</CardTitle>
                    <CardDescription>
                      Select attendance category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Attendance Type: Teacher or Student */}
                    <Select
                      value={attendanceType}
                      onValueChange={(value) => {
                        setAttendanceType(value as "student" | "teacher");
                        setSelectedClass("");
                        setTeachersToMark([]);
                        setStudentsToMark([]);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target: Teacher or Student" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Student Attendance Mode */}
                    {attendanceType === "student" && (
                      <>
                        {/* Class Selection */}
                        <Select
                          onValueChange={handleClassChange}
                          value={selectedClass}
                          disabled={availableClasses.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                availableClasses.length === 0
                                  ? "No classes assigned"
                                  : "Select a class"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableClasses.map((cls: any) => (
                              <SelectItem
                                key={cls.id}
                                value={cls.id.toString()}
                              >
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
                                className="bg-success-100 text-success"
                              >
                                Present: {presentCount}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-destructive-100 text-destructive"
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

                    {/* Teacher Attendance Mode */}
                    {attendanceType === "teacher" && (
                      <>
                        {/* The teacher list will be rendered in a separate card below */}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
              {/* Middle Column - Class Selection for non-admin */}
              {!(
                user?.role === "school_admin" || user?.role === "super_admin"
              ) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Class</CardTitle>
                    <CardDescription>
                      Choose the class to mark attendance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select
                      onValueChange={handleClassChange}
                      value={selectedClass}
                      disabled={availableClasses.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            availableClasses.length === 0
                              ? "No classes assigned"
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
                            className="bg-success-100 text-success"
                          >
                            Present: {presentCount}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-destructive-100 text-destructive"
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
                  </CardContent>
                </Card>
              )}

              {/* Right Column - Action Buttons */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>
                    Attendance management options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full"
                    onClick={
                      attendanceType === "teacher"
                        ? markAllTeachersPresent
                        : markAllPresent
                    }
                    disabled={
                      attendanceType === "student"
                        ? !selectedClass || studentsToMark.length === 0
                        : teachersToMark.length === 0
                    }
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark All Present
                  </Button>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      if (attendanceType === "student") {
                        setStudentsToMark(getClassStudents(selectedClass));
                      } else {
                        setTeachersToMark(getAllTeachers());
                      }
                    }}
                    disabled={
                      attendanceType === "student"
                        ? !selectedClass || studentsToMark.length === 0
                        : teachersToMark.length === 0
                    }
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Reset Attendance
                  </Button>

                  <Button
                    className="w-full"
                    variant="default"
                    onClick={
                      attendanceType === "teacher"
                        ? saveTeacherAttendance
                        : saveAttendance
                    }
                    disabled={
                      attendanceType === "student"
                        ? !selectedClass ||
                          studentsToMark.length === 0 ||
                          isSaving
                        : teachersToMark.length === 0 || isSaving
                    }
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Attendance"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Student List for Attendance Marking */}
            {selectedClass && studentsToMark.length > 0 && (
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Student Attendance</CardTitle>
                    <CardDescription>
                      {availableClasses.find(
                        (cls: any) => cls.id.toString() === selectedClass
                      )
                        ? `${
                            availableClasses.find(
                              (cls: any) => cls.id.toString() === selectedClass
                            )?.grade
                          } ${
                            availableClasses.find(
                              (cls: any) => cls.id.toString() === selectedClass
                            )?.section
                          }`
                        : "Class"}{" "}
                      | {format(date, "PPP")}
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchQuery(e.target.value)
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredStudents.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                        <p>No students found</p>
                      </div>
                    ) : (
                      filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-2 border rounded-md"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{student.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Roll: {student.roll_number || "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`attendance-${student.id}`}
                              checked={student.present}
                              onCheckedChange={() =>
                                toggleAttendance(student.id)
                              }
                            />
                            <Label
                              htmlFor={`attendance-${student.id}`}
                              className="text-sm"
                            >
                              {student.present ? "Present" : "Absent"}
                            </Label>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {availableClasses.length === 0 && (
              <Card className="mt-6">
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">
                    No Classes Assigned
                  </h3>
                  <p className="text-muted-foreground">
                    {user?.role === "staff"
                      ? "You are not assigned as a class teacher for any classes."
                      : "No classes found in the system."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Teacher List for Attendance Marking */}
            {attendanceType === "teacher" && teachersToMark.length > 0 && (
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Teacher Attendance</CardTitle>
                    <CardDescription>
                      Mark attendance for teachers | {format(date, "PPP")}
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search teachers..."
                      className="pl-8"
                      value={teacherSearchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTeacherSearchQuery(e.target.value)
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex gap-2">
                      <Badge
                        variant="outline"
                        className="bg-success-100 text-success"
                      >
                        Present: {teacherPresentCount}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-destructive-100 text-destructive"
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
                  <Button
                    className="w-full mb-4"
                    onClick={markAllTeachersPresent}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark All Teachers Present
                  </Button>
                  <div className="space-y-4">
                    {teachersToMark
                      .filter((teacher) =>
                        teacher.full_name
                          .toLowerCase()
                          .includes(teacherSearchQuery.toLowerCase())
                      )
                      .map((teacher) => (
                        <div
                          key={teacher.id}
                          className="flex items-center justify-between p-2 border rounded-md"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{teacher.full_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`teacher-attendance-${teacher.id}`}
                              checked={teacher.present}
                              onCheckedChange={() =>
                                toggleTeacherAttendance(teacher.id)
                              }
                            />
                            <Label
                              htmlFor={`teacher-attendance-${teacher.id}`}
                              className="text-sm"
                            >
                              {teacher.present ? "Present" : "Absent"}
                            </Label>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 2: View Attendance */}
          <TabsContent value="view">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Date & Class Selection */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Filter Attendance</CardTitle>
                  <CardDescription>Select date and class</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3">
                    <Label>Date</Label>
                    <div className="flex justify-center items-center space-x-2">
                      <Calendar
                        mode="single"
                        selected={viewingDate}
                        onSelect={(date) => date && setViewingDate(date)}
                        className="rounded-md border"
                        disabled={(date) =>
                          date > new Date() || date < new Date("2023-01-01")
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Attendance Type</Label>
                    <Select
                      value={viewingAttendanceType}
                      onValueChange={(value) => {
                        setViewingAttendanceType(
                          value as "student" | "teacher"
                        );
                        setViewingSelectedClass(""); // Reset class selection when type changes
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {viewingAttendanceType === "student" && (
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Select
                        value={viewingSelectedClass}
                        onValueChange={setViewingSelectedClass}
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
                    </div>
                  )}

                  {viewingAttendanceType === "teacher" &&
                    (user?.role === "school_admin" ||
                      user?.role === "super_admin") && (
                      <div className="space-y-2">
                        <Label>Teachers (All)</Label>
                        <Input value="All teachers" disabled />
                      </div>
                    )}

                  {viewingAttendanceType === "teacher" &&
                    user?.role === "staff" && (
                      <div className="space-y-2">
                        <Label>Class Teachers</Label>
                        <Select
                          value={viewingSelectedClass}
                          onValueChange={setViewingSelectedClass}
                          disabled={availableClasses.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                availableClasses.length === 0
                                  ? "No classes assigned"
                                  : "Select your class"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableClasses.map((cls: any) => (
                              <SelectItem
                                key={cls.id}
                                value={cls.id.toString()}
                              >
                                {cls.grade} {cls.section}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                  <Button
                    className="w-full mt-4"
                    onClick={handleViewAttendance}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    View Attendance
                  </Button>

                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                  </Button>
                </CardContent>
              </Card>

              {/* Right Column - Attendance Data */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {viewingAttendanceType === "student"
                      ? "Student Attendance"
                      : "Teacher Attendance"}
                  </CardTitle>
                  <CardDescription>
                    Showing attendance for {format(viewingDate, "PPP")}
                    {viewingSelectedClass &&
                      viewingAttendanceType === "student" &&
                      ` for ${
                        availableClasses.find(
                          (cls: any) =>
                            cls.id.toString() === viewingSelectedClass
                        )?.grade
                      } ${
                        availableClasses.find(
                          (cls: any) =>
                            cls.id.toString() === viewingSelectedClass
                        )?.section
                      }`}
                    {viewingSelectedClass &&
                      viewingAttendanceType === "teacher" &&
                      user?.role === "staff" &&
                      ` for ${
                        availableClasses.find(
                          (cls: any) =>
                            cls.id.toString() === viewingSelectedClass
                        )?.grade
                      } ${
                        availableClasses.find(
                          (cls: any) =>
                            cls.id.toString() === viewingSelectedClass
                        )?.section
                      }`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {viewingAttendanceType === "student" &&
                  viewingStudentAttendanceData.length > 0 ? (
                    <div className="space-y-4">
                      {viewingStudentAttendanceData.map((record: any) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-2 border rounded-md"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {students.find(
                                  (s) => s.id === record.student_id
                                )?.full_name || "Unknown Student"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Class:{" "}
                                {
                                  classes.find((c) => c.id === record.class_id)
                                    ?.grade
                                }{" "}
                                {
                                  classes.find((c) => c.id === record.class_id)
                                    ?.section
                                }
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              record.status === "present"
                                ? "bg-success-100 text-success"
                                : "bg-destructive-100 text-destructive"
                            }
                          >
                            {record.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : viewingAttendanceType === "teacher" &&
                    viewingTeacherAttendanceData.length > 0 ? (
                    <div className="space-y-4">
                      {viewingTeacherAttendanceData.map((record: any) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-2 border rounded-md"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {teachers.find(
                                  (t) => t.id === record.teacher_id
                                )?.full_name ||
                                  record.full_name ||
                                  "Unknown Teacher"}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              record.status === "present"
                                ? "bg-success-100 text-success"
                                : "bg-destructive-100 text-destructive"
                            }
                          >
                            {record.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Select Options to View
                      </h3>
                      <p>
                        Choose a date, attendance type, and class (if
                        applicable) from the left panel to view attendance data.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 3: Attendance Reports */}
          <TabsContent value="report">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Left Column - Report Options */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Report Options</CardTitle>
                  <CardDescription>Configure attendance report</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select defaultValue="student">
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">
                          Student Attendance
                        </SelectItem>
                        <SelectItem value="staff">
                          Teacher Attendance
                        </SelectItem>
                        <SelectItem value="class">Class-wise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Time Period</Label>
                    <Select defaultValue="month">
                      <SelectTrigger>
                        <SelectValue placeholder="Select time period" />
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
                    <Select defaultValue="5">
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">April</SelectItem>
                        <SelectItem value="5">May</SelectItem>
                        <SelectItem value="6">June</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select defaultValue="1">
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
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

                  <Button
                    className="w-full mt-4"
                    onClick={() => setShowAttendanceReport(true)}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>

                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                  </Button>
                </CardContent>
              </Card>

              {/* Right Column - Report Data */}
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>Monthly Attendance Report</CardTitle>
                  <CardDescription>
                    Configure options and generate report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!showAttendanceReport ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No Report Generated
                      </h3>
                      <p>
                        Configure the options and click "Generate Report" to
                        view attendance data
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p>Report data would appear here</p>
                    </div>
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
