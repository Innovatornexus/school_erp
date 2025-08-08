import { useState, useMemo } from "react";
import DashboardLayout from "@/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Reply, X } from "lucide-react";
import { Message, Student, Teacher } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSchoolData } from "@/context/SchoolDataContext";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Define a type for the mutation payload
interface CreateMessagePayload {
  content: string;
  message_type: string;
  receiver_role: string;
  receiver_ids: number[];
  school_id: number;
  sender_id: number;
  sender_role: string;
}

const ITEMS_PER_PAGE = 10;

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [content, setContent] = useState("");
  const [messageType, setMessageType] = useState("announcement");
  const [receiverType, setReceiverType] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  // --- FIX: State for pagination ---
  const [receivedPage, setReceivedPage] = useState(1);
  const [sentPage, setSentPage] = useState(1);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    schoolData,
    classes,
    teachers,
    students,
    loading: schoolDataLoading,
  } = useSchoolData();
  const schoolId = schoolData?.id;

  const { data: messages = [], isLoading: messagesLoading } = useQuery<
    Message[]
  >({
    queryKey: ["messages", schoolId, user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/schools/${schoolId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!schoolId && !!user?.id && !schoolDataLoading,
  });

  const createMessage = useMutation({
    mutationFn: async (
      data: Omit<
        CreateMessagePayload,
        "school_id" | "sender_id" | "sender_role"
      >
    ) => {
      if (!schoolId || !user) {
        throw new Error("User or School data is not available.");
      }
      const payload: CreateMessagePayload = {
        ...data,
        school_id: schoolId,
        sender_id: user.id,
        sender_role: user.role,
      };

      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", schoolId] });
      resetAndCloseDialog();
      toast({ title: "Success", description: "Message sent successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredStudentsByClass = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter(
      (s) =>
        s.class_id === parseInt(selectedClassId) &&
        !selectedStudentIds.includes(String(s.id))
    );
  }, [selectedClassId, students, selectedStudentIds]);

  const availableTeachers = useMemo(() => {
    return teachers.filter((t) => !selectedTeacherIds.includes(String(t.id)));
  }, [teachers, selectedTeacherIds]);

  if (schoolDataLoading || !user || !schoolId) {
    return (
      <DashboardLayout title="Messages">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const CURRENT_USER_ID = user.id;

  const receivedMessages = messages
    .filter(
      (msg) =>
        msg.sender_id !== CURRENT_USER_ID &&
        msg.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    );

  const sentMessages = messages
    .filter(
      (msg) =>
        msg.sender_id === CURRENT_USER_ID &&
        msg.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    );

  // --- FIX: Memoized logic for paginating data ---
  const paginatedReceived = useMemo(() => {
    const startIndex = (receivedPage - 1) * ITEMS_PER_PAGE;
    return receivedMessages.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [receivedMessages, receivedPage]);

  const totalReceivedPages = Math.ceil(
    receivedMessages.length / ITEMS_PER_PAGE
  );

  const paginatedSent = useMemo(() => {
    const startIndex = (sentPage - 1) * ITEMS_PER_PAGE;
    return sentMessages.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sentMessages, sentPage]);

  const totalSentPages = Math.ceil(sentMessages.length / ITEMS_PER_PAGE);

  const resetAndCloseDialog = () => {
    setIsDialogOpen(false);
    setContent("");
    setMessageType("announcement");
    setReceiverType("");
    setSelectedClassId("");
    setSelectedStudentIds([]);
    setSelectedTeacherIds([]);
  };

  const handleReply = (messageToReplyTo: Message) => {
    if (!messageToReplyTo.sender_id || !messageToReplyTo.sender_role) {
      toast({
        title: "Cannot Reply",
        description: "Sender information is missing.",
        variant: "destructive",
      });
      return;
    }
    const role = messageToReplyTo.sender_role;
    if (role === "teacher") {
      setReceiverType("individual_staff");
      setSelectedTeacherIds([String(messageToReplyTo.sender_id)]);
    } else if (role === "student") {
      setReceiverType("individual_student");
      const student = students.find((s) => s.id === messageToReplyTo.sender_id);
      if (student?.class_id) setSelectedClassId(String(student.class_id));
      setSelectedStudentIds([String(messageToReplyTo.sender_id)]);
    }
    setMessageType("personal");
    setIsDialogOpen(true);
  };

  const getSenderName = (message: Message) => {
    if (message.sender_role === "teacher")
      return (
        teachers.find((t) => t.id === message.sender_id)?.full_name ||
        "Unknown Teacher"
      );
    if (message.sender_role === "student")
      return (
        students.find((s) => s.id === message.sender_id)?.full_name ||
        "Unknown Student"
      );
    return message.sender_role || "Unknown";
  };

  const getReceiverName = (message: Message) => {
    if (message.receiver_role === "teacher")
      return (
        teachers.find((t) => t.id === message.receiver_id)?.full_name ||
        "Unknown Teacher"
      );
    if (message.receiver_role === "student")
      return (
        students.find((s) => s.id === message.receiver_id)?.full_name ||
        "Unknown Student"
      );
    return message.receiver_role || "Unknown Group";
  };

  const handleSubmit = () => {
    if (!content || !receiverType) {
      toast({
        title: "Error",
        description: "Please fill the message and select a receiver type.",
        variant: "destructive",
      });
      return;
    }
    let receiver_ids: number[] = [];
    let receiver_role: string = "";
    switch (receiverType) {
      case "all_students":
        receiver_ids = students.map((s) => s.id);
        receiver_role = "student";
        break;
      case "all_teachers":
        receiver_ids = teachers.map((t) => t.id);
        receiver_role = "teacher";
        break;
      case "class":
        if (!selectedClassId) {
          toast({
            title: "Error",
            description: "Please select a class.",
            variant: "destructive",
          });
          return;
        }
        receiver_ids = students
          .filter((s) => s.class_id === parseInt(selectedClassId))
          .map((s) => s.id);
        receiver_role = "student";
        break;
      case "individual_student":
        if (selectedStudentIds.length === 0) {
          toast({
            title: "Error",
            description: "Please select at least one student.",
            variant: "destructive",
          });
          return;
        }
        receiver_ids = selectedStudentIds.map((id) => parseInt(id));
        receiver_role = "student";
        break;
      case "individual_staff":
        if (selectedTeacherIds.length === 0) {
          toast({
            title: "Error",
            description: "Please select at least one staff member.",
            variant: "destructive",
          });
          return;
        }
        receiver_ids = selectedTeacherIds.map((id) => parseInt(id));
        receiver_role = "teacher";
        break;
      default:
        toast({
          title: "Error",
          description: "Invalid receiver type selected.",
          variant: "destructive",
        });
        return;
    }
    if (receiver_ids.length === 0) {
      toast({
        title: "Error",
        description: "No recipients found for the selected group.",
        variant: "destructive",
      });
      return;
    }
    createMessage.mutate({
      content,
      message_type: messageType,
      receiver_role,
      receiver_ids,
    });
  };

  return (
    <DashboardLayout title="Messages">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Messaging Center</h1>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>
        <div className="mb-4">
          <Input
            placeholder="Search messages by content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* --- FIX: Replaced DataTables with Tabs and Message Cards --- */}
        <Tabs defaultValue="received">
          <TabsList>
            <TabsTrigger value="received">
              Received ({receivedMessages.length})
            </TabsTrigger>
            <TabsTrigger value="sent">Sent ({sentMessages.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4 pt-4">
            {messagesLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              paginatedReceived.map((message) => (
                <Card key={message.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex justify-between items-center">
                      <span>From: {getSenderName(message)}</span>
                      <span className="text-xs font-light text-gray-500">
                        {new Date(message.created_at || 0).toLocaleString()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{message.content}</p>
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReply(message)}
                      >
                        <Reply className="w-3 h-3 mr-2" />
                        Reply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setReceivedPage((p) => Math.max(p - 1, 1));
                    }}
                    disabled={receivedPage === 1}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm p-2">
                    Page {receivedPage} of {totalReceivedPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setReceivedPage((p) =>
                        Math.min(p + 1, totalReceivedPages)
                      );
                    }}
                    disabled={receivedPage >= totalReceivedPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </TabsContent>

          <TabsContent value="sent" className="space-y-4 pt-4">
            {messagesLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              paginatedSent.map((message) => (
                <Card key={message.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex justify-between items-center">
                      <span>
                        To: {getReceiverName(message)} ({message.receiver_role})
                      </span>
                      <span className="text-xs font-light text-gray-500">
                        {new Date(message.created_at || 0).toLocaleString()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{message.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setSentPage((p) => Math.max(p - 1, 1));
                    }}
                    disabled={sentPage === 1}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm p-2">
                    Page {sentPage} of {totalSentPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setSentPage((p) => Math.min(p + 1, totalSentPages));
                    }}
                    disabled={sentPage >= totalSentPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </TabsContent>
        </Tabs>

        {/* --- Dialog remains the same with multi-select capability --- */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent
            className="sm:max-w-[425px]"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Send New Message</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Receiver Type
                </label>
                <Select value={receiverType} onValueChange={setReceiverType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select receiver type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_students">All Students</SelectItem>
                    <SelectItem value="all_teachers">All Teachers</SelectItem>
                    <SelectItem value="class">A Specific Class</SelectItem>
                    <SelectItem value="individual_student">
                      Individual Student(s)
                    </SelectItem>
                    <SelectItem value="individual_staff">
                      Individual Staff Member(s)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {receiverType === "class" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Select Class
                  </label>
                  <Select
                    value={selectedClassId}
                    onValueChange={setSelectedClassId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={String(cls.id)}>
                          Class {cls.grade} {cls.section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {receiverType === "individual_student" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium mb-1 block">
                    Add Student(s)
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                    {selectedStudentIds.map((id) => {
                      const student = students.find((s) => String(s.id) === id);
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-1 bg-gray-200 text-gray-800 rounded-full px-2 py-1 text-sm"
                        >
                          {student?.full_name || `ID: ${id}`}
                          <button
                            onClick={() =>
                              setSelectedStudentIds((prev) =>
                                prev.filter((sid) => sid !== id)
                              )
                            }
                            className="rounded-full hover:bg-gray-300 p-0.5"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <Select
                    value=""
                    onValueChange={(id) => {
                      if (id && !selectedStudentIds.includes(id))
                        setSelectedStudentIds((prev) => [...prev, id]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add a student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStudentsByClass.length > 0 ? (
                        filteredStudentsByClass.map((student) => (
                          <SelectItem
                            key={student.id}
                            value={String(student.id)}
                          >
                            {student.full_name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">
                          No more students to add.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {receiverType === "individual_staff" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium mb-1 block">
                    Add Staff Member(s)
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                    {selectedTeacherIds.map((id) => {
                      const teacher = teachers.find((t) => String(t.id) === id);
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-1 bg-gray-200 text-gray-800 rounded-full px-2 py-1 text-sm"
                        >
                          {teacher?.full_name || `ID: ${id}`}
                          <button
                            onClick={() =>
                              setSelectedTeacherIds((prev) =>
                                prev.filter((tid) => tid !== id)
                              )
                            }
                            className="rounded-full hover:bg-gray-300 p-0.5"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <Select
                    value=""
                    onValueChange={(id) => {
                      if (id && !selectedTeacherIds.includes(id))
                        setSelectedTeacherIds((prev) => [...prev, id]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add a staff member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={String(teacher.id)}>
                          {teacher.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Message Type
                </label>
                <Select value={messageType} onValueChange={setMessageType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="notice">Notice</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Message
                </label>
                <Textarea
                  placeholder="Type your message here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetAndCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createMessage.isPending}>
                {createMessage.isPending ? "Sending..." : "Send Message"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
