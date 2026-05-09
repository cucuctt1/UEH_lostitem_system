export type UserRole = "user" | "admin";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  mustChangePassword: boolean;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
}

export interface PublicProfileItem {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt?: string | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface PostItem {
  id: number;
  userId: number;
  type: "lost" | "found";
  title: string;
  description: string;
  categoryId: number;
  categoryName?: string;
  locationId: number;
  locationName?: string;
  eventTime: string;
  status: "searching" | "found" | "returned";
  moderationStatus: "pending" | "approved" | "rejected";
  tags: string[];
  imageUrls?: string[];
  imageUrl?: string | null;
  contactNote?: string | null;
  createdAt: string;
  updatedAt: string;
  recommendationScore?: number;
  recommendationReason?: string;
  owner?: {
    id: number;
    fullName: string;
    avatarUrl?: string | null;
  };
}

export interface MatchItem {
  id: number;
  lostPostId: number;
  foundPostId: number;
  lostTitle: string;
  foundTitle: string;
  score: number;
  status: "suggested" | "accepted" | "rejected" | "returned";
  details: Record<string, number>;
  createdAt: string;
}

export interface Conversation {
  id: number;
  post_id: number;
  post_owner_id?: number | null;
  post_title: string;
  user_one_id: number;
  user_two_id: number;
  user_one_name: string;
  user_two_name: string;
  last_message_at?: string | null;
  created_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  text?: string | null;
  image_url?: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  type: "new_message" | "matching_result" | "post_status";
  title: string;
  body: string;
  is_read: number;
  created_at: string;
  user_id?: number;
  reference_type?: string | null;
  reference_id?: number | null;
}

export interface Category {
  id: number;
  name: string;
}

export interface Location {
  id: number;
  name: string;
  details?: string;
}

export interface TagRecommendation {
  id: number;
  tag: string;
  name: string;
  useCount: number;
  isFrequent: boolean;
  isPrebuilt: boolean;
}

export interface BookmarkItem {
  id: number;
  postId: number;
  createdAt: string;
}

export interface PostCommentItem {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: string;
  author: {
    fullName: string;
    avatarUrl?: string | null;
  };
}

export interface UserPostHistoryItem {
  id: number;
  title: string;
  type: "lost" | "found";
  status: "searching" | "found" | "returned";
  moderation_status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface UserReturnHistoryItem {
  match_id: number;
  lost_post_id: number;
  found_post_id: number;
  score: number;
  returned_at: string | null;
}

export interface MyHistoryItem {
  posts: UserPostHistoryItem[];
  returns: UserReturnHistoryItem[];
}
