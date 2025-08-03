import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Exam {
  id: number;
  name: string;
  className: string;
  date: string;
  status: "pending" | "scheduled" | "completed" | "cancelled";
}

interface UpcomingExamsProps {
  exams: Exam[];
  onViewAll?: () => void;
}

/**
 * Upcoming exams component for dashboard
 * Displays a list of upcoming and scheduled exams
 */
export function UpcomingExams({ exams = [], onViewAll }: UpcomingExamsProps) {
  // Get badge styling based on exam status
  const getStatusBadge = (status: Exam["status"]) => {
    switch(status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Scheduled</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Upcoming Exams</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No upcoming exams scheduled
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.name}</TableCell>
                    <TableCell>{exam.className}</TableCell>
                    <TableCell>{exam.date}</TableCell>
                    <TableCell>{getStatusBadge(exam.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {exams.length > 0 && onViewAll && (
          <div className="mt-4 text-right">
            <button onClick={onViewAll} className="text-sm font-medium text-primary hover:text-primary-dark">
              View All Exams
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
