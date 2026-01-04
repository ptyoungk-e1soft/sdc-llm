"use client";

import { ReactNode } from "react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { Header } from "./Header";
import { HistorySidebar } from "@/components/sidebar/HistorySidebar";
import { ModelSidebar } from "@/components/sidebar/ModelSidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { leftSidebarOpen, rightSidebarOpen } = useSidebarStore();

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Chat History */}
        <aside
          className={cn(
            "border-r border-gray-200 bg-gray-50 transition-all duration-300 ease-in-out overflow-hidden",
            leftSidebarOpen ? "w-64" : "w-0"
          )}
        >
          <div className="w-64 h-full">
            <HistorySidebar />
          </div>
        </aside>

        {/* Main Content - Chat Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          {children}
        </main>

        {/* Right Sidebar - Model Selector */}
        <aside
          className={cn(
            "border-l border-gray-200 bg-gray-50 transition-all duration-300 ease-in-out overflow-hidden",
            rightSidebarOpen ? "w-64" : "w-0"
          )}
        >
          <div className="w-64 h-full">
            <ModelSidebar />
          </div>
        </aside>
      </div>
    </div>
  );
}
