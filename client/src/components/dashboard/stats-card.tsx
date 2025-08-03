import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconClassName?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
}

/**
 * Statistics card component for dashboard
 * Displays a metric with optional trend indicator
 */
export function StatsCard({ title, value, icon, iconClassName, trend }: StatsCardProps) {
  // Determine trend color and icon
  const getTrendDetails = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case "up":
        return {
          icon: <ArrowUpIcon className="h-3 w-3 mr-1" />,
          className: "text-success"
        };
      case "down":
        return {
          icon: <ArrowDownIcon className="h-3 w-3 mr-1" />,
          className: "text-destructive"
        };
      case "neutral":
        return {
          icon: <MinusIcon className="h-3 w-3 mr-1" />,
          className: "text-muted-foreground"
        };
    }
  };
  
  const trendDetails = getTrendDetails();

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          </div>
          
          <div className={cn("p-3 rounded-full", iconClassName || "bg-primary-100")}>
            {icon}
          </div>
        </div>
        
        {trend && trendDetails && (
          <p className={cn("text-xs flex items-center mt-4", trendDetails.className)}>
            {trendDetails.icon}
            <span>{trend.value}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
