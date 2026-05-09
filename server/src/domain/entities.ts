import { ModerationStatus, PostStatus, PostType, Role } from "../types";

type DbUserRow = {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string;
  is_locked?: number;
};

type DbPostRow = {
  id: number;
  user_id: number;
  type: PostType;
  title: string;
  description: string;
  category_id: number;
  category_name?: string;
  location_id: number;
  location_name?: string;
  event_time: string;
  status: PostStatus;
  moderation_status: ModerationStatus;
  tags_json?: string | null;
  image_url?: string | null;
  image_urls_json?: string | null;
  contact_note?: string | null;
  created_at?: string;
  updated_at?: string;
  full_name?: string;
  avatar_url?: string | null;
};

type DbConversationRow = {
  id: number;
  post_id: number;
  user_one_id: number;
  user_two_id: number;
  post_title?: string;
  user_one_name?: string;
  user_two_name?: string;
  last_message_at?: string | null;
  created_at?: string;
};

type DbMessageRow = {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name?: string;
  text?: string | null;
  image_url?: string | null;
  created_at?: string;
};

type DbMatchRow = {
  id: number;
  lost_post_id: number;
  found_post_id: number;
  lost_title?: string;
  found_title?: string;
  score: number;
  status: "suggested" | "accepted" | "rejected" | "returned";
  detail_json?: string;
  created_at?: string;
};

type DbNotificationRow = {
  id: number;
  user_id?: number;
  type: "new_message" | "matching_result" | "post_status";
  title: string;
  body: string;
  reference_type?: string | null;
  reference_id?: number | null;
  is_read?: number;
  created_at?: string;
};

type DbReportRow = {
  id: number;
  reporter_id: number;
  target_post_id?: number | null;
  target_user_id?: number | null;
  reason: string;
  details: string;
  status: "open" | "resolved";
  resolved_by?: number | null;
  resolved_at?: string | null;
  created_at?: string;
  reporter_name?: string;
  target_user_name?: string | null;
  target_post_title?: string | null;
};

type DbItemRow = {
  id: number;
  name: string;
  description: string;
  category_id: number;
  category_name?: string;
  location_id: number;
  location_name?: string;
  quantity: number;
  status: "stored" | "claimed" | "disposed";
  post_id?: number | null;
  managed_by: number;
  created_at?: string;
  updated_at?: string;
};

type DbCategoryRow = {
  id: number;
  name: string;
  created_at?: string;
};

type DbLocationRow = {
  id: number;
  name: string;
  details?: string | null;
  created_at?: string;
};

type DbUserPostHistoryRow = {
  id: number;
  title: string;
  type: "lost" | "found";
  status: "searching" | "found" | "returned";
  moderation_status: "pending" | "approved" | "rejected";
  created_at: string;
};

type DbUserReturnHistoryRow = {
  match_id: number;
  lost_post_id: number;
  found_post_id: number;
  score: number;
  returned_at: string | null;
};

type DbAnalyticsTotalsRow = {
  total_posts: number;
  total_returns: number;
  total_users: number;
};

function parseJsonObject(input: string | undefined): Record<string, number> {
  if (!input) {
    return {};
  }

  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, number>;
    }
  } catch {
    return {};
  }

  return {};
}

function parseJsonTags(input: string | null | undefined): string[] {
  if (!input) {
    return [];
  }

  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed.map((tag) => String(tag)) : [];
  } catch {
    return [];
  }
}

function parseJsonImageUrls(input: string | null | undefined, fallback?: string | null): string[] {
  if (input) {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        const urls = parsed.map((url) => String(url)).filter(Boolean);
        if (urls.length > 0) {
          return urls;
        }
      }
    } catch {
      // Fallback to legacy single-image column below.
    }
  }

  return fallback ? [fallback] : [];
}

export class User {
  constructor(
    public readonly id: number,
    public readonly email: string,
    public readonly fullName: string,
    public readonly role: Role,
    public readonly phone: string | null = null,
    public readonly avatarUrl: string | null = null,
    public readonly bio: string | null = null,
    public readonly createdAt: string | null = null,
    public readonly isLocked: boolean = false,
    public readonly mustChangePassword: boolean = false
  ) {}

  static fromDb(row: any): User {
    return new User(
      row.id,
      row.email,
      row.full_name,
      row.role,
      row.phone ?? null,
      row.avatar_url ?? null,
      row.bio ?? null,
      row.created_at ?? null,
      Number(row.is_locked ?? 0) === 1,
      Number(row.must_change_password ?? 0) === 1
    );
  }

  toAuthView() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      role: this.role,
      avatarUrl: this.avatarUrl,
      bio: this.bio,
      mustChangePassword: this.mustChangePassword
    };
  }

  toProfileView() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      phone: this.phone,
      role: this.role,
      avatarUrl: this.avatarUrl,
      bio: this.bio,
      createdAt: this.createdAt,
      mustChangePassword: this.mustChangePassword
    };
  }

  toPublicView() {
    return {
      id: this.id,
      fullName: this.fullName,
      avatarUrl: this.avatarUrl,
      bio: this.bio,
      createdAt: this.createdAt
    };
  }

  toAdminView() {
    return {
      id: this.id,
      email: this.email,
      full_name: this.fullName,
      role: this.role,
      is_locked: this.isLocked ? 1 : 0,
      must_change_password: this.mustChangePassword ? 1 : 0,
      created_at: this.createdAt
    };
  }
}

export class AuthSession {
  constructor(
    public readonly token: string,
    public readonly user: User
  ) {}

  toApiView() {
    return {
      token: this.token,
      user: this.user.toAuthView()
    };
  }
}

export class Post {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly type: PostType,
    public readonly title: string,
    public readonly description: string,
    public readonly categoryId: number,
    public readonly locationId: number,
    public readonly eventTime: string,
    public readonly status: PostStatus,
    public readonly moderationStatus: ModerationStatus,
    public readonly tags: string[],
    public readonly imageUrls: string[],
    public readonly imageUrl: string | null,
    public readonly contactNote: string | null,
    public readonly createdAt: string | null,
    public readonly updatedAt: string | null,
    public readonly categoryName?: string,
    public readonly locationName?: string,
    public readonly owner?: {
      id: number;
      fullName: string;
      avatarUrl: string | null;
    }
  ) {}

  static fromDb(row: any): Post {
    return new Post(
      row.id,
      row.user_id,
      row.type,
      row.title,
      row.description,
      row.category_id,
      row.location_id,
      row.event_time,
      row.status,
      row.moderation_status,
      parseJsonTags(row.tags_json),
      parseJsonImageUrls(row.image_urls_json, row.image_url ?? null),
      row.image_url ?? null,
      row.contact_note ?? null,
      row.created_at ?? null,
      row.updated_at ?? null,
      row.category_name,
      row.location_name,
      typeof row.full_name === "string"
        ? {
            id: row.user_id,
            fullName: row.full_name,
            avatarUrl: row.avatar_url ?? null
          }
        : undefined
    );
  }

  toApiView() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      title: this.title,
      description: this.description,
      categoryId: this.categoryId,
      categoryName: this.categoryName,
      locationId: this.locationId,
      locationName: this.locationName,
      eventTime: this.eventTime,
      status: this.status,
      moderationStatus: this.moderationStatus,
      tags: this.tags,
      imageUrls: this.imageUrls,
      imageUrl: this.imageUrl,
      contactNote: this.contactNote,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      owner: this.owner
    };
  }

  toRecommendationView(recommendationScore: number, recommendationReason: string) {
    return {
      ...this.toApiView(),
      recommendationScore,
      recommendationReason
    };
  }
}

export class Conversation {
  constructor(
    public readonly id: number,
    public readonly postId: number,
    public readonly postOwnerId: number | null,
    public readonly userOneId: number,
    public readonly userTwoId: number,
    public readonly postTitle?: string,
    public readonly userOneName?: string,
    public readonly userTwoName?: string,
    public readonly lastMessageAt?: string | null,
    public readonly createdAt?: string
  ) {}

  static fromDb(row: any): Conversation {
    return new Conversation(
      row.id,
      row.post_id,
      row.post_owner_id ?? null,
      row.user_one_id,
      row.user_two_id,
      row.post_title,
      row.user_one_name,
      row.user_two_name,
      row.last_message_at,
      row.created_at
    );
  }

  toApiView() {
    return {
      id: this.id,
      post_id: this.postId,
      post_owner_id: this.postOwnerId,
      user_one_id: this.userOneId,
      user_two_id: this.userTwoId,
      post_title: this.postTitle,
      user_one_name: this.userOneName,
      user_two_name: this.userTwoName,
      last_message_at: this.lastMessageAt,
      created_at: this.createdAt
    };
  }
}

export class Message {
  constructor(
    public readonly id: number,
    public readonly conversationId: number,
    public readonly senderId: number,
    public readonly senderName: string | null,
    public readonly text: string | null,
    public readonly imageUrl: string | null,
    public readonly createdAt: string | null
  ) {}

  static fromDb(row: any): Message {
    return new Message(
      row.id,
      row.conversation_id,
      row.sender_id,
      row.sender_name ?? null,
      row.text ?? null,
      row.image_url ?? null,
      row.created_at ?? null
    );
  }

  toApiView() {
    return {
      id: this.id,
      conversation_id: this.conversationId,
      sender_id: this.senderId,
      sender_name: this.senderName,
      text: this.text,
      image_url: this.imageUrl,
      created_at: this.createdAt
    };
  }
}

export class Match {
  constructor(
    public readonly id: number,
    public readonly lostPostId: number,
    public readonly foundPostId: number,
    public readonly score: number,
    public readonly status: "suggested" | "accepted" | "rejected" | "returned",
    public readonly details: Record<string, number>,
    public readonly createdAt: string | null,
    public readonly lostTitle?: string,
    public readonly foundTitle?: string
  ) {}

  static fromDb(row: any): Match {
    return new Match(
      row.id,
      row.lost_post_id,
      row.found_post_id,
      Number(row.score),
      row.status,
      parseJsonObject(row.detail_json),
      row.created_at ?? null,
      row.lost_title,
      row.found_title
    );
  }

  toApiView() {
    return {
      id: this.id,
      lostPostId: this.lostPostId,
      foundPostId: this.foundPostId,
      lostTitle: this.lostTitle,
      foundTitle: this.foundTitle,
      score: this.score,
      status: this.status,
      details: this.details,
      createdAt: this.createdAt
    };
  }
}

export class Notification {
  constructor(
    public readonly id: number,
    public readonly type: "new_message" | "matching_result" | "post_status",
    public readonly title: string,
    public readonly body: string,
    public readonly isRead: number,
    public readonly createdAt: string | null,
    public readonly userId?: number,
    public readonly referenceType?: string | null,
    public readonly referenceId?: number | null
  ) {}

  static fromDb(row: any): Notification {
    return new Notification(
      row.id,
      row.type,
      row.title,
      row.body,
      Number(row.is_read ?? 0),
      row.created_at ?? null,
      row.user_id,
      row.reference_type,
      row.reference_id
    );
  }

  toApiView() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      body: this.body,
      is_read: this.isRead,
      created_at: this.createdAt,
      user_id: this.userId,
      reference_type: this.referenceType,
      reference_id: this.referenceId
    };
  }
}

export class Report {
  constructor(
    public readonly id: number,
    public readonly reporterId: number,
    public readonly reason: string,
    public readonly details: string,
    public readonly status: "open" | "resolved",
    public readonly targetPostId: number | null,
    public readonly targetUserId: number | null,
    public readonly resolvedBy: number | null,
    public readonly resolvedAt: string | null,
    public readonly createdAt: string | null,
    public readonly reporterName?: string,
    public readonly targetUserName?: string | null,
    public readonly targetPostTitle?: string | null
  ) {}

  static fromDb(row: any): Report {
    return new Report(
      row.id,
      row.reporter_id,
      row.reason,
      row.details,
      row.status,
      row.target_post_id ?? null,
      row.target_user_id ?? null,
      row.resolved_by ?? null,
      row.resolved_at ?? null,
      row.created_at ?? null,
      row.reporter_name,
      row.target_user_name,
      row.target_post_title
    );
  }

  toApiView() {
    return {
      id: this.id,
      reporter_id: this.reporterId,
      target_post_id: this.targetPostId,
      target_user_id: this.targetUserId,
      reason: this.reason,
      details: this.details,
      status: this.status,
      resolved_by: this.resolvedBy,
      resolved_at: this.resolvedAt,
      created_at: this.createdAt,
      reporter_name: this.reporterName,
      target_user_name: this.targetUserName,
      target_post_title: this.targetPostTitle
    };
  }
}

export class Item {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly description: string,
    public readonly categoryId: number,
    public readonly locationId: number,
    public readonly quantity: number,
    public readonly status: "stored" | "claimed" | "disposed",
    public readonly managedBy: number,
    public readonly postId: number | null,
    public readonly createdAt: string | null,
    public readonly updatedAt: string | null,
    public readonly categoryName?: string,
    public readonly locationName?: string
  ) {}

  static fromDb(row: any): Item {
    return new Item(
      row.id,
      row.name,
      row.description,
      row.category_id,
      row.location_id,
      Number(row.quantity),
      row.status,
      row.managed_by,
      row.post_id ?? null,
      row.created_at ?? null,
      row.updated_at ?? null,
      row.category_name,
      row.location_name
    );
  }

  toApiView() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category_id: this.categoryId,
      category_name: this.categoryName,
      location_id: this.locationId,
      location_name: this.locationName,
      quantity: this.quantity,
      status: this.status,
      post_id: this.postId,
      managed_by: this.managedBy,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }
}

export class Category {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly createdAt: string | null
  ) {}

  static fromDb(row: any): Category {
    return new Category(row.id, row.name, row.created_at ?? null);
  }

  toApiView() {
    return {
      id: this.id,
      name: this.name,
      created_at: this.createdAt
    };
  }
}

export class Location {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly details: string | null,
    public readonly createdAt: string | null
  ) {}

  static fromDb(row: any): Location {
    return new Location(row.id, row.name, row.details ?? null, row.created_at ?? null);
  }

  toApiView() {
    return {
      id: this.id,
      name: this.name,
      details: this.details,
      created_at: this.createdAt
    };
  }
}

export class UserPostHistory {
  constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly type: "lost" | "found",
    public readonly status: "searching" | "found" | "returned",
    public readonly moderationStatus: "pending" | "approved" | "rejected",
    public readonly createdAt: string
  ) {}

  static fromDb(row: any): UserPostHistory {
    return new UserPostHistory(
      row.id,
      row.title,
      row.type,
      row.status,
      row.moderation_status,
      row.created_at
    );
  }

  toApiView() {
    return {
      id: this.id,
      title: this.title,
      type: this.type,
      status: this.status,
      moderation_status: this.moderationStatus,
      created_at: this.createdAt
    };
  }
}

export class UserReturnHistory {
  constructor(
    public readonly matchId: number,
    public readonly lostPostId: number,
    public readonly foundPostId: number,
    public readonly score: number,
    public readonly returnedAt: string | null
  ) {}

  static fromDb(row: any): UserReturnHistory {
    return new UserReturnHistory(
      row.match_id,
      row.lost_post_id,
      row.found_post_id,
      Number(row.score),
      row.returned_at
    );
  }

  toApiView() {
    return {
      match_id: this.matchId,
      lost_post_id: this.lostPostId,
      found_post_id: this.foundPostId,
      score: this.score,
      returned_at: this.returnedAt
    };
  }
}

export class AnalyticsTotals {
  constructor(
    public readonly totalPosts: number,
    public readonly totalReturns: number,
    public readonly totalUsers: number
  ) {}

  static fromDb(row: any): AnalyticsTotals {
    return new AnalyticsTotals(
      Number(row.total_posts ?? 0),
      Number(row.total_returns ?? 0),
      Number(row.total_users ?? 0)
    );
  }

  toApiView() {
    return {
      total_posts: this.totalPosts,
      total_returns: this.totalReturns,
      total_users: this.totalUsers
    };
  }
}

export class AnalyticsSummary {
  constructor(
    public readonly totals: AnalyticsTotals,
    public readonly returnSuccessRate: number,
    public readonly lostByLocation: Array<{ location_name: string; total: number }>,
    public readonly lostByHour: Array<{ hour_of_day: number; total: number }>
  ) {}

  toApiView() {
    return {
      totals: this.totals.toApiView(),
      returnSuccessRate: this.returnSuccessRate,
      lostByLocation: this.lostByLocation,
      lostByHour: this.lostByHour
    };
  }
}
