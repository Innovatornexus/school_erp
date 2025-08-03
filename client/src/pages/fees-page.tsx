import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import DashboardLayout from "@/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, DollarSign, Download, Eye, FileText, PlusCircle, Search, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Fee payment form schema
const feePaymentSchema = z.object({
  studentId: z.string({
    required_error: "Please select a student",
  }),
  term: z.string({
    required_error: "Please select a term",
  }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  paymentDate: z.date({
    required_error: "Payment date is required",
  }),
  paymentMethod: z.string({
    required_error: "Please select a payment method",
  }),
  receiptNumber: z.string().min(3, "Receipt number must be at least 3 characters"),
});

type FeePaymentValues = z.infer<typeof feePaymentSchema>;

// Fee structure form schema
const feeStructureSchema = z.object({
  classId: z.string({
    required_error: "Please select a class",
  }),
  term: z.string({
    required_error: "Please select a term",
  }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
});

type FeeStructureValues = z.infer<typeof feeStructureSchema>;

// Sample class data
const sampleClasses = [
  { id: "1", name: "Class 8A" },
  { id: "2", name: "Class 8B" },
  { id: "3", name: "Class 9A" },
  { id: "4", name: "Class 9B" },
  { id: "5", name: "Class 10A" },
  { id: "6", name: "Class 10B" },
];

// Sample student data
const sampleStudents = [
  { id: "1", name: "Alice Johnson", className: "Class 8A", rollNumber: "8A01" },
  { id: "2", name: "Bob Smith", className: "Class 8A", rollNumber: "8A02" },
  { id: "3", name: "Charlie Brown", className: "Class 9A", rollNumber: "9A01" },
  { id: "4", name: "Diana Evans", className: "Class 9A", rollNumber: "9A02" },
  { id: "5", name: "Ethan Davis", className: "Class 10A", rollNumber: "10A01" },
];

// Sample fee payment data
const sampleFeePayments = [
  { 
    id: 1, 
    studentName: "Alice Johnson", 
    className: "Class 8A", 
    term: "April 2025", 
    amount: 500, 
    paymentDate: new Date("2025-04-10"), 
    receiptNumber: "RCP-001", 
    status: "paid" 
  },
  { 
    id: 2, 
    studentName: "Bob Smith", 
    className: "Class 8A", 
    term: "April 2025", 
    amount: 500, 
    paymentDate: new Date("2025-04-12"), 
    receiptNumber: "RCP-002", 
    status: "paid" 
  },
  { 
    id: 3, 
    studentName: "Charlie Brown", 
    className: "Class 9A", 
    term: "April 2025", 
    amount: 600, 
    paymentDate: null, 
    receiptNumber: "", 
    status: "pending" 
  },
  { 
    id: 4, 
    studentName: "Diana Evans", 
    className: "Class 9A", 
    term: "April 2025", 
    amount: 600, 
    paymentDate: new Date("2025-04-15"), 
    receiptNumber: "RCP-003", 
    status: "paid" 
  },
  { 
    id: 5, 
    studentName: "Ethan Davis", 
    className: "Class 10A", 
    term: "April 2025", 
    amount: 700, 
    paymentDate: null, 
    receiptNumber: "", 
    status: "overdue" 
  },
];

// Sample fee structure data
const sampleFeeStructure = [
  { id: 1, className: "Class 8A", term: "April 2025", amount: 500 },
  { id: 2, className: "Class 8B", term: "April 2025", amount: 500 },
  { id: 3, className: "Class 9A", term: "April 2025", amount: 600 },
  { id: 4, className: "Class 9B", term: "April 2025", amount: 600 },
  { id: 5, className: "Class 10A", term: "April 2025", amount: 700 },
  { id: 6, className: "Class 10B", term: "April 2025", amount: 700 },
  { id: 7, className: "Class 8A", term: "May 2025", amount: 500 },
  { id: 8, className: "Class 9A", term: "May 2025", amount: 600 },
];

// Sample fee collection stats
const sampleCollectionStats = {
  totalExpected: 10000,
  totalCollected: 7800,
  totalPending: 2200,
  percentage: 78,
  classFeeCollection: [
    { name: "Class 8", collected: 90 },
    { name: "Class 9", collected: 75 },
    { name: "Class 10", collected: 65 },
  ]
};

/**
 * Fees management page component
 * Manages fee structures, payments, and reports
 */
export default function FeesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isStructureDialogOpen, setIsStructureDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState("April 2025");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<typeof sampleFeePayments[0] | null>(null);
  
  // Initialize forms
  const paymentForm = useForm<FeePaymentValues>({
    resolver: zodResolver(feePaymentSchema),
    defaultValues: {
      studentId: "",
      term: "April 2025",
      amount: "",
      paymentDate: new Date(),
      paymentMethod: "cash",
      receiptNumber: "",
    }
  });
  
  const structureForm = useForm<FeeStructureValues>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: {
      classId: "",
      term: "April 2025",
      amount: "",
    }
  });
  
  // Reset forms when dialogs close
  const handlePaymentDialogOpenChange = (open: boolean) => {
    if (!open) {
      paymentForm.reset();
    }
    setIsPaymentDialogOpen(open);
  };
  
  const handleStructureDialogOpenChange = (open: boolean) => {
    if (!open) {
      structureForm.reset();
    }
    setIsStructureDialogOpen(open);
  };
  
  // Handle fee payment form submission
  const onPaymentSubmit = (data: FeePaymentValues) => {
    setIsSubmitting(true);
    
    setTimeout(() => {
      // In a real app, this would send the data to the server
      const student = sampleStudents.find(s => s.id === data.studentId);
      
      toast({
        title: "Fee Payment Recorded",
        description: `Payment of $${data.amount} recorded for ${student?.name}.`,
      });
      
      setIsSubmitting(false);
      setIsPaymentDialogOpen(false);
      paymentForm.reset();
    }, 1000);
  };
  
  // Handle fee structure form submission
  const onStructureSubmit = (data: FeeStructureValues) => {
    setIsSubmitting(true);
    
    setTimeout(() => {
      // In a real app, this would send the data to the server
      const classInfo = sampleClasses.find(c => c.id === data.classId);
      
      toast({
        title: "Fee Structure Created",
        description: `Fee of $${data.amount} set for ${classInfo?.name} (${data.term}).`,
      });
      
      setIsSubmitting(false);
      setIsStructureDialogOpen(false);
      structureForm.reset();
    }, 1000);
  };
  
  // Set receipt data and open modal
  const viewReceipt = (payment: typeof sampleFeePayments[0]) => {
    setSelectedReceipt(payment);
    setReceiptDialogOpen(true);
  };
  
  // Filter data based on selections
  const filteredPayments = sampleFeePayments.filter(payment => 
    payment.term === selectedTerm && 
    (selectedClass ? payment.className === sampleClasses.find(c => c.id === selectedClass)?.name : true)
  );
  
  const filteredStructure = sampleFeeStructure.filter(fee => 
    fee.term === selectedTerm && 
    (selectedClass ? fee.className === sampleClasses.find(c => c.id === selectedClass)?.name : true)
  );
  
  // Calculate payment statistics
  const paidCount = filteredPayments.filter(p => p.status === "paid").length;
  const pendingCount = filteredPayments.filter(p => p.status === "pending").length;
  const overdueCount = filteredPayments.filter(p => p.status === "overdue").length;
  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const collectedAmount = filteredPayments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  
  // DataTable columns for payments
  const paymentColumns = [
    {
      header: "Student Name",
      accessorKey: "studentName",
    },
    {
      header: "Class",
      accessorKey: "className",
    },
    {
      header: "Term",
      accessorKey: "term",
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (payment: any) => `$${payment.amount}`,
    },
    {
      header: "Payment Date",
      accessorKey: "paymentDate",
      cell: (payment: any) => payment.paymentDate ? format(new Date(payment.paymentDate), "PPP") : "-",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (payment: any) => {
        let badgeClass = "";
        switch (payment.status) {
          case "paid":
            badgeClass = "bg-success-100 text-success";
            break;
          case "pending":
            badgeClass = "bg-amber-100 text-amber-800";
            break;
          case "overdue":
            badgeClass = "bg-destructive-100 text-destructive";
            break;
        }
        return (
          <Badge variant="outline" className={badgeClass}>
            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (payment: any) => (
        <div className="flex space-x-2">
          {payment.status === "paid" && (
            <Button variant="ghost" size="icon" onClick={() => viewReceipt(payment)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {(payment.status === "pending" || payment.status === "overdue") && (
            <Button variant="ghost" size="sm" onClick={() => {
              toast({
                title: "Feature Coming Soon",
                description: "Payment processing will be available in the next update.",
              });
            }}>
              Record Payment
            </Button>
          )}
        </div>
      ),
    },
  ];
  
  // DataTable columns for fee structure
  const structureColumns = [
    {
      header: "Class",
      accessorKey: "className",
    },
    {
      header: "Term",
      accessorKey: "term",
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (fee: any) => `$${fee.amount}`,
    },
  ];
  
  // Check user permissions
  const canManageFees = user?.role === "super_admin" || user?.role === "school_admin";

  return (
    <DashboardLayout title="Fee Management">
      <div className="container py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Total Expected</CardTitle>
              <CardDescription>Current term fees</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${sampleCollectionStats.totalExpected}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Collected</CardTitle>
              <CardDescription>Fees received</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-success">${sampleCollectionStats.totalCollected}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Pending</CardTitle>
              <CardDescription>Outstanding payments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-500">${sampleCollectionStats.totalPending}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Collection Rate</CardTitle>
              <CardDescription>Overall percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{sampleCollectionStats.percentage}%</p>
              <Progress 
                value={sampleCollectionStats.percentage} 
                className="h-2 mt-2" 
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Class Collection Progress */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Fee Collection Progress by Grade</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sampleCollectionStats.classFeeCollection.map((cls, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{cls.name}</h3>
                  <Badge variant="outline">{cls.collected}% collected</Badge>
                </div>
                <Progress 
                  value={cls.collected} 
                  className="h-2 mb-2" 
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Pending: ${Math.round((100 - cls.collected) * 20)}</span>
                  <span>Collected: ${Math.round(cls.collected * 20)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Fee Management Tabs */}
        <div className="bg-white p-6 rounded-lg shadow">
          <Tabs defaultValue="payments">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="payments">Fee Payments</TabsTrigger>
                <TabsTrigger value="structure">Fee Structure</TabsTrigger>
              </TabsList>
              
              {canManageFees && (
                <div className="flex space-x-2">
                  <Dialog open={isPaymentDialogOpen} onOpenChange={handlePaymentDialogOpenChange}>
                    <DialogTrigger asChild>
                      <Button>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Record Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <Form {...paymentForm}>
                        <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)}>
                          <DialogHeader>
                            <DialogTitle>Record Fee Payment</DialogTitle>
                            <DialogDescription>
                              Enter the payment details to record a fee payment.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <FormField
                              control={paymentForm.control}
                              name="studentId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Student</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select student" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {sampleStudents.map((student) => (
                                        <SelectItem key={student.id} value={student.id}>
                                          {student.name} ({student.className})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={paymentForm.control}
                              name="term"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Term</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select term" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="April 2025">April 2025</SelectItem>
                                      <SelectItem value="May 2025">May 2025</SelectItem>
                                      <SelectItem value="June 2025">June 2025</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={paymentForm.control}
                              name="amount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Amount ($)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="500" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={paymentForm.control}
                              name="paymentDate"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Payment Date</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          className="pl-3 text-left font-normal"
                                        >
                                          {field.value ? (
                                            format(field.value, "PPP")
                                          ) : (
                                            <span>Pick a date</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                          date > new Date() || date < new Date("2023-01-01")
                                        }
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={paymentForm.control}
                              name="paymentMethod"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payment Method</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select payment method" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="cash">Cash</SelectItem>
                                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                      <SelectItem value="cheque">Cheque</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={paymentForm.control}
                              name="receiptNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Receipt Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="RCP-001" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting ? "Processing..." : "Record Payment"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isStructureDialogOpen} onOpenChange={handleStructureDialogOpenChange}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Fee Structure
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <Form {...structureForm}>
                        <form onSubmit={structureForm.handleSubmit(onStructureSubmit)}>
                          <DialogHeader>
                            <DialogTitle>Create Fee Structure</DialogTitle>
                            <DialogDescription>
                              Set up new fee structure for a class and term.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <FormField
                              control={structureForm.control}
                              name="classId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Class</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select class" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {sampleClasses.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                          {cls.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={structureForm.control}
                              name="term"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Term</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select term" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="April 2025">April 2025</SelectItem>
                                      <SelectItem value="May 2025">May 2025</SelectItem>
                                      <SelectItem value="June 2025">June 2025</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={structureForm.control}
                              name="amount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Amount ($)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="500" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting ? "Creating..." : "Create Fee Structure"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <Select
                value={selectedTerm}
                onValueChange={setSelectedTerm}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="April 2025">April 2025</SelectItem>
                  <SelectItem value="May 2025">May 2025</SelectItem>
                  <SelectItem value="June 2025">June 2025</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {sampleClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex-1"></div>
              
              <Button variant="outline" className="ml-auto" onClick={() => {
                toast({
                  title: "Export Feature",
                  description: "Export functionality will be available in the next update.",
                });
              }}>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
            
            <TabsContent value="payments">
              <div className="space-y-4">
                {selectedClass && (
                  <div className="flex items-center justify-between mb-2 p-3 bg-muted/30 rounded-md">
                    <div>
                      <p className="font-medium">
                        {sampleClasses.find(c => c.id === selectedClass)?.name} | {selectedTerm}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total: {filteredPayments.length} students | 
                        Paid: {paidCount} | 
                        Pending: {pendingCount} | 
                        Overdue: {overdueCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Collection: ${collectedAmount} / ${totalAmount}</p>
                      <Progress 
                        value={totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0} 
                        className="h-2 w-40 mt-1" 
                      />
                    </div>
                  </div>
                )}
                
                <DataTable 
                  data={filteredPayments}
                  columns={paymentColumns}
                  searchPlaceholder="Search payments..."
                  onSearch={(query) => {
                    console.log("Search query:", query);
                    // Implement search logic in a real app
                  }}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="structure">
              <DataTable 
                data={filteredStructure}
                columns={structureColumns}
                searchPlaceholder="Search fee structures..."
                onSearch={(query) => {
                  console.log("Search query:", query);
                  // Implement search logic in a real app
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Receipt View Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Fee Payment Receipt</DialogTitle>
            <DialogDescription>
              Receipt details for {selectedReceipt?.studentName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReceipt && (
            <div className="border p-6 rounded-md">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <School className="h-10 w-10 text-primary mr-3" />
                  <div>
                    <h2 className="font-bold text-xl">School Name</h2>
                    <p className="text-sm text-muted-foreground">123 School Address, City</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">RECEIPT</p>
                  <p className="text-sm">#{selectedReceipt.receiptNumber}</p>
                  <p className="text-sm">Date: {format(new Date(selectedReceipt.paymentDate!), "PPP")}</p>
                </div>
              </div>
              
              <div className="border-t border-b py-4 my-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Student Name</p>
                    <p className="font-medium">{selectedReceipt.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-medium">{selectedReceipt.className}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fee Type</p>
                    <p className="font-medium">Tuition Fee</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Term</p>
                    <p className="font-medium">{selectedReceipt.term}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <p className="font-medium">Fee Amount</p>
                  <p className="font-medium">${selectedReceipt.amount}</p>
                </div>
                <div className="flex justify-between">
                  <p className="font-medium">Payment Method</p>
                  <p className="font-medium">Cash</p>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <p className="font-bold">Total Paid</p>
                  <p className="font-bold">${selectedReceipt.amount}</p>
                </div>
              </div>
              
              <div className="text-center mt-8 mb-4">
                <p className="text-sm text-muted-foreground">Thank you for your payment!</p>
                <p className="text-xs text-muted-foreground mt-1">This is a system-generated receipt.</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              toast({
                title: "Print Feature",
                description: "Print functionality will be available in the next update.",
              });
            }}>
              <FileText className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
