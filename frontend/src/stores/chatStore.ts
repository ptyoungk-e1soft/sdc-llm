import { create } from "zustand";
import { Chat, ChatGroup } from "@/types/chat";

interface ChatStore {
  chats: Chat[];
  groups: ChatGroup[];
  currentChatId: string | null;
  isLoading: boolean;
  error: string | null;
  setChats: (chats: Chat[]) => void;
  setGroups: (groups: ChatGroup[]) => void;
  setCurrentChatId: (id: string | null) => void;
  addChat: (chat: Chat) => void;
  removeChat: (id: string) => void;
  updateChat: (id: string, updates: Partial<Chat>) => void;
  addGroup: (group: ChatGroup) => void;
  removeGroup: (id: string) => void;
  updateGroup: (id: string, updates: Partial<ChatGroup>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchChats: () => Promise<void>;
  fetchGroups: () => Promise<void>;
  createChat: (modelName?: string, groupId?: string) => Promise<Chat | null>;
  deleteChat: (id: string) => Promise<void>;
  createGroup: (name: string, color?: string, parentId?: string) => Promise<ChatGroup | null>;
  deleteGroup: (id: string) => Promise<void>;
  moveChatToGroup: (chatId: string, groupId: string | null) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  groups: [],
  currentChatId: null,
  isLoading: false,
  error: null,
  setChats: (chats) => set({ chats }),
  setGroups: (groups) => set({ groups }),
  setCurrentChatId: (id) => set({ currentChatId: id }),
  addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),
  removeChat: (id) =>
    set((state) => ({ chats: state.chats.filter((c) => c.id !== id) })),
  updateChat: (id, updates) =>
    set((state) => ({
      chats: state.chats.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  addGroup: (group) => set((state) => ({ groups: [...state.groups, group] })),
  removeGroup: (id) =>
    set((state) => ({ groups: state.groups.filter((g) => g.id !== id) })),
  updateGroup: (id, updates) =>
    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  fetchChats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/chats");
      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }
      const data = await response.json();
      set({ chats: data.chats, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },
  fetchGroups: async () => {
    try {
      const response = await fetch("/api/groups");
      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }
      const groups = await response.json();
      set({ groups });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  createChat: async (modelName = "llama3", groupId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName, groupId }),
      });
      if (!response.ok) {
        throw new Error("Failed to create chat");
      }
      const chat = await response.json();
      get().addChat(chat);
      set({ isLoading: false, currentChatId: chat.id });
      return chat;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
      return null;
    }
  },
  deleteChat: async (id) => {
    try {
      const response = await fetch(`/api/chats/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }
      get().removeChat(id);
      if (get().currentChatId === id) {
        set({ currentChatId: null });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  createGroup: async (name, color, parentId) => {
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, parentId }),
      });
      if (!response.ok) {
        throw new Error("Failed to create group");
      }
      const group = await response.json();
      // Refresh groups to get updated hierarchy
      await get().fetchGroups();
      return group;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  },
  deleteGroup: async (id) => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete group");
      }
      // Refresh groups and chats to get updated state
      await Promise.all([get().fetchGroups(), get().fetchChats()]);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  moveChatToGroup: async (chatId, groupId) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      if (!response.ok) {
        throw new Error("Failed to move chat");
      }
      get().updateChat(chatId, { groupId });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
}));
