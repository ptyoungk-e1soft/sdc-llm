export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM";

export interface Message {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface Chat {
  id: string;
  title: string;
  userId: string;
  modelName: string;
  groupId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

export interface ChatGroup {
  id: string;
  name: string;
  userId: string;
  parentId?: string | null;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
  chats?: { id: string }[];
  children?: ChatGroup[];
}

export interface ChatCreateInput {
  title?: string;
  modelName?: string;
  groupId?: string;
}

export interface MessageCreateInput {
  chatId: string;
  role: MessageRole;
  content: string;
}
