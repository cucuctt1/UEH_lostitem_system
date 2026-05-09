import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PostItem } from "../types";
import { useAuthStore } from "../store/authStore";
import { useAppStore } from "../store/appStore";
import { addBookmarkApi, removeBookmarkApi } from "../services/api/bookmarkApi";
import { listPostCommentsApi } from "../services/api/postApi";
import { PostMediaGallery } from "./PostMediaGallery";
import { AppIcon } from "./AppIcon";

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
    return "vừa xong";
  }

  const diffSeconds = Math.max(1, Math.floor((Date.now() - time) / 1000));
  if (diffSeconds < 60) {
    return `${diffSeconds} giây trước`;
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  }
  return new Date(dateValue).toLocaleDateString("vi-VN");
}

export function PostCard({ post, showSocialActions = true }: PostCardProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const bookmarkedPostIds = useAppStore((state) => state.bookmarkedPostIds);
  const setBookmarkedPostIds = useAppStore((state) => state.setBookmarkedPostIds);
  const ownerName = post.owner?.fullName ?? "Thành viên cộng đồng";
  const typeLabel = post.type === "lost" ? "THẤT LẠC" : "NHẶT ĐƯỢC";
  const statusLabel =
    post.status === "searching"
      ? "Đang tìm"
      : post.status === "found"
        ? "Đã tìm thấy"
        : "Đã trả lại";
  const moderationLabel =
    post.moderationStatus === "pending"
      ? "Chờ duyệt"
      : post.moderationStatus === "approved"
        ? "Đã duyệt"
        : "Từ chối";
  const isBookmarked = bookmarkedPostIds.includes(post.id);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [shareNotice, setShareNotice] = useState<"idle" | "done">("idle");
  const eventDateTimeLabel = new Date(post.eventTime).toLocaleString("vi-VN");

  useEffect(() => {
    let active = true;

    void listPostCommentsApi(post.id)
      .then((rows) => {
        if (!active) {
          return;
        }
        setCommentCount(rows.length);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setCommentCount(null);
      });

    return () => {
      active = false;
    };
  }, [post.id]);

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
    const sharePayload = {
      title: post.title,
      text: post.description.slice(0, 140),
      url: postUrl
    };

    try {
      if (typeof navigator.share === "function") {
        await navigator.share(sharePayload);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
      } else {
        window.prompt("Sao chép liên kết bài đăng:", postUrl);
      }
      setShareNotice("done");
      window.setTimeout(() => setShareNotice("idle"), 1800);
    } catch (error: any) {
      if (error?.name === "AbortError") {
        return;
      }

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(postUrl);
          setShareNotice("done");
          window.setTimeout(() => setShareNotice("idle"), 1800);
          return;
        }
      } catch {
        // Ignore clipboard fallback errors and show prompt below.
      }

      window.prompt("Sao chép liên kết bài đăng:", postUrl);
    }
  }

  return (
    <article className={`post-card social-post ${post.recommendationScore ? "recommended-post" : ""}`} onClick={(e) => {// click to go to post detail, but ignore clicks on links and buttons inside the card
      const target = e.target as HTMLElement;
      window.location.href = `/posts/${post.id}`;
    }}>
      <div className="post-header">
        <div className="post-author">
          <div className="avatar-badge">{getInitials(ownerName)}</div>
          <div>
            <p className="owner-name">{ownerName}</p>
            <p className="post-time">
              {relativeTime(post.createdAt)} • {post.locationName ?? "Chưa rõ vị trí"}
            </p>
          </div>
        </div>

        <div className="post-top">
          <span className={`chip chip-${post.type}`}>{typeLabel}</span>
          <span className="chip">{statusLabel}</span>
          <span className={`chip moderation-${post.moderationStatus}`}>{moderationLabel}</span>
        </div>
      </div>

      {post.recommendationReason && (
        <p className="recommendation-pill">
          Gợi ý cho bạn • {post.recommendationReason}
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

      <div className="post-meta-line post-location-line">
        <span className="icon-text">
          <AppIcon name="map-pin" size={15} />
          {post.locationName ?? "Chưa rõ vị trí"}
        </span>
        <span className="post-category-pill icon-text">
          <AppIcon name="tag" size={14} />
          {post.categoryName ?? `Category #${post.categoryId}`}
        </span>
      </div>

      <PostMediaGallery post={post} />

      <div className="post-meta post-meta-line">
        <time dateTime={post.eventTime}>{eventDateTimeLabel}</time>
      </div>

      {post.tags.length > 0 ? (
        <div className="post-tags">
          {post.tags.map((tag) => (
            <span key={tag} className="tag-pill">
              #{tag}
            </span>
          ))}
        </div>
      ) : (
        <p className="hint-text">Bài đăng chưa có thẻ phân loại.</p>
      )}

      {showSocialActions && (
        <>
          <div className="social-actions">
            <button
              className="social-btn"
              type="button"
              onClick={handleToggleBookmark}
              disabled={bookmarkLoading}
              title={isBookmarked ? "Bỏ lưu bài đăng" : "Lưu bài đăng"}
            >
              <AppIcon name="bookmark" size={15} />
              {bookmarkLoading ? "Đang xử lý..." : isBookmarked ? "Đã lưu" : "Lưu"}
            </button>

            <Link className="social-btn" to={`/posts/${post.id}#comments`} title="Mở phần bình luận">
              <AppIcon name="message-circle" size={15} />
              Bình luận{typeof commentCount === "number" ? ` ${commentCount}` : ""}
            </Link>

            <button className="social-btn" type="button" onClick={() => void handleSharePost()} title="Chia sẻ bài đăng">
              <AppIcon name="share" size={15} />
              {shareNotice === "done" ? "Đã chia sẻ" : "Chia sẻ"}
            </button>

            {currentUserId && currentUserId !== post.userId && (
              <Link className="social-btn action-link" to={`/chat?postId=${post.id}&receiverId=${post.userId}`} title="Nhắn tin chủ bài đăng">
                <AppIcon name="mail" size={15} />
                Nhắn tin
              </Link>
            )}
          </div>
        </>
      )}

      <div className="post-footer-cta">
        {currentUserId !== post.userId ? (
          <Link className="post-contact-btn" to={`/chat?postId=${post.id}&receiverId=${post.userId}`}>
            {post.type === "lost" ? "Tôi đã nhặt được vật phẩm này" : "Tôi nghĩ đây là vật của tôi"}
          </Link>
        ) : (
          <Link className="post-contact-btn" to={`/posts/${post.id}`}>
            Xem và cập nhật bài đăng
          </Link>
        )}
      </div>
    </article>
  );
}
