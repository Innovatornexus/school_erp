import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/layout/dashboard-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { AnnouncementCard } from "@/components/dashboard/announcement-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { FeeCollection } from "@/components/dashboard/fee-collection";
import { UpcomingExams } from "@/components/dashboard/upcoming-exams";
import { 
  Users, 
  School, 
  Clock, 
  DollarSign,
  CircleAlert,
  TriangleAlert,
  X,
  CircleHelp,
  Cloud,
  PanelTopClose,
  PanelTopOpen,
  PanelTopDashed,
  OctagonAlert,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Dashboard page component
 * Shows different dashboard content based on user role
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementType, setAnnouncementType] = useState<"primary" | "warning" | "info">("primary");
  
  // In a real app, these would come from API calls
  // For now using sample data based on design reference
  
  // Sample stats data
  const statsData = {
    students: { count: 532, trend: { value: "4.5% from last month", direction: "up" as const } },
    teachers: { count: 42, trend: { value: "Same as last month", direction: "neutral" as const } },
    attendance: { count: "92%", trend: { value: "2.1% from last week", direction: "up" as const } },
    feeCollection: { count: "78%", trend: { value: "3.2% from last month", direction: "down" as const } }
  };
  
  // Sample announcements
  const announcements = [
    { id: 1, title: "Parent-Teacher Meeting", content: "Scheduled for May 25, 2025. All teachers must attend.", type: "primary" as const, timestamp: "2 hours ago" },
    { id: 2, title: "Annual Sports Day", content: "Preparations to begin next week. PE teachers to coordinate.", type: "warning" as const, timestamp: "Yesterday" },
    { id: 3, title: "Library Renovation", content: "Library will be closed from May 10-15 for renovations.", type: "info" as const, timestamp: "3 days ago" }
  ];
  
  // Sample recent activities
  const activities = [
    { id: 1, type: "user" as const, content: "New student John Smith added to Class 7B", timestamp: "2 hours ago" },
    { id: 2, type: "payment" as const, content: "Fee payment of $540 received for student Sarah Johnson", timestamp: "Yesterday" },
    { id: 3, type: "academic" as const, content: "New lesson plan submitted by Ms. Rebecca for Science Class", timestamp: "2 days ago" },
    { id: 4, type: "attendance" as const, content: "Attendance marked for Class 10A by Mr. Thompson", timestamp: "3 days ago" }
  ];
  
  // Sample fee data
  const feeTypes = [
    { id: 1, name: "April 2025 Term", percentage: 78, color: "success" as const },
    { id: 2, name: "Library Fund", percentage: 45, color: "warning" as const },
    { id: 3, name: "Sports Fund", percentage: 32, color: "destructive" as const }
  ];
  
  const classFeeData = [
    { id: 1, className: "Class 8A", totalStudents: 42, paidCount: 38, pendingCount: 4, percentage: 90 },
    { id: 2, className: "Class 9B", totalStudents: 45, paidCount: 32, pendingCount: 13, percentage: 71 },
    { id: 3, className: "Class 10C", totalStudents: 38, paidCount: 24, pendingCount: 14, percentage: 63 }
  ];
  
  // Sample exam data
  const exams = [
    { id: 1, name: "Mid Term Science", className: "Class 9A", date: "May 15, 2025", status: "pending" as const },
    { id: 2, name: "English Literature", className: "Class 10B", date: "May 18, 2025", status: "pending" as const },
    { id: 3, name: "Mathematics", className: "Class 8C", date: "May 20, 2025", status: "scheduled" as const }
  ];
  
  // Handle post announcement
  const handlePostAnnouncement = () => {
    // In a real app, this would call an API to save the announcement
    if (announcementTitle.trim() === "" || announcementContent.trim() === "") {
      toast({
        title: "Missing information",
        description: "Please provide both a title and content for the announcement",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Announcement Posted",
      description: "Your announcement has been successfully posted",
    });
    
    // Reset form and close dialog
    setAnnouncementTitle("");
    setAnnouncementContent("");
    setAnnouncementType("primary");
    setAnnouncementDialogOpen(false);
  };

  // The dashboard page will show different content based on the user's role
  return (
    <DashboardLayout title="Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Students"
          value={statsData.students.count}
          icon={<School className="h-5 w-5 text-primary-600" />}
          iconClassName="bg-primary-100"
          trend={statsData.students.trend}
        />
        
        <StatsCard
          title="Total Teachers"
          value={statsData.teachers.count}
          icon={<Users className="h-5 w-5 text-secondary-600" />}
          iconClassName="bg-secondary-100"
          trend={statsData.teachers.trend}
        />
        
        <StatsCard
          title="Attendance Rate"
          value={statsData.attendance.count}
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          iconClassName="bg-blue-100"
          trend={statsData.attendance.trend}
        />
        
        <StatsCard
          title="Fee Collection"
          value={statsData.feeCollection.count}
          icon={<DollarSign className="h-5 w-5 text-success" />}
          iconClassName="bg-success-100"
          trend={statsData.feeCollection.trend}
        />
      </div>
      
      {/* Middle Section - Exams & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Upcoming Exams - Takes 2/3 of the row on large screens */}
        <div className="lg:col-span-2">
          <UpcomingExams 
            exams={exams}
            onViewAll={() => {
              toast({
                title: "Feature coming soon",
                description: "View all exams functionality will be available in the next update",
              });
            }}
          />
        </div>
        
        {/* Announcements - Takes 1/3 of the row on large screens */}
        <div>
          <AnnouncementCard 
            announcements={announcements}
            onPostAnnouncement={() => setAnnouncementDialogOpen(true)}
          />
        </div>
      </div>
      
      {/* Bottom Section - Activity & Fees */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div>
          <ActivityFeed 
            activities={activities}
            onViewAll={() => {
              toast({
                title: "Feature coming soon",
                description: "View all activities functionality will be available in the next update",
              });
            }}
          />
        </div>
        
        {/* Fee Collection Status - Takes 2/3 of the row on large screens */}
        <div className="lg:col-span-2">
          <FeeCollection 
            feeTypes={feeTypes}
            classFeeData={classFeeData}
            onViewAll={() => {
              toast({
                title: "Feature coming soon",
                description: "View all fee details functionality will be available in the next update",
              });
            }}
          />
        </div>
      </div>
      
      {/* Announcement Dialog */}
      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Post a New Announcement</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 mt-1">
                <Cloud className="h-4 w-4" />
                <span>Create an announcement to be displayed on the dashboard. All users will be able to see it.</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Announcement Title</Label>
              <Input 
                id="title" 
                value={announcementTitle} 
                onChange={(e) => setAnnouncementTitle(e.target.value)} 
                placeholder="Title of announcement" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Announcement Content</Label>
              <Textarea 
                id="content" 
                value={announcementContent} 
                onChange={(e) => setAnnouncementContent(e.target.value)} 
                placeholder="Detailed information about the announcement"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Announcement Type</Label>
              <Select 
                value={announcementType} 
                onValueChange={(value) => setAnnouncementType(value as any)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">General Information</SelectItem>
                  <SelectItem value="warning">Important Alert</SelectItem>
                  <SelectItem value="info">Informational Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnouncementDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button onClick={handlePostAnnouncement}>
              <TriangleAlert className="h-4 w-4 mr-2" /> Post Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
