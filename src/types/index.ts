// src/types/index.ts

/**
 * Prismaの型を基にしたフロントエンド用型定義
 * API応答で使用される型（Date→string変換済み）
 */

// 基本モデル型
export type User = {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  emailNotifications: boolean;
};

export type Room = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
};

export type Participant = {
  id: string;
  userId: string;
  roomId: string;
  role: "PLANNER" | "PERFORMER";
  joinedAt: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  estimatedPomos: number;
  completedPomos: number;
  dueDate: string | null;
  roomId: string;
  createdAt: string;
  updatedAt: string;
};

export type Invitation = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  role: "PLANNER" | "PERFORMER";
  email: string | null;
  roomId: string;
  senderId: string;
  receiverId: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PomodoroSession = {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  isCompleted: boolean;
  taskId: string | null;
  userId: string;
  createdAt: string;
};

// API応答の拡張型
export type RoomWithParticipantCount = Room & {
  participantCount: number;
  userRole: "PLANNER" | "PERFORMER";
};

export type RoomWithParticipants = Room & {
  participants: (Participant & {
    user: User;
  })[];
};

export type TaskWithRoom = Task & {
  room: Room;
};

export type InvitationWithDetails = Invitation & {
  room: Room;
  sender: User;
  receiver?: User;
};

// API応答型

export type ValidateCodeResponse = {
  valid: boolean;
  room: {
    id: string;
    name: string;
    description: string | null;
    isPrivate: boolean;
    participantCount: number;
  };
};
