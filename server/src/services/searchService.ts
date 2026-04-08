import { PostListFilters, listPosts } from "../models/postModel";
import { sanitizePost } from "./postService";

export async function searchPosts(filters: PostListFilters, _requesterId?: number, requesterRole?: string) {
  const rows = await listPosts({
    ...filters,
    onlyApproved: requesterRole === "admin" ? false : true
  });

  return rows
    .filter((row) => requesterRole === "admin" || row.moderation_status === "approved")
    .map(sanitizePost);
}
