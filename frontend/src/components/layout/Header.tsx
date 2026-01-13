"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PanelLeft, PanelRight, LogOut, User, Settings, ExternalLink } from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useViewModeStore } from "@/stores/viewModeStore";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

export function Header() {
  const { data: session } = useSession();
  const { toggleLeftSidebar, toggleRightSidebar } = useSidebarStore();
  const { resetToCards } = useViewModeStore();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      if (session?.user?.id) {
        try {
          const res = await fetch("/api/auth/check-admin");
          const data = await res.json();
          setIsAdmin(data.isAdmin);
        } catch {
          setIsAdmin(false);
        }
      }
    };
    checkAdmin();
  }, [session]);

  return (
    <header className="h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLeftSidebar}
          title="Toggle History Sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
        <button
          onClick={() => {
            resetToCards();
            router.push("/chat");
          }}
          className="hover:opacity-80 transition-opacity"
        >
          <h1 className="text-lg font-semibold text-gray-900">SDC 고객품질 분석 AI 시스템</h1>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <a
          href="http://localhost:7860"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-md hover:from-purple-600 hover:to-indigo-700 transition-all shadow-sm"
          title="결함 분석 시스템"
        >
          <ExternalLink className="h-4 w-4" />
          결함분석시스템
        </a>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleRightSidebar}
          title="Toggle Model Selector"
        >
          <PanelRight className="h-5 w-5" />
        </Button>

        {isAdmin && (
          <Link href="/admin">
            <Button variant="ghost" size="icon" title="Admin">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        )}

        {session?.user ? (
          <div className="flex items-center gap-2">
            <Avatar
              src={session.user.image}
              alt={session.user.name || "User"}
              fallback={session.user.name?.charAt(0) || "U"}
              size="sm"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
}
