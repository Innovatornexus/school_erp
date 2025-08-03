
import { useState } from "react";
import DashboardLayout from "@/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Bill } from "@shared/schema";

const columns = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "bill_month",
    header: "Month",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];

export default function BillsPage() {
  const [search, setSearch] = useState("");

  const { data: bills = [], isLoading } = useQuery<Bill[]>({
    queryKey: ["bills"],
    queryFn: async () => {
      const res = await fetch("/api/schools/1/bills");
      if (!res.ok) throw new Error("Failed to fetch bills");
      return res.json();
    },
  });

  const filteredBills = bills.filter((bill) =>
    bill.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Bills Management">
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bills Management</CardTitle>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Bill
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search bills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <DataTable columns={columns} data={filteredBills} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
