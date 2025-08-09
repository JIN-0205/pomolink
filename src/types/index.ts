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
  mainPlannerId?: string | null;
};

export type RoomParticipant = {
  id: string;
  userId: string;
  roomId: string;
  role: "PLANNER" | "PERFORMER";
  joinedAt: string;
};

export type TaskProposal = {
  id: string;
  roomId: string;
  proposerId: string;
  title: string;
  description: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  estimatedPomos?: number | null;
  completedPomos: number;
  workDuration?: number | null;
  breakDuration?: number | null;
  dueDate: string | null;
  roomId: string;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  userId: string;
  taskId: string;
  startTime: string;
  endTime: string | null;
  completed: boolean;
  recordingUrl?: string | null;
  recordingDuration?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UploadType = {
  id: string;
  sessionId?: string | null;
  userId: string;
  fileUrl: string;
  description?: string | null;
  createdAt: string;
};

export type Invitation = {
  id: string;
  createdAt: string;
  expiresAt: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  role: "PLANNER" | "PERFORMER";
  roomId: string;
  senderId: string;
  receiverId?: string | null;
  email?: string | null;
  method: "LINK" | "EMAIL";
};

export type Subscription = {
  id: string;
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  stripeCurrentPeriodEnd?: string | null;
  planType: "FREE" | "BASIC" | "PRO";
  maxDailyRecordings: number;
  maxParticipants: number;
  recordingRetentionDays: number;
  maxRoomMembers: number;
  historyRetentionMonths?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type RoomWithParticipantCount = Room & {
  participantCount: number;
  userRole: "PLANNER" | "PERFORMER";
};

export type RoomWithParticipants = Room & {
  participants: (RoomParticipant & {
    user: User;
  })[];
  mainPlanner?: User | null;
};

export type TaskWithRoom = Task & {
  room: Room;
};

export type InvitationWithDetails = Invitation & {
  room: Room;
  sender: User;
  receiver?: User;
};

export type TaskProposalWithProposer = TaskProposal & {
  proposer: User;
};

export type RoomWithTaskProposals = Room & {
  taskProposals: TaskProposalWithProposer[];
};

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

export interface ExtractedDocAIData {
  fullText: string;
}

export interface QuizItem {
  question: string;
  options: string[];
  answer: string;
}

export interface GeminiProcessedData extends ExtractedDocAIData {
  summary: string;
  quiz?: QuizItem[];
  quizError?: string;
  geminiError?: string;
}
export interface ErrorResponse {
  message: string;
}

export type PublicStats = {
  totalCompletedPomodoros: number;
  totalRooms: number;
  totalUsers: number;
};

export type DashboardStats = {
  totalPomodoros: number;
  completedTasks: number;
  activeRooms: number;
  weeklyProgress: number;
  todayPomodoros: number;
  streak: number;
};
