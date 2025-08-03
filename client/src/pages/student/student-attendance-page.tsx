import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

// Sample records
const sampleAttendanceRecords = [
  { date: "2025-05-01", present: true },
  { date: "2025-05-02", present: false },
  { date: "2025-05-03", present: true },
  { date: "2025-04-30", present: true },
  { date: "2025-04-15", present: false },
];

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<
    typeof sampleAttendanceRecords
  >([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("2025-05");

  useEffect(() => {
    // Replace this with real API call
    setAttendanceRecords(sampleAttendanceRecords);
  }, [user]);

  // Filter records by selected month
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(
      (record) => format(parseISO(record.date), "yyyy-MM") === selectedMonth
    );
  }, [attendanceRecords, selectedMonth]);

  // Calculate attendance percentage
  const attendancePercentage = useMemo(() => {
    if (filteredRecords.length === 0) return 0;
    const presentCount = filteredRecords.filter((r) => r.present).length;
    return Math.round((presentCount / filteredRecords.length) * 100);
  }, [filteredRecords]);

  return (
    <DashboardLayout title="My Attendance">
      <div className="container py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between">
            <CardTitle>Attendance Records</CardTitle>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px] mt-2 md:mt-0">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-05">May 2025</SelectItem>
                <SelectItem value="2025-04">April 2025</SelectItem>
                {/* Add dynamic months if needed */}
              </SelectContent>
            </Select>
          </CardHeader>

          <CardContent>
            <div className="mb-4 font-medium">
              Attendance:{" "}
              <span
                className={
                  attendancePercentage >= 75 ? "text-green-600" : "text-red-600"
                }
              >
                {attendancePercentage}% (
                {filteredRecords.filter((r) => r.present).length} /{" "}
                {filteredRecords.length} days)
              </span>
            </div>

            {filteredRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left border">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Day</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record, index) => {
                      const dateObj = parseISO(record.date);
                      return (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2">
                            {format(dateObj, "PPP")}
                          </td>
                          <td className="px-4 py-2">
                            {format(dateObj, "EEEE")}
                          </td>
                          <td className="px-4 py-2">
                            <Badge
                              variant={
                                record.present ? "default" : "destructive"
                              }
                            >
                              {record.present ? "Present" : "Absent"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No attendance records found for this month.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
