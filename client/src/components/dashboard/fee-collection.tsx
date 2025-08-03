import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface FeeType {
  id: number;
  name: string;
  percentage: number;
  color: "success" | "warning" | "destructive";
}

interface ClassFeeData {
  id: number;
  className: string;
  totalStudents: number;
  paidCount: number;
  pendingCount: number;
  percentage: number;
}

interface FeeCollectionProps {
  feeTypes: FeeType[];
  classFeeData: ClassFeeData[];
  onViewAll?: () => void;
}

/**
 * Fee collection component for dashboard
 * Shows fee collection progress and detailed stats
 */
export function FeeCollection({ 
  feeTypes = [], 
  classFeeData = [], 
  onViewAll 
}: FeeCollectionProps) {
  // Get color class for progress bars
  const getProgressColor = (color: FeeType["color"]) => {
    switch(color) {
      case "success": return "bg-success";
      case "warning": return "bg-warning";
      case "destructive": return "bg-destructive";
      default: return "bg-primary";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Fee Collection Status</CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Fee type progress bars */}
        <div className="space-y-4 mb-6">
          {feeTypes.map((feeType) => (
            <div key={feeType.id} className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-neutral-700">{feeType.name}</span>
                <span className={`text-sm font-medium text-${feeType.color}`}>{feeType.percentage}%</span>
              </div>
              <Progress
                value={feeType.percentage}
                className="h-2 bg-neutral-200"
                indicatorClassName={getProgressColor(feeType.color)}
              />
            </div>
          ))}
        </div>
        
        {/* Class-wise fee collection table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Total Students</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Collection %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classFeeData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No fee data available
                  </TableCell>
                </TableRow>
              ) : (
                classFeeData.map((classData) => (
                  <TableRow key={classData.id}>
                    <TableCell className="font-medium">{classData.className}</TableCell>
                    <TableCell>{classData.totalStudents}</TableCell>
                    <TableCell className="text-success">{classData.paidCount}</TableCell>
                    <TableCell className="text-destructive">{classData.pendingCount}</TableCell>
                    <TableCell>{classData.percentage}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {onViewAll && (
          <div className="mt-4 text-right">
            <button onClick={onViewAll} className="text-sm font-medium text-primary hover:text-primary-dark">
              View All Fee Details
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
