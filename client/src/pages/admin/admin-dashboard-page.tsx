import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolData } from "@/context/SchoolDataContext";
import DashboardLayout from "@/layout/dashboard-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Users,
  UserCheck,
  BookOpen,
  CalendarDays,
  DollarSign,
  Clock,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

/**
 * Admin Dashboard page component
 * Comprehensive school administration dashboard with metrics, charts, and analytics
 */
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    students,
    teachers,
    classes,
    subjects,
    loading: contextLoading,
  } = useSchoolData();

  const { data: studentAttendanceData, isLoading: isStudentAttendanceLoading } =
    useQuery({
      queryKey: ["allStudentAttendance", classes],
      queryFn: async () => {
        if (!classes || classes.length === 0) return null;
        const today = new Date().toISOString().split("T")[0];

        const attendancePromises = classes.map((c) =>
          fetch(`/api/classes/${c.id}/attendance?date=${today}`).then((res) => {
            if (!res.ok) {
              return { classId: c.id, attendance: [] };
            }
            return res.json().then((data) => ({
              classId: c.id,
              attendance: data,
            }));
          })
        );
        const results = await Promise.all(attendancePromises);

        const attendanceMap = results.reduce((acc, result) => {
          if (result) {
            acc[result.classId] = {
              present: result.attendance.filter(
                (a: any) => a.status === "present"
              ).length,
              absent: result.attendance.filter(
                (a: any) => a.status === "absent"
              ).length,
            };
          }
          return acc;
        }, {} as Record<number, { present: number; absent: number }>);

        let totalStudentsPresent = 0;
        let totalStudentsAbsent = 0;

        const studentAttendanceByClass = classes.map((c) => {
          const counts = attendanceMap[c.id] || { present: 0, absent: 0 };
          totalStudentsPresent += counts.present;
          totalStudentsAbsent += counts.absent;
          return {
            name: "class " + c.grade + " " + c.section,
            Present: counts.present,
            Absent: counts.absent,
          };
        });

        return {
          totalStudentsPresent,
          totalStudentsAbsent,
          studentAttendanceByClass,
        };
      },
      enabled: !!classes && classes.length > 0,
    });
  console.log("student attendance data", studentAttendanceData);
  console.log("classes data", classes);
  console.log("enabled condition for attendance query", !!classes && classes.length > 0);

  const { data: teacherAttendanceData, isLoading: isTeacherAttendanceLoading } =
    useQuery({
      queryKey: ["teacherAttendance", user?.school_id],
      queryFn: async () => {
        if (!user?.school_id) return null;
        const today = new Date().toISOString().split("T")[0];
        const res = await fetch(
          `/api/schools/${user.school_id}/teacher-attendance?date=${today}`
        );
        if (!res.ok) {
          return { present: 0, absent: 0 };
        }
        const attendanceRecords = await res.json();
        const presentCount = attendanceRecords.filter(
          (record: any) => record.status === "present"
        ).length;
        const absentCount = attendanceRecords.filter(
          (record: any) => record.status === "absent"
        ).length;
        return { present: presentCount, absent: absentCount };
      },
      enabled: !!user?.school_id,
    });

  const metrics = useMemo(() => {
    if (contextLoading || !students || !teachers || !classes || !subjects) {
      return null;
    }

    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    const totalClasses = classes.length;
    const totalSubjects = subjects.length;

    const avgFeePerStudent = 8500;
    const totalExpected = totalStudents * avgFeePerStudent;
    const totalCollected = Math.floor(totalExpected * 0.79);
    const totalPending = totalExpected - totalCollected;
    const collectionRate =
      totalExpected > 0
        ? Math.round((totalCollected / totalExpected) * 100)
        : 0;

    const studentsPresent = studentAttendanceData?.totalStudentsPresent ?? 0;
    const studentsAbsent = studentAttendanceData?.totalStudentsAbsent ?? 0;
    const teachersPresent = teacherAttendanceData?.present ?? 0;
    const teachersAbsent = teacherAttendanceData?.absent ?? 0;

    const todayAttendance = {
      studentsPresent,
      studentsAbsent,
      studentsTotal: totalStudents,
      teachersPresent,
      teachersAbsent,
      teachersTotal: totalTeachers,
    };

    const studentAttendanceByClass =
      studentAttendanceData?.studentAttendanceByClass ?? [];

    const teacherAttendancePieData = [
      { name: "Present", value: teachersPresent, fill: "#22c55e" },
      { name: "Absent", value: teachersAbsent, fill: "#ef4444" },
    ];

    const feeCollection = {
      totalExpected,
      totalCollected,
      totalPending,
      collectionRate,
      byClass: [
        { name: "Class 6", Collected: 145000, Pending: 35000 },
        { name: "Class 7", Collected: 132000, Pending: 28000 },
        { name: "Class 8", Collected: 158000, Pending: 42000 },
        { name: "Class 9", Collected: 165000, Pending: 30000 },
        { name: "Class 10", Collected: 180000, Pending: 25000 },
      ],
      byType: [
        { name: "Tuition", value: 750000, color: "#3b82f6" },
        { name: "Library", value: 85000, color: "#10b981" },
        { name: "Sports", value: 75000, color: "#f59e0b" },
        { name: "Other", value: 77500, color: "#6b7280" },
      ],
    };

    const upcomingEvents = [
      {
        id: 1,
        title: "Annual Sports Day",
        date: "2025-09-15",
        type: "event",
        participants: "All Classes",
      },
      {
        id: 2,
        title: "Science Fair",
        date: "2025-10-02",
        type: "event",
        participants: "Classes 6-10",
      },
      {
        id: 3,
        title: "Mid-term Exams",
        date: "2025-10-20",
        type: "exam",
        participants: "All Classes",
      },
    ];

    const recentActivities = [
      {
        id: 1,
        type: "enrollment",
        message: `${Math.max(
          0,
          totalStudents - 1235
        )} new students enrolled recently`,
        time: "2 hours ago",
        icon: Users,
      },
      {
        id: 2,
        type: "attendance",
        message: "Daily attendance marked for all classes",
        time: "1 hour ago",
        icon: CheckCircle,
      },
    ];

    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      todayAttendance,
      studentAttendanceByClass,
      teacherAttendancePieData,
      feeCollection,
      upcomingEvents,
      recentActivities,
    };
  }, [
    students,
    teachers,
    classes,
    subjects,
    contextLoading,
    studentAttendanceData,
    teacherAttendanceData,
  ]);

  const loading =
    contextLoading || isStudentAttendanceLoading || isTeacherAttendanceLoading;

  if (loading || !metrics) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const getEventTypeColor = (type: string) =>
    type === "exam" ? "destructive" : "default";

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive overview of school operations, attendance, and
          financials.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Students"
          value={metrics.totalStudents}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          iconClassName="bg-blue-100"
        />
        <StatsCard
          title="Total Teachers"
          value={metrics.totalTeachers}
          icon={<UserCheck className="h-5 w-5 text-green-600" />}
          iconClassName="bg-green-100"
        />
        <StatsCard
          title="Total Classes"
          value={metrics.totalClasses}
          icon={<BookOpen className="h-5 w-5 text-purple-600" />}
          iconClassName="bg-purple-100"
        />
        <StatsCard
          title="Total Subjects"
          value={metrics.totalSubjects}
          icon={<CalendarDays className="h-5 w-5 text-orange-600" />}
          iconClassName="bg-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* --- Refactored Attendance Card --- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-5 w-5" /> Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="byClass" className="pt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="byClass">
                  <BarChart3 className="h-4 w-4 mr-2" /> By Class
                </TabsTrigger>
                <TabsTrigger value="byTeacher">
                  <PieChartIcon className="h-4 w-4 mr-2" /> By Teacher
                </TabsTrigger>
              </TabsList>
              <TabsContent value="byClass">
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-xl text-gray-600">Students Present</p>
                    <p className="text-2xl font-bold text-green-700">
                      {metrics.todayAttendance.studentsPresent}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xl text-gray-600">Students Absent</p>
                    <p className="text-2xl font-bold text-red-700">
                      {metrics.todayAttendance.studentsAbsent}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xl text-gray-600">Total Students </p>
                    <p className="text-2xl font-bold text-red-700">
                      {metrics.totalStudents}
                    </p>
                  </div>
                </div>
                <div className="mt-2" style={{ height: "500px" }}>
                  {" "}
                  {/* Increased height */}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.studentAttendanceByClass}
                      layout="vertical"
                      margin={{ top: 15, right: 10, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={12} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        fontSize={12}
                        width={60}
                        interval={0}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Present" stackId="a" fill="#22c55e" />
                      <Bar dataKey="Absent" stackId="a" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="byTeacher">
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-xl text-gray-600">Teachers Present</p>
                    <p className="text-3xl font-bold text-green-700">
                      {metrics.todayAttendance.teachersPresent}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xl text-gray-600">Teachers Absent</p>
                    <p className="text-3xl font-bold text-red-700">
                      {metrics.todayAttendance.teachersAbsent}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xl text-gray-600">Total Teachers </p>
                    <p className="text-3xl font-bold text-red-700">
                      {metrics.totalTeachers}
                    </p>
                  </div>
                </div>
                <div className="h-80 mt-4 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.teacherAttendancePieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={130}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {metrics.teacherAttendancePieData.map(
                          (entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          )
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* --- Refactored Fee Summary Card --- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Fee Collection Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 border-2 border-dashed border-red-200 rounded-lg text-center">
              <p className="text-sm font-medium text-red-700">
                Pending Fees to be Collected
              </p>
              <p className="text-3xl font-extrabold text-red-600">
                ₹{metrics.feeCollection.totalPending.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-gray-600">Total Collected</p>
                <p className="text-xl font-bold text-green-700">
                  ₹
                  {metrics.feeCollection.totalCollected.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-600">Total Expected</p>
                <p className="text-xl font-bold">
                  ₹{metrics.feeCollection.totalExpected.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">Collection Rate</span>
                <span className="font-bold text-primary">
                  {metrics.feeCollection.collectionRate}%
                </span>
              </div>
              <Progress
                value={metrics.feeCollection.collectionRate}
                className="h-2"
              />
            </div>
            <Tabs defaultValue="byClass" className="pt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="byClass">
                  <BarChart3 className="h-4 w-4 mr-2" /> By Class
                </TabsTrigger>
                <TabsTrigger value="byType">
                  <PieChartIcon className="h-4 w-4 mr-2" /> By Type
                </TabsTrigger>
              </TabsList>
              <TabsContent value="byClass">
                <div className="h-60 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.feeCollection.byClass}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={12} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        fontSize={12}
                        width={60}
                      />
                      <Tooltip
                        formatter={(value: number) =>
                          `₹${value.toLocaleString("en-IN")}`
                        }
                      />
                      <Legend />
                      <Bar dataKey="Collected" stackId="a" fill="#10b981" />
                      <Bar dataKey="Pending" stackId="a" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="byType">
                <div className="h-60 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.feeCollection.byType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {metrics.feeCollection.byType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) =>
                          `₹${value.toLocaleString("en-IN")}`
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Upcoming Exams & Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div>
                    <h4 className="font-semibold">{event.title}</h4>
                    <p className="text-sm text-gray-600">
                      {event.participants}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <Badge variant={getEventTypeColor(event.type)}>
                      {event.type}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {format(new Date(event.date), "dd MMM, yyyy")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border-l-4 border-blue-500 rounded-r-md bg-blue-50"
                >
                  <div className="mt-1 text-blue-600">
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
