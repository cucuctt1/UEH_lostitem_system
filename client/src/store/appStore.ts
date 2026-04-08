import { create } from "zustand";
import { MatchItem, NotificationItem, PostItem } from "../types";

interface AppState {
  posts: PostItem[];
  selectedPost: PostItem | null;
  notifications: NotificationItem[];
  matches: MatchItem[];
  bookmarkedPostIds: number[];
  setPosts: (posts: PostItem[]) => void;
  setSelectedPost: (post: PostItem | null) => void;
  setNotifications: (items: NotificationItem[]) => void;
  setMatches: (items: MatchItem[]) => void;
  setBookmarkedPostIds: (postIds: number[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  posts: [],
  selectedPost: null,
  notifications: [],
  matches: [],
  bookmarkedPostIds: [],
  setPosts: (posts) => set({ posts }),
  setSelectedPost: (selectedPost) => set({ selectedPost }),
  setNotifications: (notifications) => set({ notifications }),
  setMatches: (matches) => set({ matches }),
  setBookmarkedPostIds: (bookmarkedPostIds) => set({ bookmarkedPostIds })
}));
