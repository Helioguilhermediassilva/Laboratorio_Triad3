import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  className?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  className 
}: StatsCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden bg-gradient-card border-border/50 hover:shadow-md transition-all duration-200",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {value}
            </p>
            {change && (
              <div className={cn(
                "flex items-center text-xs font-medium",
                change.type === "increase" ? "text-success" : "text-destructive"
              )}>
                <span className="mr-1">
                  {change.type === "increase" ? "↗" : "↘"}
                </span>
                {Math.abs(change.value)}%
              </div>
            )}
          </div>
          
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-primary opacity-5 pointer-events-none" />
      </CardContent>
    </Card>
  );
}