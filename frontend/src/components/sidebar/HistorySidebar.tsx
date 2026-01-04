"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MessageSquare,
  Trash2,
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Edit2,
  X,
  Check,
} from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useModelStore } from "@/stores/modelStore";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { truncateText } from "@/lib/utils";
import { ChatGroup } from "@/types/chat";

export function HistorySidebar() {
  const router = useRouter();
  const {
    chats,
    groups,
    currentChatId,
    isLoading,
    fetchChats,
    fetchGroups,
    createChat,
    deleteChat,
    createGroup,
    deleteGroup,
    moveChatToGroup,
    setCurrentChatId,
  } = useChatStore();
  const { selectedModel } = useModelStore();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    chatId: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    fetchChats();
    fetchGroups();
  }, [fetchChats, fetchGroups]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleNewChat = async () => {
    const chat = await createChat(selectedModel);
    if (chat) {
      router.push(`/chat/${chat.id}`);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    router.push(`/chat/${chatId}`);
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    await deleteChat(chatId);
    if (currentChatId === chatId) {
      router.push("/");
    }
  };

  const handleCreateGroup = async () => {
    if (newGroupName.trim()) {
      await createGroup(newGroupName.trim());
      setNewGroupName("");
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    await deleteGroup(groupId);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ chatId, x: e.clientX, y: e.clientY });
  };

  const handleMoveToGroup = async (groupId: string | null) => {
    if (contextMenu) {
      await moveChatToGroup(contextMenu.chatId, groupId);
      setContextMenu(null);
    }
  };

  // Separate chats by group
  const ungroupedChats = chats.filter((c) => !c.groupId);
  const getGroupChats = (groupId: string) =>
    chats.filter((c) => c.groupId === groupId);

  const renderChatItem = (chat: { id: string; title: string }) => (
    <div
      key={chat.id}
      onClick={() => handleSelectChat(chat.id)}
      onContextMenu={(e) => handleContextMenu(e, chat.id)}
      className={cn(
        "group flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors",
        currentChatId === chat.id ? "bg-gray-200" : "hover:bg-gray-100"
      )}
    >
      <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" />
      <span className="flex-1 text-sm text-gray-700 truncate">
        {truncateText(chat.title, 20)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => handleDeleteChat(e, chat.id)}
      >
        <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-500" />
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 space-y-2">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsCreatingGroup(true)}
          className="w-full justify-start gap-2"
          disabled={isLoading}
        >
          <FolderPlus className="h-4 w-4" />
          New Group
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* Create group input */}
        {isCreatingGroup && (
          <div className="flex items-center gap-1 mb-2 p-2 bg-gray-50 rounded-md">
            <Folder className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateGroup();
                if (e.key === "Escape") {
                  setIsCreatingGroup(false);
                  setNewGroupName("");
                }
              }}
              placeholder="Group name..."
              className="flex-1 text-sm bg-transparent outline-none"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCreateGroup}
            >
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setIsCreatingGroup(false);
                setNewGroupName("");
              }}
            >
              <X className="h-3 w-3 text-gray-500" />
            </Button>
          </div>
        )}

        {/* Groups */}
        {groups.map((group) => {
          const groupChats = getGroupChats(group.id);
          const isExpanded = expandedGroups.has(group.id);

          return (
            <div key={group.id} className="mb-1">
              <div
                onClick={() => toggleGroup(group.id)}
                className="group flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer hover:bg-gray-100"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                {isExpanded ? (
                  <FolderOpen
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: group.color || "#6B7280" }}
                  />
                ) : (
                  <Folder
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: group.color || "#6B7280" }}
                  />
                )}
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                  {group.name}
                </span>
                <span className="text-xs text-gray-400">{groupChats.length}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDeleteGroup(e, group.id)}
                >
                  <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-500" />
                </Button>
              </div>
              {isExpanded && groupChats.length > 0 && (
                <div className="ml-4 pl-2 border-l border-gray-200">
                  {groupChats.map(renderChatItem)}
                </div>
              )}
            </div>
          );
        })}

        {/* Ungrouped chats */}
        {ungroupedChats.length > 0 && (
          <div className="mt-2">
            {groups.length > 0 && (
              <div className="text-xs text-gray-400 px-2 py-1 uppercase tracking-wider">
                Ungrouped
              </div>
            )}
            <div className="space-y-1">{ungroupedChats.map(renderChatItem)}</div>
          </div>
        )}

        {chats.length === 0 && groups.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-4">
            No chats yet
          </div>
        )}
      </div>

      {/* Context menu for moving chats to groups */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wider">
            Move to
          </div>
          <button
            onClick={() => handleMoveToGroup(null)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4 text-gray-400" />
            Ungrouped
          </button>
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => handleMoveToGroup(group.id)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Folder
                className="h-4 w-4"
                style={{ color: group.color || "#6B7280" }}
              />
              {group.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
