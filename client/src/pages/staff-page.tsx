import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/layout/dashboard-layout";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, Edit, Trash, UserPlus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { SchoolItem, StaffItem } from "./type";
import { StackOffsetType } from "recharts/types/util/types";
import { useAuth } from "@/hooks/use-auth";
// Staff form schema
const staffFormSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),

    password: z.string().min(6, "Password must be at least 6 characters"),
    status: z.enum(["Active", "Inactive"]),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters"),
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    phone_number: z.string().min(10, "Please enter a valid phone number"),
    subject_specialization: z
      .string()
      .min(1, "Subject specialization is required"),
    gender: z.string().min(1, "Subject Gender is required"),
    joining_date: z.date({
      required_error: "Joining date is required",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type StaffFormValues = z.infer<typeof staffFormSchema>;

/**
 * Staff management page component
 * Allows school admins to manage teachers and staff
 */
export default function StaffPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffData, setStaffData] = useState<StaffItem[]>([]);
  const [schoolData, setSchoolData] = useState<SchoolItem | null>(null);

  const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null); // Added type
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<number | null>(null);
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      full_name: "",

      email: "",
      password: "",
      confirmPassword: "",
      subject_specialization: "",
      gender: "male",
      joining_date: new Date(),
      phone_number: "",
    },
  });

  const fetchSchool = async () => {
    try {
      if (user?.role === "school_admin") {
        console.log("calling to fetch school by user email");
        const res = await fetch(`/api/school/${user?.email}`);
        if (!res.ok) throw new Error("Failed to fetch school");
        const data = await res.json();

        console.log("school datas::", data);
        // setClassName(`Class ${data.grade}${data.section}`);

        setSchoolData(data);
      }
    } catch (error) {
      console.log("school error: ", error);
      toast({
        title: "Error",
        description: "Failed to load school list",
        variant: "destructive",
      });
    }
  };

  //fetch staff
  const fetchStaff = async () => {
    try {
      const res = await fetch(`/api/schools/${schoolData?.id}/teachers`);
      if (!res.ok) throw new Error("Failed to fetch staff");
      const data = await res.json();
      console.log("staff datas::", data);
      setStaffData(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load staff list",
        variant: "destructive",
      });
    }
  };

  //fetch school by admin email
  useEffect(() => {
    fetchSchool();
  }, []);

  //if school id found , fetch class by school

  useEffect(() => {
    if (schoolData) {
      fetchStaff();
    }
  }, [schoolData]);

  //create a staff
  const createStaff = async (data: StaffFormValues) => {
    try {
      // 1. Create user
      console.log("calling userres::");
      const userRes = await fetch("/api/register/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.full_name,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          role: "staff",
        }),
      });
      console.log("check userres:", userRes);
      if (!userRes.ok) throw new Error("Failed to create user");
      const newUser = await userRes.json();
      const userId = newUser.id;

      // 2. Create staff profile
      const staffRes = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          user_id: userId,
          school_id: 1, // make dynamic if needed
          joining_date: data.joining_date ?? "2024-06-01", // fallback default
        }),
      });

      console.log("teacher res ::", staffRes);

      if (!staffRes.ok) throw new Error("Failed to create staff");

      // 3. Refresh staff list (if available)

      await fetchStaff();
    } catch (error) {
      console.error("Error creating staff:", error);
      throw error;
    }
  };

  //toggle staff status
  const toggleStaffStatus = async (staff: StaffItem) => {
    const newStatus = staff.status === "Active" ? "Inactive" : "Active";

    try {
      const res = await fetch(`/api/teachers/${staff.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast({
        title: "Success",
        description: `Status changed to ${newStatus}`,
      });

      await fetchStaff(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  // Reset form when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setEditingStaff(null);
    }
    setIsDialogOpen(open);
  };

  // Set form values when editing
  const openEditDialog = (staff: StaffItem) => {
    setEditingStaff(staff);
    form.reset({
      email: staff.email,

      password: "", // Avoid filling password for edit; may use separate modal
      gender: staff.gender ?? "male", // Or default
      full_name: staff.full_name,
      phone_number: staff.phone_number,
      subject_specialization: staff.subject_specialization,
      joining_date: staff.joining_date,
    });
    setIsDialogOpen(true);
  };

  // Handle form submission for creating/editing staff
  const onSubmit = async (data: StaffFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingStaff) {
        const res = await fetch(`/api/teachers/${editingStaff.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update staff");
      } else {
        await createStaff(data);
      }

      toast({
        title: "Success",
        description: editingStaff
          ? "staff updated successfully"
          : "New staff added successfully",
      });
      setIsDialogOpen(false);
      await fetchStaff();
    } catch (error) {
      console.log("error ::", error);
      toast({
        title: "Error",
        description: "Failed to save staff",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle staff deletion
  const handleDelete = (id: number) => {
    setStaffToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;

    try {
      const response = await fetch(`/api/teachers/${staffToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Error",
            description: "Teacher not found",
            variant: "destructive",
          });
        } else {
          throw new Error("Failed to delete teacher");
        }
        return;
      }

      // Update UI only if deletion is successful
      setStaffData((prev) =>
        prev.filter((staff) => staff.id !== staffToDelete)
      );
      toast({
        title: "Success",
        description: "Teacher removed successfully",
      });
      setIsDeleteModalOpen(false);
      setStaffToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the teacher",
        variant: "destructive",
      });
    }
  };

  // DataTable columns configuration
  const columns: DataTableColumn<StaffItem>[] = [
    {
      header: "Name",
      accessorKey: "full_name",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Subject",
      accessorKey: "subject_specialization",
    },
    {
      header: "Phone",
      accessorKey: "phone_number",
    },
    {
      header: "Joining Date",
      accessorKey: "joining_date",
      cell: (staff: any) => {
        const date = new Date(staff.joining_date);
        return isNaN(date.getTime()) ? "-" : format(date, "PPP");
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (staff: StaffItem) => (
        <Button
          variant={staff.status === "Active" ? "outline" : "secondary"}
          className={`text-sm px-3 py-1 rounded-full ${
            staff.status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
          onClick={() => toggleStaffStatus(staff)}
        >
          {staff.status}
        </Button>
      ),
    },

    {
      header: "Actions",
      accessorKey: "id",
      cell: (staff: any) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(staff)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(staff.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Staff Management">
      <div className="container py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Total Staff</CardTitle>
              <CardDescription>All academic staff</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{staffData.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Departments</CardTitle>
              <CardDescription>Subject specializations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {
                  new Set(
                    staffData.map((staff) => staff.subject_specialization)
                  ).size
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">New Staff</CardTitle>
              <CardDescription>Added this month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {
                  staffData.filter(
                    (staff) =>
                      staff.joining_date &&
                      new Date(staff.joining_date).getMonth() ===
                        new Date().getMonth() &&
                      new Date(staff.joining_date).getFullYear() ===
                        new Date().getFullYear()
                  ).length
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Staff Table with Add Staff Button */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Staff List</h2>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingStaff ? "Edit Staff" : "Add New Staff"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingStaff
                          ? "Update the staff member's information"
                          : "Fill in the details to add a new staff member"}
                      </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[60vh] pr-4">
                      <div className="grid gap-4 py-4">
                        <FormField
                          control={form.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="john.doe@school.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder=""
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder=""
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="123-456-7890" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="subject_specialization"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject Specialization</FormLabel>
                              <FormControl>
                                <Input placeholder="Mathematics" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="joining_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Joining Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
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
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date() ||
                                      date < new Date("1900-01-01")
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
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Active">Active</SelectItem>
                                  <SelectItem value="Inactive">
                                    Inactive
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </ScrollArea>
                    <DialogFooter className="mt-4">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                          ? "Saving..."
                          : editingStaff
                          ? "Update Staff"
                          : "Add Staff"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* <DataTable
            data={staffData}
            columns={columns}
            searchPlaceholder="Search staff..."
            onSearch={(query) => {
              console.log("Search query:", query);
              // Implement search logic in a real app
            }}
          /> */}
          <DataTable
            data={staffData}
            columns={columns}
            searchPlaceholder="Search staff..."
            onSearch={(query) => {
              console.log("Search query:", query);
              // Implement search logic in a real app
            }}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this staff member? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
