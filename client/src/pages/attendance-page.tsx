import { useEffect, useState } from "react";
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
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Download,
  Save,
  Search,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

// Sample class data
const sampleClasses = [
  { id: "1", name: "Class 8A" },
  { id: "2", name: "Class 8B" },
  { id: "3", name: "Class 9A" },
  { id: "4", name: "Class 9B" },
  { id: "5", name: "Class 10A" },
  { id: "6", name: "Class 10B" },
];

// Sample student data for attendance
const sampleStudents = [
  {
    id: 1,
    name: "Alice Johnson",
    className: "Class 8A",
    rollNumber: "8A01",
    present: true,
  },
  {
    id: 2,
    name: "Bob Smith",
    className: "Class 8A",
    rollNumber: "8A02",
    present: true,
  },
  {
    id: 3,
    name: "Charlie Brown",
    className: "Class 8A",
    rollNumber: "8A03",
    present: false,
  },
  {
    id: 4,
    name: "Diana Evans",
    className: "Class 8A",
    rollNumber: "8A04",
    present: true,
  },
  {
    id: 5,
    name: "Ethan Davis",
    className: "Class 8A",
    rollNumber: "8A05",
    present: true,
  },
  {
    id: 6,
    name: "Fiona Wilson",
    className: "Class 8A",
    rollNumber: "8A06",
    present: true,
  },
  {
    id: 7,
    name: "George Miller",
    className: "Class 8A",
    rollNumber: "8A07",
    present: false,
  },
  {
    id: 8,
    name: "Hannah Clark",
    className: "Class 8A",
    rollNumber: "8A08",
    present: true,
  },
  {
    id: 9,
    name: "Ian Thomas",
    className: "Class 9A",
    rollNumber: "9A01",
    present: true,
  },
  {
    id: 10,
    name: "Julia Roberts",
    className: "Class 9A",
    rollNumber: "9A02",
    present: true,
  },
  {
    id: 11,
    name: "Kevin White",
    className: "Class 9A",
    rollNumber: "9A03",
    present: false,
  },
  {
    id: 12,
    name: "Linda Harris",
    className: "Class 9A",
    rollNumber: "9A04",
    present: true,
  },
  {
    id: 13,
    name: "Michael Young",
    className: "Class 10A",
    rollNumber: "10A01",
    present: true,
  },
  {
    id: 14,
    name: "Nancy Lee",
    className: "Class 10A",
    rollNumber: "10A02",
    present: false,
  },
  {
    id: 15,
    name: "Oliver King",
    className: "Class 10A",
    rollNumber: "10A03",
    present: true,
  },
];

// Sample monthly attendance data
const sampleMonthlyData = {
  totalSchoolDays: 22,
  studentAttendance: [
    {
      id: 1,
      name: "Alice Johnson",
      rollNumber: "8A01",
      daysPresent: 21,
      percentage: 95,
    },
    {
      id: 2,
      name: "Bob Smith",
      rollNumber: "8A02",
      daysPresent: 20,
      percentage: 91,
    },
    {
      id: 3,
      name: "Charlie Brown",
      rollNumber: "8A03",
      daysPresent: 17,
      percentage: 77,
    },
    {
      id: 4,
      name: "Diana Evans",
      rollNumber: "8A04",
      daysPresent: 22,
      percentage: 100,
    },
    {
      id: 5,
      name: "Ethan Davis",
      rollNumber: "8A05",
      daysPresent: 19,
      percentage: 86,
    },
  ],
  teacherAttendance: [
    {
      id: 1,
      name: "John Doe",
      subject: "Mathematics",
      daysPresent: 22,
      percentage: 100,
    },
    {
      id: 2,
      name: "Jane Smith",
      subject: "English",
      daysPresent: 21,
      percentage: 95,
    },
    {
      id: 3,
      name: "Bob Johnson",
      subject: "Science",
      daysPresent: 19,
      percentage: 86,
    },
    {
      id: 4,
      name: "Sarah Williams",
      subject: "History",
      daysPresent: 20,
      percentage: 91,
    },
  ],
};

/**
 * Attendance management page component
 * Allows marking, tracking, and viewing attendance for students and teachers
 */
export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [studentsToMark, setStudentsToMark] = useState<typeof sampleStudents>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showAttendanceReport, setShowAttendanceReport] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get class students for attendance marking
  const getClassStudents = (classId: string) => {
    const className =
      sampleClasses.find((cls) => cls.id === classId)?.name || "";
    return sampleStudents.filter((student) => student.className === className);
  };

  // Handle class selection for attendance marking
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setStudentsToMark(getClassStudents(classId));
  };

  // Toggle student attendance
  const toggleAttendance = (studentId: number) => {
    setStudentsToMark((students) =>
      students.map((student) =>
        student.id === studentId
          ? { ...student, present: !student.present }
          : student
      )
    );
  };

  // Mark all as present
  const markAllPresent = () => {
    setStudentsToMark((students) =>
      students.map((student) => ({ ...student, present: true }))
    );
  };

  // Save attendance records
  const saveAttendance = () => {
    setIsSaving(true);

    // In a real app, this would send the data to the server
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Attendance Saved",
        description: `Attendance for ${format(
          date,
          "PPP"
        )} has been recorded successfully.`,
      });
    }, 1000);
  };

  // Filter students by search query
  const filteredStudents = studentsToMark.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate attendance statistics
  const presentCount = studentsToMark.filter((s) => s.present).length;
  const absentCount = studentsToMark.length - presentCount;
  const attendancePercentage =
    studentsToMark.length > 0
      ? Math.round((presentCount / studentsToMark.length) * 100)
      : 0;

  const sampleTeachers = [
    { id: 1, name: "Mr. Sharma", subject: "Math", present: false },
    { id: 2, name: "Ms. Rao", subject: "Science", present: false },
    // ...
  ];

  //calculate attendance statistic for teacher
  const [teacherList, setTeacherList] = useState<typeof sampleTeachers>([]);
  const [teachersToMark, setTeachersToMark] = useState<typeof sampleTeachers>(
    []
  );
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");

  //initialize teacher on load
  useEffect(() => {
    setTeacherList(sampleTeachers);
    setTeachersToMark(sampleTeachers); // Or filter by current day/shift
  }, []);

  //to clean up user selection for attendance

  //teacher attendance

  const toggleTeacherAttendance = (teacherId: number) => {
    setTeachersToMark((teachers) =>
      teachers.map((teacher) =>
        teacher.id === teacherId
          ? { ...teacher, present: !teacher.present }
          : teacher
      )
    );
  };

  const markAllTeachersPresent = () => {
    setTeachersToMark((teachers) =>
      teachers.map((teacher) => ({ ...teacher, present: true }))
    );
  };

  const teacherPresentCount = teachersToMark.filter((t) => t.present).length;
  const teacherAbsentCount = teachersToMark.length - teacherPresentCount;
  const teacherAttendancePercentage = teachersToMark.length
    ? Math.round((teacherPresentCount / teachersToMark.length) * 100)
    : 0;
  const [attendanceType, setAttendanceType] = useState(""); // 'teacher' or 'class'
  const [selectedDepartment, setSelectedDepartment] = useState("");
  useEffect(() => {
    if (attendanceType === "student") {
      setSelectedDepartment("");

      setTeacherSearchQuery("");
      setTeachersToMark([]);
    } else if (attendanceType === "staff") {
      setSelectedClass("");
      setSearchQuery("");
      setStudentsToMark([]);
    }
  }, [attendanceType]);
  // Assume these are fetched from API or context
  const departments = ["Math", "Science", "English", "Admin"];
  const classes = [
    { id: "1", grade: "10", section: "A" },
    { id: "2", grade: "10", section: "B" },
    // ...
  ];

  const filteredTeachers = teachersToMark.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
      teacher.subject.toLowerCase().includes(teacherSearchQuery.toLowerCase())
  );

  //handle mark attendance
  function handleAttendanceTypeChange(type: "student" | "staff") {
    setAttendanceType(type);

    if (type === "student") {
      // reset teacher-related state
      setSelectedDepartment("");

      setTeacherSearchQuery("");
      setTeachersToMark([]);
    } else if (type === "staff") {
      // reset student-related state
      setSelectedClass("");
      setSearchQuery("");
      setStudentsToMark([]);
    }
  }

  //save attendance teacher

  // Check if user can mark attendance
  const canMarkAttendance =
    user?.role === "school_admin" || user?.role === "staff";

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

          {/* Tab 1: Mark Attendance (Only for teachers and admins) */}
          <TabsContent value="mark">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Date Picker */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                  <CardDescription>Choose the attendance date</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    className="rounded-md border"
                    disabled={(date) =>
                      date > new Date() || date < new Date("2023-01-01")
                    }
                  />
                  <p className="mt-4 text-sm text-muted-foreground text-center">
                    Marking attendance for:{" "}
                    <span className="font-medium">{format(date, "PPP")}</span>
                  </p>
                </CardContent>
              </Card>

              {/* Middle Column - Class Selection */}
              {user?.role === "student" && (
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
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {sampleClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
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

              {/* for teacher attendance */}
              {user?.role === "staff" && (
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
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {sampleClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
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
                    {/* Attendance Type: Teacher or Class */}
                    <Select
                      value={attendanceType}
                      onValueChange={setAttendanceType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target: Teacher or Class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="class">Class</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Class Mode: Same as Student View */}
                    {attendanceType === "class" && (
                      <>
                        {/* Class Selection */}
                        <Select
                          onValueChange={handleClassChange}
                          value={selectedClass}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                          <SelectContent>
                            {sampleClasses.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Attendance Stats + Progress */}
                        {selectedClass && (
                          <>
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
                          </>
                        )}
                      </>
                    )}

                    {/* Teacher Attendance Mode */}
                    {/* Teacher Attendance View */}
                    {attendanceType === "teacher" && (
                      <>
                        {/* Select Department/Subject */}
                        <Select
                          onValueChange={(value) =>
                            setSelectedDepartment(value)
                          }
                          value={selectedDepartment}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Attendance Stats */}
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
                      </>
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
                    onClick={markAllPresent}
                    disabled={!selectedClass || studentsToMark.length === 0}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark All Present
                  </Button>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() =>
                      setStudentsToMark(getClassStudents(selectedClass))
                    }
                    disabled={!selectedClass || studentsToMark.length === 0}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Reset Attendance
                  </Button>

                  <Button
                    className="w-full"
                    variant="default"
                    onClick={saveAttendance}
                    disabled={
                      !selectedClass || studentsToMark.length === 0 || isSaving
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
                      {sampleClasses.find((cls) => cls.id === selectedClass)
                        ?.name || "Class"}{" "}
                      | {format(date, "PPP")}
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
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
                              <p className="font-medium">{student.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Roll: {student.rollNumber}
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

            {attendanceType === "teacher" &&
              (user?.role === "school_admin" ||
                user?.role === "super_admin") && (
                <>
                  {attendanceType === "teacher" &&
                    selectedDepartment &&
                    teachersToMark.length > 0 && (
                      <Card className="mt-6">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <div>
                            <CardTitle>Teacher Attendance</CardTitle>
                            <CardDescription>
                              {selectedDepartment || "Department"} |{" "}
                              {format(date, "PPP")}
                            </CardDescription>
                          </div>
                          <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search teachers..."
                              className="pl-8"
                              value={teacherSearchQuery}
                              onChange={(e) =>
                                setTeacherSearchQuery(e.target.value)
                              }
                            />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {filteredTeachers.length === 0 ? (
                              <div className="text-center py-6 text-muted-foreground">
                                <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                                <p>No teachers found</p>
                              </div>
                            ) : (
                              filteredTeachers.map((teacher) => (
                                <div
                                  key={teacher.id}
                                  className="flex items-center justify-between p-2 border rounded-md"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                                      <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        {teacher.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Subject: {teacher.subject}
                                      </p>
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
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                </>
              )}
          </TabsContent>

          {/* Tab 2: View Attendance */}
          <TabsContent value="view">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Left Column - Date & Class Selection */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Filter Attendance</CardTitle>
                  <CardDescription>Select date and class</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(new Date(), "PPP")}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select defaultValue="1">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {sampleClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full mt-4">
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
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>Class 8A Attendance</CardTitle>
                  <CardDescription>
                    Showing attendance for {format(new Date(), "PPP")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 bg-muted/50 p-3 font-medium">
                      <div className="col-span-1">#</div>
                      <div className="col-span-5">Name</div>
                      <div className="col-span-2">Roll No</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Marked By</div>
                    </div>

                    <div className="divide-y">
                      {sampleStudents
                        .filter((s) => s.className === "Class 8A")
                        .map((student, index) => (
                          <div
                            key={student.id}
                            className="grid grid-cols-12 p-3 items-center"
                          >
                            <div className="col-span-1">{index + 1}</div>
                            <div className="col-span-5">{student.name}</div>
                            <div className="col-span-2">
                              {student.rollNumber}
                            </div>
                            <div className="col-span-2">
                              {student.present ? (
                                <Badge
                                  variant="outline"
                                  className="bg-success-100 text-success"
                                >
                                  Present
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-destructive-100 text-destructive"
                                >
                                  Absent
                                </Badge>
                              )}
                            </div>
                            <div className="col-span-2">
                              <span className="text-sm text-muted-foreground">
                                Mr. Johnson
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="flex justify-between mt-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-success rounded-full mr-2"></div>
                        <span className="text-sm">
                          Present:{" "}
                          {
                            sampleStudents.filter(
                              (s) => s.className === "Class 8A" && s.present
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-destructive rounded-full mr-2"></div>
                        <span className="text-sm">
                          Absent:{" "}
                          {
                            sampleStudents.filter(
                              (s) => s.className === "Class 8A" && !s.present
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">
                        Total:{" "}
                        {
                          sampleStudents.filter(
                            (s) => s.className === "Class 8A"
                          ).length
                        }{" "}
                        students
                      </span>
                    </div>
                  </div>
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
                        {sampleClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
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
                    Class 8A | May 2025 | {sampleMonthlyData.totalSchoolDays}{" "}
                    working days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!showAttendanceReport ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium mb-2">
                        No Report Generated
                      </h3>
                      <p>
                        Configure the options and click "Generate Report" to
                        view attendance data
                      </p>
                    </div>
                  ) : (
                    <>
                      <Tabs defaultValue="student">
                        <TabsList className="mb-4">
                          <TabsTrigger value="student">
                            Student Attendance
                          </TabsTrigger>
                          <TabsTrigger value="staff">
                            Teacher Attendance
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="student">
                          <div className="rounded-md border">
                            <div className="grid grid-cols-12 bg-muted/50 p-3 font-medium">
                              <div className="col-span-1">#</div>
                              <div className="col-span-5">Name</div>
                              <div className="col-span-2">Roll No</div>
                              <div className="col-span-2">Present Days</div>
                              <div className="col-span-2">Percentage</div>
                            </div>

                            <div className="divide-y">
                              {sampleMonthlyData.studentAttendance.map(
                                (student, index) => (
                                  <div
                                    key={student.id}
                                    className="grid grid-cols-12 p-3 items-center"
                                  >
                                    <div className="col-span-1">
                                      {index + 1}
                                    </div>
                                    <div className="col-span-5">
                                      {student.name}
                                    </div>
                                    <div className="col-span-2">
                                      {student.rollNumber}
                                    </div>
                                    <div className="col-span-2">
                                      {student.daysPresent}/
                                      {sampleMonthlyData.totalSchoolDays}
                                    </div>
                                    <div className="col-span-2">
                                      <div className="flex items-center space-x-2">
                                        <Progress
                                          value={student.percentage}
                                          className="h-2 w-16"
                                        />
                                        <span>{student.percentage}%</span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="staff">
                          <div className="rounded-md border">
                            <div className="grid grid-cols-12 bg-muted/50 p-3 font-medium">
                              <div className="col-span-1">#</div>
                              <div className="col-span-5">Name</div>
                              <div className="col-span-2">Subject</div>
                              <div className="col-span-2">Present Days</div>
                              <div className="col-span-2">Percentage</div>
                            </div>

                            <div className="divide-y">
                              {sampleMonthlyData.teacherAttendance.map(
                                (teacher, index) => (
                                  <div
                                    key={teacher.id}
                                    className="grid grid-cols-12 p-3 items-center"
                                  >
                                    <div className="col-span-1">
                                      {index + 1}
                                    </div>
                                    <div className="col-span-5">
                                      {teacher.name}
                                    </div>
                                    <div className="col-span-2">
                                      {teacher.subject}
                                    </div>
                                    <div className="col-span-2">
                                      {teacher.daysPresent}/
                                      {sampleMonthlyData.totalSchoolDays}
                                    </div>
                                    <div className="col-span-2">
                                      <div className="flex items-center space-x-2">
                                        <Progress
                                          value={teacher.percentage}
                                          className="h-2 w-16"
                                        />
                                        <span>{teacher.percentage}%</span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div className="mt-4 space-y-2">
                        <h3 className="font-medium">Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-muted/30 p-4 rounded-md">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-5 w-5 text-success" />
                              <span className="font-medium">
                                Good Attendance ({">"}90%)
                              </span>
                            </div>
                            <p className="text-2xl font-bold mt-2">
                              {
                                sampleMonthlyData.studentAttendance.filter(
                                  (s) => s.percentage >= 90
                                ).length
                              }{" "}
                              students
                            </p>
                          </div>

                          <div className="bg-muted/30 p-4 rounded-md">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="h-5 w-5 text-amber-500" />
                              <span className="font-medium">
                                Average (75-90%)
                              </span>
                            </div>
                            <p className="text-2xl font-bold mt-2">
                              {
                                sampleMonthlyData.studentAttendance.filter(
                                  (s) => s.percentage >= 75 && s.percentage < 90
                                ).length
                              }{" "}
                              students
                            </p>
                          </div>

                          <div className="bg-muted/30 p-4 rounded-md">
                            <div className="flex items-center space-x-2">
                              <XCircle className="h-5 w-5 text-destructive" />
                              <span className="font-medium">
                                Poor ({"<"}75%)
                              </span>
                            </div>
                            <p className="text-2xl font-bold mt-2">
                              {
                                sampleMonthlyData.studentAttendance.filter(
                                  (s) => s.percentage < 75
                                ).length
                              }{" "}
                              students
                            </p>
                          </div>
                        </div>
                      </div>
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
