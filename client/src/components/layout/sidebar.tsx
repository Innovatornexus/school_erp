import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  School,
  User,
  Home,
  Users,
  BookOpen,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  LogOut,
  Building,
  UserCog,
  Award,
  FolderOpen,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Sidebar component for application navigation
 * Shows different navigation options based on user role
 */
export default function Sidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const [location] = useLocation();
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

  // Handle logout click
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get user's display name (email for now)
  const displayName = user?.email ? user.email.split("@")[0] : "User";

  // Classes for navigation items
  const baseNavClass = "flex items-center px-4 py-2 text-sm transition-colors";
  const activeNavClass = `${baseNavClass} bg-blue-600 text-white font-medium`;
  const inactiveNavClass = `${baseNavClass} text-slate-100 hover:bg-blue-700/70`;

  // If sidebar should be hidden on mobile
  if (isMobile && !mobileOpen) {
    return null;
  }

  return (
    <div
      className={`${
        isMobile ? "fixed inset-y-0 left-0 z-30" : "flex"
      } flex-col w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white shadow-lg h-screen`}
    >
      {/* Logo & App Title */}
      <div className="p-4 flex items-center justify-center border-b border-blue-700/50">
        <School className="mr-2 h-6 w-6 text-blue-200" />
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
          School Manager
        </h1>
      </div>

      {/* User Profile Summary */}
      <div className="p-4 flex items-center border-b border-blue-700/50">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-inner">
          <span className="font-medium text-white">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="ml-3">
          <p className="font-medium text-white">{displayName}</p>
          <p className="text-xs text-blue-200">
            {user?.role.replace("_", " ")}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <ScrollArea className="flex-1">
        <nav className="py-4">
          <div className="px-4 mb-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
            Main
          </div>

          <Link
            href="/"
            className={location === "/" ? activeNavClass : inactiveNavClass}
          >
            <Home className="mr-3 h-4 w-4" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/profile"
            className={
              location === "/profile" ? activeNavClass : inactiveNavClass
            }
          >
            <User className="mr-3 h-4 w-4" />
            <span>Profile</span>
          </Link>

          {/* Super Admin Navigation */}
          {user?.role === "super_admin" && (
            <>
              <div className="px-4 mt-6 mb-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
                System Management
              </div>

              <Link
                href="/schools"
                className={
                  location === "/schools" ? activeNavClass : inactiveNavClass
                }
              >
                <Building className="mr-3 h-4 w-4" />
                <span>Schools</span>
              </Link>

              <Link
                href="/school-admins"
                className={
                  location === "/school-admins"
                    ? activeNavClass
                    : inactiveNavClass
                }
              >
                <UserCog className="mr-3 h-4 w-4" />
                <span>School Admins</span>
              </Link>
            </>
          )}

          {/* School Admin & Teacher Navigation */}
          {(user?.role === "school_admin" || user?.role === "staff") && (
            <>
              <div className="px-4 mt-6 mb-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
                School Management
              </div>
              {/* only school_admin */}
              {user?.role === "school_admin" && (
                <>
                  <Link
                    href="/staff"
                    className={
                      location === "/staff" ? activeNavClass : inactiveNavClass
                    }
                  >
                    <Users className="mr-3 h-4 w-4" />
                    <span>Staff</span>
                  </Link>
                  <Link
                    href="/subjects"
                    className={
                      location === "/subjects"
                        ? activeNavClass
                        : inactiveNavClass
                    }
                  >
                    <BookOpen className="mr-3 h-4 w-4" />
                    <span>Subjects</span>
                  </Link>
                </>
              )}

              <Link
                href="/students"
                className={
                  location === "/students" ? activeNavClass : inactiveNavClass
                }
              >
                <School className="mr-3 h-4 w-4" />
                <span>Students</span>
              </Link>

              <div className="px-4 mt-6 mb-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Academic
              </div>

              <Link
                href="/homework"
                className={
                  location === "/homework" ? activeNavClass : inactiveNavClass
                }
              >
                <FileText className="mr-3 h-4 w-4" />
                <span>Homework</span>
              </Link>

              <Link
                href="/materials"
                className={
                  location === "/materials" ? activeNavClass : inactiveNavClass
                }
              >
                <FolderOpen className="mr-3 h-4 w-4" />
                <span>Materials</span>
              </Link>

              <Link
                href="/tests"
                className={
                  location === "/tests" ? activeNavClass : inactiveNavClass
                }
              >
                <Target className="mr-3 h-4 w-4" />
                <span>Tests & Quizzes</span>
              </Link>

              <Link
                href="/exams"
                className={
                  location === "/exams" ? activeNavClass : inactiveNavClass
                }
              >
                <Award className="mr-3 h-4 w-4" />
                <span>Examinations</span>
              </Link>

              <Link href="/attendance">
                <a
                  className={
                    location === "/attendance"
                      ? activeNavClass
                      : inactiveNavClass
                  }
                >
                  <Calendar className="mr-3 h-4 w-4" />
                  <span>Attendance</span>
                </a>
              </Link>

              {user?.role === "school_admin" && (
                <>
                  <Link href="/fees">
                    <a
                      className={
                        location === "/fees" ? activeNavClass : inactiveNavClass
                      }
                    >
                      <DollarSign className="mr-3 h-4 w-4" />
                      <span>Fees</span>
                    </a>
                  </Link>

                  <Link href="/bills">
                    <a
                      className={
                        location === "/bills"
                          ? activeNavClass
                          : inactiveNavClass
                      }
                    >
                      <FileText className="mr-3 h-4 w-4" />
                      <span>Bills</span>
                    </a>
                  </Link>
                  <Link href="/messages">
                    <a
                      className={
                        location === "/messages"
                          ? activeNavClass
                          : inactiveNavClass
                      }
                    >
                      <MessageSquare className="mr-3 h-4 w-4" />
                      <span>Messages</span>
                    </a>
                  </Link>
                </>
              )}
            </>
          )}

          {/* Student Navigation */}
          {user?.role === "staff" && (
            <>
              <div className="px-4 mt-6 mb-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Teaching
              </div>
              <Link href="/teacher/classes">
                <a
                  className={
                    location === "/teacher/classes"
                      ? activeNavClass
                      : inactiveNavClass
                  }
                >
                  <BookOpen className="mr-3 h-4 w-4" />
                  <span>My Classes</span>
                </a>
              </Link>

              <Link href="/teacher/subjects">
                <a
                  className={
                    location === "/teacher/subjects"
                      ? activeNavClass
                      : inactiveNavClass
                  }
                >
                  <BookOpen className="mr-3 h-4 w-4" />
                  <span>My Subjects</span>
                </a>
              </Link>

              <Link href="/teacher/messages">
                <a
                  className={
                    location === "/teacher/messages"
                      ? activeNavClass
                      : inactiveNavClass
                  }
                >
                  <MessageSquare className="mr-3 h-4 w-4" />
                  <span>Messages</span>
                </a>
              </Link>

              <Link href="/class-logs">
                <a
                  className={
                    location === "/class-logs"
                      ? activeNavClass
                      : inactiveNavClass
                  }
                >
                  <BookOpen className="mr-3 h-4 w-4" />
                  <span>Class Logs</span>
                </a>
              </Link>
            </>
          )}

          {user?.role === "student" && (
            <>
              <div className="px-4 mt-6 mb-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Academic
              </div>
              <Link href="/student/classes">
                <a
                  className={
                    location === "/student/classes"
                      ? activeNavClass
                      : inactiveNavClass
                  }
                >
                  <BookOpen className="mr-3 h-4 w-4" />
                  <span>My Classes</span>
                </a>
              </Link>
              <Link href="/student/fees">
                <a
                  className={
                    location === "/student/fees"
                      ? activeNavClass
                      : inactiveNavClass
                  }
                >
                  <DollarSign className="mr-3 h-4 w-4" />
                  <span>My Fees</span>
                </a>
              </Link>
              <Link href="/student/messages">
                <a
                  className={
                    location === "/student/messages"
                      ? activeNavClass
                      : inactiveNavClass
                  }
                >
                  <MessageSquare className="mr-3 h-4 w-4" />
                  <span>My Messages</span>
                </a>
              </Link>
              <Link href="/student/attendance">
                <a
                  className={
                    location === "/attendance"
                      ? activeNavClass
                      : inactiveNavClass
                  }
                >
                  <Calendar className="mr-3 h-4 w-4" />
                  <span>Attendance</span>
                </a>
              </Link>
            </>
          )}

          {/* Parent Navigation */}
          {user?.role === "parent" && (
            <>
              <div className="px-4 mt-6 mb-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Child Information
              </div>

              <Link href="/students">
                <a
                  className={
                    location === "/students" ? activeNavClass : inactiveNavClass
                  }
                >
                  <School className="mr-3 h-4 w-4" />
                  <span>My Children</span>
                </a>
              </Link>

              <Link href="/attendance">
                <a
                  className={
                    location === "/attendance"
                      ? activeNavClass
                      : inactiveNavClass
                  }
                >
                  <Calendar className="mr-3 h-4 w-4" />
                  <span>Attendance</span>
                </a>
              </Link>

              <Link href="/fees">
                <a
                  className={
                    location === "/fees" ? activeNavClass : inactiveNavClass
                  }
                >
                  <DollarSign className="mr-3 h-4 w-4" />
                  <span>Fees</span>
                </a>
              </Link>

              <Link href="/messages">
                <a
                  className={
                    location === "/messages" ? activeNavClass : inactiveNavClass
                  }
                >
                  <MessageSquare className="mr-3 h-4 w-4" />
                  <span>Messages</span>
                </a>
              </Link>
            </>
          )}
        </nav>
      </ScrollArea>

      {/* Logout Button */}
      <div className="p-4 border-t border-blue-700/50">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-100 hover:text-white hover:bg-blue-700/70"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="mr-3 h-4 w-4" />
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>

      {/* Mobile close button (if provided) */}
      {isMobile && onClose && (
        <div className="p-4 border-t border-blue-700/50">
          <Button
            variant="outline"
            className="w-full text-white border-blue-500 hover:bg-blue-700/70"
            onClick={onClose}
          >
            Close Menu
          </Button>
        </div>
      )}
    </div>
  );
}
