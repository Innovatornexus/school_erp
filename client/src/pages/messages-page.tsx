import { useState } from "react";
import DashboardLayout from "@/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Message } from "@shared/schema";
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

const columns = [
  {
    accessorKey: "content",
    header: "Message",
  },
  {
    accessorKey: "message_type",
    header: "Type",
  },
  {
    accessorKey: "receiver_role",
    header: "Receiver",
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => {
      console.log(row); // Check the structure
      const createdAt = row?.getValue("created_at");
      return createdAt ? new Date(createdAt).toLocaleDateString() : "-";
    },
  },
];

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [content, setContent] = useState("");
  const [receiverRole, setReceiverRole] = useState("");
  const [messageType, setMessageType] = useState("announcement");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["messages"],
    queryFn: async () => {
      const res = await fetch("/api/schools/1/messages");
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
  });

  const createMessage = useMutation({
    mutationFn: async (data: {
      content: string;
      receiver_role: string;
      message_type: string;
    }) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          school_id: 1, // Using hardcoded school ID for demo
        }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setIsDialogOpen(false);
      setContent("");
      setReceiverRole("");
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

  const filteredMessages = messages.filter((message) =>
    message.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    if (!content || !receiverRole) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createMessage.mutate({
      content,
      receiver_role: receiverRole,
      message_type: messageType,
    });
  };

  return (
    <DashboardLayout title="Messages">
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Messages</CardTitle>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <DataTable columns={columns} data={filteredMessages} />
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Receiver
                </label>
                <Select value={receiverRole} onValueChange={setReceiverRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select receiver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">All Teachers</SelectItem>
                    <SelectItem value="student">All Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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
