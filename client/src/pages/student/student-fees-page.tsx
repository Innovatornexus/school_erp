import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CalendarDays } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function StudentFeesPage() {
  const { user } = useAuth();

  // Sample data - in a real app this would come from an API
  const feeDetails = {
    totalDue: 1200,
    paid: 800,
    nextPayment: "2025-05-15",
    recentPayments: [
      { date: "2025-04-01", amount: 400, status: "paid" },
      { date: "2025-03-01", amount: 400, status: "paid" },
    ],
  };

  const progress = (feeDetails.paid / feeDetails.totalDue) * 100;

  return (
    <DashboardLayout title="My Fees">
      <div className="container py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Fee Overview</CardTitle>
            <CardDescription>Current Term Fee Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total Due</span>
                <span className="text-2xl font-bold">
                  ${feeDetails.totalDue}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Paid: ${feeDetails.paid}</span>
                  <span>
                    Remaining: ${feeDetails.totalDue - feeDetails.paid}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="mr-2 h-4 w-4" />
                Next payment due: {feeDetails.nextPayment}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feeDetails.recentPayments.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">${payment.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.date}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800"
                  >
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
