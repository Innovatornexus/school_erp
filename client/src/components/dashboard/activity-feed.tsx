import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  UserPlus, 
  DollarSign, 
  BookOpen, 
  Clock 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: number;
  type: "user" | "payment" | "academic" | "attendance";
  content: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  onViewAll?: () => void;
}

/**
 * Activity feed component for dashboard
 * Shows recent system activities
 */
export function ActivityFeed({ activities = [], onViewAll }: ActivityFeedProps) {
  // Get icon for activity type
  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch(type) {
      case "user":
        return {
          icon: <UserPlus className="text-primary-600 h-4 w-4" />,
          bgColor: "bg-primary-100"
        };
      case "payment":
        return {
          icon: <DollarSign className="text-success h-4 w-4" />,
          bgColor: "bg-success-100"
        };
      case "academic":
        return {
          icon: <BookOpen className="text-blue-600 h-4 w-4" />,
          bgColor: "bg-blue-100"
        };
      case "attendance":
        return {
          icon: <Clock className="text-amber-600 h-4 w-4" />,
          bgColor: "bg-amber-100"
        };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => {
              const { icon, bgColor } = getActivityIcon(activity.type);
              
              return (
                <div key={activity.id} className="flex">
                  <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3", bgColor)}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{activity.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {activities.length > 0 && onViewAll && (
          <div className="mt-4 text-center">
            <button onClick={onViewAll} className="text-sm font-medium text-primary hover:text-primary-dark">
              View All Activities
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
