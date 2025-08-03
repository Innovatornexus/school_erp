import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

/**
 * Layout component for dashboard pages
 * Includes responsive sidebar and header
 */
export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Component - Hidden on mobile unless toggled */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar when open */}
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
            onClick={closeSidebar}
          />
          
          {/* Mobile Sidebar */}
          <div className="md:hidden">
            <Sidebar mobileOpen onClose={closeSidebar} />
          </div>
        </>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with mobile menu toggle */}
        <Header title={title} onMenuClick={toggleSidebar} />
        
        {/* Page Content with Scrolling */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
