import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Bell, Search, Menu, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

/**
 * Application header component with mobile menu toggle, search, and user menu
 */
export default function Header({ title, onMenuClick }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if screen size is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get user's display initials for avatar
  const getInitials = () => {
    if (!user?.email) return "U";
    const parts = user.email.split('@')[0].split(/[._-]/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Mobile Menu Toggle */}
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
            <Menu className="h-5 w-5 text-neutral-500" />
          </Button>
        )}
        
        {/* Page Title */}
        <h1 className={`text-lg md:text-xl font-medium text-neutral-800 ${isMobile ? '' : 'ml-0'}`}>
          {title}
        </h1>
        
        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Search - Hidden on Mobile */}
          <div className="hidden md:flex items-center bg-neutral-100 rounded-md px-3 py-1">
            <Search className="text-neutral-400 mr-2 h-4 w-4" />
            <Input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none focus:outline-none text-sm py-1 h-8 w-40 lg:w-64" 
            />
          </div>
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-neutral-500" />
            <Badge className="absolute top-0 right-0 h-2 w-2 p-0 bg-destructive border-2 border-white" />
          </Button>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                  <span className="text-sm font-medium">{getInitials()}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <a className="flex cursor-pointer items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </a>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => logoutMutation.mutate()}
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
