import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, User, Clock, Plus, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Form schema for new message
const messageFormSchema = z.object({
  recipient_type: z.enum(["principal", "students_all", "students_individual"]),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Message content is required"),
  selected_students: z.array(z.number()).optional(),
});

type MessageFormValues = z.infer<typeof messageFormSchema>;

export default function TeacherMessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "Principal",
      subject: "Monthly Progress Report",
      content:
        "Please submit the monthly progress reports for your classes by Friday.",
      time: "2 hours ago",
      status: "unread",
    },
    {
      id: 2,
      from: "Parent - John Smith",
      subject: "Student Performance",
      content: "I would like to discuss Alice's performance in Mathematics.",
      time: "1 day ago",
      status: "read",
    },
  ]);

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      recipient_type: "principal",
      subject: "",
      content: "",
      selected_students: [],
    },
  });

  // Sample assigned students data - in real app, fetch from API
  useEffect(() => {
    setAssignedStudents([
      { id: 1, name: "Alice Johnson", class: "8A", rollNumber: "8A01" },
      { id: 2, name: "Bob Smith", class: "8A", rollNumber: "8A02" },
      { id: 3, name: "Charlie Brown", class: "9B", rollNumber: "9B03" },
      { id: 4, name: "Diana Evans", class: "9B", rollNumber: "9B04" },
    ]);
  }, []);

  const onSubmit = async (data: MessageFormValues) => {
    try {
      // In real app, send to API
      console.log("Sending message:", data);

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });

      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const watchRecipientType = form.watch("recipient_type");

  return (
    <DashboardLayout title="My Messages">
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Messages</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-message">
                <Plus className="mr-2 h-4 w-4" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send New Message</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="recipient_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Send To</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-recipient-type">
                              <SelectValue placeholder="Select recipient type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem
                              value="principal"
                              data-testid="option-principal"
                            >
                              School Principal
                            </SelectItem>
                            <SelectItem
                              value="students_all"
                              data-testid="option-students-all"
                            >
                              All My Students
                            </SelectItem>
                            <SelectItem
                              value="students_individual"
                              data-testid="option-students-individual"
                            >
                              Select Individual Students
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchRecipientType === "students_individual" && (
                    <FormField
                      control={form.control}
                      name="selected_students"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Students</FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                              {assignedStudents.map((student) => (
                                <div
                                  key={student.id}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    data-testid={`checkbox-student-${student.id}`}
                                    checked={
                                      field.value?.includes(student.id) || false
                                    }
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([
                                          ...(field.value || []),
                                          student.id,
                                        ]);
                                      } else {
                                        field.onChange(
                                          field.value?.filter(
                                            (id) => id !== student.id
                                          )
                                        );
                                      }
                                    }}
                                  />
                                  <label className="text-sm">
                                    {student.name} ({student.class} -{" "}
                                    {student.rollNumber})
                                  </label>
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-subject"
                            placeholder="Enter message subject"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="textarea-content"
                            placeholder="Enter your message content"
                            className="min-h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="button-send">
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {messages.map((message) => (
            <Card
              key={message.id}
              data-testid={`message-card-${message.id}`}
              className={
                message.status === "unread" ? "border-blue-200 bg-blue-50" : ""
              }
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className="text-lg font-medium"
                  data-testid={`message-subject-${message.id}`}
                >
                  {message.subject}
                </CardTitle>
                <Badge
                  variant={message.status === "unread" ? "default" : "outline"}
                  data-testid={`message-status-${message.id}`}
                >
                  {message.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <User className="mr-2 h-4 w-4" />
                    <span data-testid={`message-from-${message.id}`}>
                      From: {message.from}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4" />
                    <span data-testid={`message-time-${message.id}`}>
                      {message.time}
                    </span>
                  </div>
                  <p
                    className="text-sm mt-2"
                    data-testid={`message-content-${message.id}`}
                  >
                    {message.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
