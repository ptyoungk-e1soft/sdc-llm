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
  X,
  Check,
  Pencil,
  MoreHorizontal,
  Mail,
  Copy,
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
    updateChat,
  } = useChatStore();
  const { selectedModel } = useModelStore();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [creatingGroupParentId, setCreatingGroupParentId] = useState<string | null | undefined>(undefined);
  const [newGroupName, setNewGroupName] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    chatId: string;
    x: number;
    y: number;
  } | null>(null);

  // 채팅 제목 편집 상태
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // 채팅 액션 메뉴 상태
  const [actionMenu, setActionMenu] = useState<{
    chatId: string;
    chatTitle: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    fetchChats();
    fetchGroups();
  }, [fetchChats, fetchGroups]);

  // Close context menu and action menu on click outside
  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setActionMenu(null);
    };
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

  const handleCreateGroup = async (parentId?: string | null) => {
    if (newGroupName.trim()) {
      await createGroup(newGroupName.trim(), undefined, parentId || undefined);
      setNewGroupName("");
      setCreatingGroupParentId(undefined);
      // Expand parent group to show new child
      if (parentId) {
        setExpandedGroups((prev) => new Set([...prev, parentId]));
      }
    }
  };

  const handleDeleteGroup = async (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();

    // 해당 그룹의 채팅 수 확인
    const groupChats = chats.filter((c) => c.groupId === groupId);

    // 하위 그룹 확인
    const group = groups.find((g) => g.id === groupId);
    const hasChildren = group?.children && group.children.length > 0;

    if (groupChats.length > 0 || hasChildren) {
      const message = hasChildren
        ? `이 그룹에는 ${groupChats.length}개의 채팅과 하위 그룹이 있습니다. 정말 삭제하시겠습니까?`
        : `이 그룹에는 ${groupChats.length}개의 채팅이 있습니다. 정말 삭제하시겠습니까?`;

      if (!confirm(message)) {
        return;
      }
    }

    await deleteGroup(groupId);
  };

  const handleAddSubGroup = (e: React.MouseEvent, parentId: string) => {
    e.stopPropagation();
    setCreatingGroupParentId(parentId);
    setExpandedGroups((prev) => new Set([...prev, parentId]));
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

  // 채팅 제목 편집 시작
  const handleStartEditTitle = (e: React.MouseEvent, chat: { id: string; title: string }) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  // 채팅 제목 저장
  const handleSaveTitle = async () => {
    if (editingChatId && editingTitle.trim()) {
      try {
        // API 호출하여 DB에 저장
        const response = await fetch(`/api/chats/${editingChatId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: editingTitle.trim() }),
        });

        if (response.ok) {
          // 로컬 상태 업데이트
          updateChat(editingChatId, { title: editingTitle.trim() });
        } else {
          console.error("Failed to update chat title");
        }
      } catch (error) {
        console.error("Error updating chat title:", error);
      }
    }
    setEditingChatId(null);
    setEditingTitle("");
  };

  // 채팅 제목 편집 취소
  const handleCancelEditTitle = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  // 액션 메뉴 열기
  const handleOpenActionMenu = (e: React.MouseEvent, chat: { id: string; title: string }) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setActionMenu({
      chatId: chat.id,
      chatTitle: chat.title,
      x: rect.left,
      y: rect.bottom + 4,
    });
  };

  // 채팅 복제
  const handleDuplicateChat = async () => {
    if (!actionMenu) return;

    try {
      // 원본 채팅의 메시지 가져오기
      const response = await fetch(`/api/chats/${actionMenu.chatId}`);
      if (!response.ok) throw new Error("Failed to fetch chat");

      const originalChat = await response.json();

      // 새 채팅 생성
      const newChat = await createChat(selectedModel);
      if (!newChat) throw new Error("Failed to create chat");

      // 제목 업데이트 (복사본 표시)
      await fetch(`/api/chats/${newChat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `${actionMenu.chatTitle} (복사본)` }),
      });

      // 메시지 복제
      if (originalChat.messages && originalChat.messages.length > 0) {
        await fetch(`/api/chats/${newChat.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: originalChat.messages.map((msg: { role: string; content: string }) => ({
              role: msg.role,
              content: msg.content,
            })),
          }),
        });
      }

      // 채팅 목록 새로고침
      await fetchChats();
      updateChat(newChat.id, { title: `${actionMenu.chatTitle} (복사본)` });

    } catch (error) {
      console.error("Failed to duplicate chat:", error);
    }

    setActionMenu(null);
  };

  // 메일 전송
  const handleSendEmail = async () => {
    if (!actionMenu) return;

    try {
      // 채팅 메시지 가져오기
      const response = await fetch(`/api/chats/${actionMenu.chatId}`);
      if (!response.ok) throw new Error("Failed to fetch chat");

      const chat = await response.json();

      // 메시지 내용을 텍스트로 변환
      const messageContent = chat.messages
        ?.map((msg: { role: string; content: string }) =>
          `[${msg.role === "user" ? "사용자" : "AI"}]\n${msg.content}`
        )
        .join("\n\n---\n\n") || "";

      // mailto 링크로 이메일 클라이언트 열기
      const subject = encodeURIComponent(`[채팅 기록] ${actionMenu.chatTitle}`);
      const body = encodeURIComponent(messageContent);
      window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");

    } catch (error) {
      console.error("Failed to prepare email:", error);
    }

    setActionMenu(null);
  };

  // 액션 메뉴에서 수정 선택
  const handleActionEdit = () => {
    if (!actionMenu) return;
    setEditingChatId(actionMenu.chatId);
    setEditingTitle(actionMenu.chatTitle);
    setActionMenu(null);
  };

  // 액션 메뉴에서 삭제 선택
  const handleActionDelete = async () => {
    if (!actionMenu) return;

    if (confirm("이 채팅을 삭제하시겠습니까?")) {
      await deleteChat(actionMenu.chatId);
      if (currentChatId === actionMenu.chatId) {
        router.push("/");
      }
    }

    setActionMenu(null);
  };

  const handleMoveToGroup = async (groupId: string | null) => {
    if (contextMenu) {
      await moveChatToGroup(contextMenu.chatId, groupId);
      setContextMenu(null);
    }
  };

  // Get root groups (groups without parent)
  const rootGroups = groups.filter((g) => !g.parentId);

  // Separate chats by group
  const ungroupedChats = chats.filter((c) => !c.groupId);
  const getGroupChats = (groupId: string) =>
    chats.filter((c) => c.groupId === groupId);

  // Flatten all groups for context menu
  const flattenGroups = (groupList: ChatGroup[], depth = 0): { group: ChatGroup; depth: number }[] => {
    const result: { group: ChatGroup; depth: number }[] = [];
    for (const group of groupList) {
      result.push({ group, depth });
      if (group.children && group.children.length > 0) {
        result.push(...flattenGroups(group.children, depth + 1));
      }
    }
    return result;
  };

  const allFlatGroups = flattenGroups(rootGroups);

  const renderChatItem = (chat: { id: string; title: string }, indent = 0) => {
    const isEditing = editingChatId === chat.id;

    return (
      <div
        key={chat.id}
        onClick={() => !isEditing && handleSelectChat(chat.id)}
        onContextMenu={(e) => handleContextMenu(e, chat.id)}
        className={cn(
          "group flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors",
          currentChatId === chat.id ? "bg-gray-200" : "hover:bg-gray-100"
        )}
        style={{ marginLeft: indent * 12 }}
      >
        <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" />
        {isEditing ? (
          <div className="flex-1 flex items-center gap-1">
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") handleCancelEditTitle();
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-sm bg-white border border-gray-300 rounded px-2 py-0.5 outline-none focus:border-blue-500"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                handleSaveTitle();
              }}
            >
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                handleCancelEditTitle();
              }}
            >
              <X className="h-3 w-3 text-gray-500" />
            </Button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-sm text-gray-700 truncate">
              {truncateText(chat.title, 20)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleOpenActionMenu(e, chat)}
              title="더보기"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-500 hover:text-gray-700" />
            </Button>
          </>
        )}
      </div>
    );
  };

  const renderGroupInput = (parentId: string | null) => (
    <div className="flex items-center gap-1 mb-1 p-2 bg-gray-50 rounded-md">
      <Folder className="h-4 w-4 text-gray-500 flex-shrink-0" />
      <input
        type="text"
        value={newGroupName}
        onChange={(e) => setNewGroupName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCreateGroup(parentId);
          if (e.key === "Escape") {
            setCreatingGroupParentId(undefined);
            setNewGroupName("");
          }
        }}
        placeholder={parentId ? "하위 그룹 이름..." : "그룹 이름..."}
        className="flex-1 text-sm bg-transparent outline-none"
        autoFocus
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => handleCreateGroup(parentId)}
      >
        <Check className="h-3 w-3 text-green-600" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => {
          setCreatingGroupParentId(undefined);
          setNewGroupName("");
        }}
      >
        <X className="h-3 w-3 text-gray-500" />
      </Button>
    </div>
  );

  const renderGroup = (group: ChatGroup, depth = 0): React.ReactNode => {
    const groupChats = getGroupChats(group.id);
    const isExpanded = expandedGroups.has(group.id);
    const hasChildren = (group.children && group.children.length > 0) || groupChats.length > 0;

    return (
      <div key={group.id} className="mb-1">
        <div
          onClick={() => toggleGroup(group.id)}
          className="group flex items-center gap-1 rounded-md px-2 py-2 cursor-pointer hover:bg-gray-100"
          style={{ paddingLeft: 8 + depth * 12 }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
            )
          ) : (
            <span className="w-4" />
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
          <span className="text-xs text-gray-400">
            {groupChats.length + (group.children?.length || 0)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => handleAddSubGroup(e, group.id)}
            title="하위 그룹 추가"
          >
            <FolderPlus className="h-3 w-3 text-gray-500 hover:text-blue-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => handleDeleteGroup(e, group.id)}
          >
            <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-500" />
          </Button>
        </div>
        {isExpanded && (
          <div className="ml-2 pl-2 border-l border-gray-200" style={{ marginLeft: 8 + depth * 12 }}>
            {/* Sub-group creation input */}
            {creatingGroupParentId === group.id && renderGroupInput(group.id)}

            {/* Child groups */}
            {group.children?.map((child) => renderGroup(child, depth + 1))}

            {/* Group chats */}
            {groupChats.map((chat) => renderChatItem(chat, 0))}
          </div>
        )}
      </div>
    );
  };

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
          onClick={() => setCreatingGroupParentId(null)}
          className="w-full justify-start gap-2"
          disabled={isLoading}
        >
          <FolderPlus className="h-4 w-4" />
          New Group
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* Create root group input */}
        {creatingGroupParentId === null && renderGroupInput(null)}

        {/* Groups (hierarchical) */}
        {rootGroups.map((group) => renderGroup(group))}

        {/* Ungrouped chats */}
        {ungroupedChats.length > 0 && (
          <div className="mt-2">
            {rootGroups.length > 0 && (
              <div className="text-xs text-gray-400 px-2 py-1 uppercase tracking-wider">
                Ungrouped
              </div>
            )}
            <div className="space-y-1">{ungroupedChats.map((chat) => renderChatItem(chat))}</div>
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
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 max-h-64 overflow-y-auto"
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
          {allFlatGroups.map(({ group, depth }) => (
            <button
              key={group.id}
              onClick={() => handleMoveToGroup(group.id)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              style={{ paddingLeft: 12 + depth * 12 }}
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

      {/* Action Menu (더보기 메뉴) */}
      {actionMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 min-w-[140px]"
          style={{ left: actionMenu.x, top: actionMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleActionEdit}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Pencil className="h-4 w-4 text-gray-500" />
            수정
          </button>
          <button
            onClick={handleDuplicateChat}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Copy className="h-4 w-4 text-gray-500" />
            복제
          </button>
          <button
            onClick={handleSendEmail}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Mail className="h-4 w-4 text-gray-500" />
            메일전송
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={handleActionDelete}
            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
