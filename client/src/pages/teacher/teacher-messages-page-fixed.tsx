import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, User, Clock, Send } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSchoolData } from "@/context/SchoolDataContext";

interface Message {
  id: number;
  content: string;
  sender_name: string;
  sender_role: string;
  receiver_name: string;
  receiver_role: string;
  created_at: string;
  status: "read" | "unread";
  message_type: string;
}

export default function TeacherMessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { schoolData } = useSchoolData();
  const [newMessage, setNewMessage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");

  const schoolId = schoolData?.id || 1;

  // Fetch teacher details
  const { data: teacher, isLoading: isLoadingTeacher } = useQuery({
    queryKey: ["teacher", user?.email],
    queryFn: async () => {
      const res = await fetch(`/api/Teachers/${user?.email}/staff`);
      if (!res.ok) throw new Error("Failed to fetch teacher");
      const teachers = await res.json();
      return teachers[0];
    },
    enabled: !!user?.email,
  });

  const teacherId = teacher?.id;

  // Fetch messages for the teacher
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<
    Message[]
  >({
    queryKey: ["teacher-messages", teacherId],
    queryFn: async () => {
      if (!teacherId) return [];

      // Get both sent and received messages
      const [sentRes, receivedRes] = await Promise.all([
        fetch(`/api/messages/sent/${teacherId}`),
        fetch(`/api/messages/received/${teacherId}/teacher`),
      ]);

      if (!sentRes.ok || !receivedRes.ok)
        throw new Error("Failed to fetch messages");

      const sentMessages = await sentRes.json();
      const receivedMessages = await receivedRes.json();

      // Combine and sort by date
      const allMessages = [...sentMessages, ...receivedMessages].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return allMessages;
    },
    enabled: !!teacherId,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          sender_id: teacherId,
          sender_role: "teacher",
          receiver_role: "school_admin",
          receiver_id: 1, // Send to school admin
          school_id: schoolId,
          message_type: "personal",
        }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["teacher-messages", teacherId],
      });
      setNewMessage("");
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "read" }),
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["teacher-messages", teacherId],
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }
    sendMessage.mutate(newMessage);
  };

  if (isLoadingTeacher || isLoadingMessages) {
    return (
      <DashboardLayout title="My Messages">
        <div className="container py-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Messages">
      <div className="container py-6">
        <div className="grid gap-6">
          {/* Send New Message */}
          <Card>
            <CardHeader>
              <CardTitle>Send New Message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sendMessage.isPending}
                  className="w-full"
                >
                  {sendMessage.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Messages List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Messages</h2>
            {messages.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                </CardContent>
              </Card>
            ) : (
              messages.map((message) => (
                <Card
                  key={message.id}
                  className={
                    message.status === "unread"
                      ? "border-blue-200 bg-blue-50"
                      : ""
                  }
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                      {message.message_type === "announcement"
                        ? "Announcement"
                        : "Personal Message"}
                    </CardTitle>
                    <Badge
                      variant={
                        message.status === "unread" ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        message.status === "unread" &&
                        markAsRead.mutate(message.id)
                      }
                    >
                      {message.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <User className="mr-2 h-4 w-4" />
                        <span>
                          {message.sender_role === "teacher"
                            ? "To: "
                            : "From: "}
                          {message.sender_role === "teacher"
                            ? message.receiver_name
                            : message.sender_name}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mt-2">{message.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
