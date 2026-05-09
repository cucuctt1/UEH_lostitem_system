import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createPostCommentApi, listPostCommentsApi } from "../services/api/postApi";
import { PostCommentItem, PostItem } from "../types";
import { AppIcon } from "./AppIcon";

interface PostViewerOverlayProps {
  post: PostItem;
  images: string[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export function PostViewerOverlay({
  post,
  images,
  initialIndex,
  open,
  onClose
}: PostViewerOverlayProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [comments, setComments] = useState<PostCommentItem[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const totalImages = images.length;

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveIndex(Math.min(Math.max(0, initialIndex), Math.max(0, totalImages - 1)));
    setLoadingComments(true);

    void listPostCommentsApi(post.id)
      .then(setComments)
      .finally(() => setLoadingComments(false));
  }, [open, initialIndex, totalImages, post.id]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev - 1 + totalImages) % totalImages);
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((prev) => (prev + 1) % totalImages);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, totalImages]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const activeImage = useMemo(() => images[activeIndex], [images, activeIndex]);

  async function handleSubmitComment(event: FormEvent) {
    event.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || sendingComment) {
      return;
    }

    setSendingComment(true);
    try {
      await createPostCommentApi(post.id, trimmed);
      setCommentText("");
      const latest = await listPostCommentsApi(post.id);
      setComments(latest);
    } finally {
      setSendingComment(false);
    }
  }

  if (!open || totalImages === 0) {
    return null;
  }

  const overlayElement = (
    <div className="post-viewer-backdrop" onClick={onClose}>
      <div className="post-viewer-shell" onClick={(event) => event.stopPropagation()}>
        <div className="post-viewer-media">
          <button
            type="button"
            className="post-viewer-arrow left"
            onClick={() => setActiveIndex((prev) => (prev - 1 + totalImages) % totalImages)}
            aria-label="Ảnh trước"
          >
            <AppIcon name="chevron-left" size={28} />
          </button>

          <img
            src={activeImage}
            alt={`${post.title} image ${activeIndex + 1}`}
            className="post-viewer-image"
            loading="eager"
            decoding="async"
          />

          <button
            type="button"
            className="post-viewer-arrow right"
            onClick={() => setActiveIndex((prev) => (prev + 1) % totalImages)}
            aria-label="Ảnh tiếp theo"
          >
            <AppIcon name="chevron-right" size={28} />
          </button>

          <div className="post-viewer-index">
            {activeIndex + 1}/{totalImages}
          </div>
        </div>

        <aside className="post-viewer-side">
          <header className="post-viewer-header">
            <h3>{post.title}</h3>
            <button type="button" className="ghost-btn" onClick={onClose}>
              Đóng
            </button>
          </header>

          <p className="post-viewer-desc">{post.description}</p>

          <div className="post-viewer-tags">
            {post.tags.map((tag) => (
              <span key={tag} className="tag-pill">
                #{tag}
              </span>
            ))}
          </div>

          <section className="post-viewer-comments">
            <h4>Bình luận</h4>
            {loadingComments && <p className="hint-text">Đang tải bình luận...</p>}
            {!loadingComments && comments.length === 0 && (
              <p className="hint-text">Chưa có bình luận nào. Hãy là người đầu tiên bình luận.</p>
            )}
            {!loadingComments && comments.length > 0 && (
              <div className="post-viewer-comment-list">
                {comments.map((comment) => (
                  <div key={comment.id} className="post-viewer-comment-item">
                    <strong>{comment.author.fullName}</strong>
                    <p>{comment.content}</p>
                    <small>{new Date(comment.createdAt).toLocaleString("vi-VN")}</small>
                  </div>
                ))}
              </div>
            )}
          </section>

          <form className="stack-form" onSubmit={handleSubmitComment}>
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Nhập nội dung bình luận"
              maxLength={1000}
            />
            <button type="submit" className="primary-btn" disabled={sendingComment}>
              {sendingComment ? "Đang đăng..." : "Đăng bình luận"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );

  return createPortal(overlayElement, document.body);
}
