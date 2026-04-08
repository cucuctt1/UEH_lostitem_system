import { useState } from "react";
import { Link } from "react-router-dom";
import { PostItem } from "../types";
import { useAuthStore } from "../store/authStore";
import { useAppStore } from "../store/appStore";
import { addBookmarkApi, removeBookmarkApi } from "../services/api/bookmarkApi";
import { PostMediaGallery } from "./PostMediaGallery";

interface PostCardProps {
  post: PostItem;
  showSocialActions?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function relativeTime(dateValue: string): string {
  const time = new Date(dateValue).getTime();
  if (!Number.isFinite(time)) {
    return "just now";
  }

  const diffSeconds = Math.max(1, Math.floor((Date.now() - time) / 1000));
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return new Date(dateValue).toLocaleDateString();
}

export function PostCard({ post, showSocialActions = true }: PostCardProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const bookmarkedPostIds = useAppStore((state) => state.bookmarkedPostIds);
  const setBookmarkedPostIds = useAppStore((state) => state.setBookmarkedPostIds);
  const ownerName = post.owner?.fullName ?? "Community Member";
  const commentCount = 2 + ((post.id * 11) % 28);
  const shareCount = 1 + ((post.id * 7) % 14);
  const bookmarkBaseCount = 1 + ((post.id * 5) % 20);
  const isBookmarked = bookmarkedPostIds.includes(post.id);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  async function handleToggleBookmark() {
    if (bookmarkLoading) {
      return;
    }

    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmarkApi(post.id);
        setBookmarkedPostIds(bookmarkedPostIds.filter((id) => id !== post.id));
      } else {
        await addBookmarkApi(post.id);
        setBookmarkedPostIds(Array.from(new Set([...bookmarkedPostIds, post.id])));
      }
    } finally {
      setBookmarkLoading(false);
    }
  }

  async function handleSharePost(): Promise<void> {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      alert("Post link copied to clipboard.");
    } catch {
      window.prompt("Copy this post link:", postUrl);
    }
  }

  return (
    <article className={`post-card social-post ${post.recommendationScore ? "recommended-post" : ""}`}>
      <div className="post-header">
        <div className="post-author">
          <div className="avatar-badge">{getInitials(ownerName)}</div>
          <div>
            <p className="owner-name">{ownerName}</p>
            <p className="post-time">
              {relativeTime(post.createdAt)} • {post.locationName ?? "Unknown location"}
            </p>
          </div>
        </div>

        <div className="post-top">
          <span className={`chip chip-${post.type}`}>{post.type.toUpperCase()}</span>
          <span className="chip">{post.status}</span>
          <span className={`chip moderation-${post.moderationStatus}`}>{post.moderationStatus}</span>
        </div>
      </div>

      {post.recommendationReason && (
        <p className="recommendation-pill">
          For you • {post.recommendationReason}
          {typeof post.recommendationScore === "number" && (
            <span className="recommend-score"> {post.recommendationScore.toFixed(2)}</span>
          )}
        </p>
      )}

      <h3 className="post-title">
        <Link className="post-title-link" to={`/posts/${post.id}`}>
          {post.title}
        </Link>
      </h3>
      <p className="post-copy">{post.description}</p>

      <PostMediaGallery post={post} />

      <div className="post-meta post-meta-line">
        <span>{post.categoryName ?? `Category #${post.categoryId}`}</span>
        <span>{new Date(post.eventTime).toLocaleString()}</span>
      </div>

      <div className="post-tags">
        {post.tags.map((tag) => (
          <span key={tag} className="tag-pill">
            #{tag}
          </span>
        ))}
      </div>

      {showSocialActions && (
        <div className="social-actions">
          <button
            className="social-btn social-icon-btn"
            type="button"
            onClick={handleToggleBookmark}
            disabled={bookmarkLoading}
            data-tooltip={isBookmarked ? "Remove bookmark" : "Save bookmark"}
            title={isBookmarked ? "Remove bookmark" : "Save bookmark"}
          >
            <span className="action-icon" aria-hidden="true">
              🔖
            </span>
            <span className="action-count">{bookmarkBaseCount + (isBookmarked ? 1 : 0)}</span>
          </button>

          <Link
            className="social-btn social-icon-btn"
            to={`/posts/${post.id}`}
            data-tooltip="Open comments"
            title="Open comments"
          >
            <span className="action-icon" aria-hidden="true">
              💬
            </span>
            <span className="action-count">{commentCount}</span>
          </Link>

          <button
            className="social-btn social-icon-btn"
            type="button"
            onClick={() => void handleSharePost()}
            data-tooltip="Share post"
            title="Share post"
          >
            <span className="action-icon" aria-hidden="true">
              ↗
            </span>
            <span className="action-count">{shareCount}</span>
          </button>

          {currentUserId !== post.userId && (
            <Link
              className="social-btn social-icon-btn action-link"
              to={`/chat?postId=${post.id}&receiverId=${post.userId}`}
              data-tooltip="Message owner"
              title="Message owner"
            >
              <span className="action-icon" aria-hidden="true">
                ✉
              </span>
              <span className="action-count">1</span>
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
