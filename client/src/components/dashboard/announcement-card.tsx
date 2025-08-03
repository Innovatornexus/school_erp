import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: "primary" | "warning" | "info";
  timestamp: string;
}

interface AnnouncementCardProps {
  announcements: Announcement[];
  onPostAnnouncement?: () => void;
}

/**
 * Announcement card component for dashboard
 * Displays school announcements and notices
 */
export function AnnouncementCard({ 
  announcements = [], 
  onPostAnnouncement 
}: AnnouncementCardProps) {
  const { user } = useAuth();
  const canPostAnnouncement = user?.role === "super_admin" || user?.role === "school_admin";
  
  // Get appropriate border color based on announcement type
  const getBorderColor = (type: Announcement["type"]) => {
    switch(type) {
      case "primary": return "border-primary-500";
      case "warning": return "border-amber-500";
      case "info": return "border-blue-500";
      default: return "border-primary-500";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Announcements</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No announcements available</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div 
              key={announcement.id} 
              className={`border-l-4 ${getBorderColor(announcement.type)} pl-3 py-2`}
            >
              <p className="text-sm font-medium text-foreground">{announcement.title}</p>
              <p className="text-xs text-muted-foreground">{announcement.content}</p>
              <p className="text-xs text-zinc-400 mt-1">{announcement.timestamp}</p>
            </div>
          ))
        )}
        
        {/* Post announcement button (only for authorized users) */}
        {canPostAnnouncement && (
          <div className="text-center mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary font-medium"
              onClick={onPostAnnouncement}
            >
              Post Announcement
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
