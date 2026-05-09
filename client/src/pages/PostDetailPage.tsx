import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { HashtagInputOverlay } from "../components/HashtagInputOverlay";
import { PostMediaGallery } from "../components/PostMediaGallery";
import {
  createPostCommentApi,
  deletePostApi,
  getPostApi,
  listPostCommentsApi,
  updatePostApi,
  requestPostBypassApi
} from "../services/api/postApi";
import { createReportApi } from "../services/api/miscApi";
import { PostCommentItem, PostItem } from "../types";
import { useAuthStore } from "../store/authStore";

export function PostDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAuthStore((state) => state.user);

  const [post, setPost] = useState<PostItem | null>(null);
  const [reportReason, setReportReason] = useState<"spam" | "fraud" | "abuse" | "unsafe" | "other">(
    "other"
  );
  const [reportDetails, setReportDetails] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"searching" | "found" | "returned">("searching");
  const [editTags, setEditTags] = useState("");
  const [editContactNote, setEditContactNote] = useState("");
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [bypassImageFile, setBypassImageFile] = useState<File | null>(null);
  const [comments, setComments] = useState<PostCommentItem[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const typeLabel = post?.type === "lost" ? "THẤT LẠC" : "NHẶT ĐƯỢC";
  const statusLabel =
    post?.status === "searching"
      ? "Đang tìm"
      : post?.status === "found"
        ? "Đã tìm thấy"
        : "Đã trả lại";
  const moderationLabel =
    post?.moderationStatus === "pending"
      ? "Chờ duyệt"
      : post?.moderationStatus === "approved"
        ? "Đã duyệt"
        : "Từ chối";

  useEffect(() => {
    if (!id) {
      return;
    }
    void getPostApi(Number(id)).then((result) => {
      setPost(result);
      setEditTitle(result.title);
      setEditDescription(result.description);
      setEditStatus(result.status);
      setEditTags(result.tags.map((tag) => `#${tag}`).join(" "));
      setEditContactNote(result.contactNote || "");
    });
  }, [id]);

  async function loadComments(postId: number): Promise<void> {
    setLoadingComments(true);
    try {
      const rows = await listPostCommentsApi(postId);
      setComments(rows);
    } finally {
      setLoadingComments(false);
    }
  }

  useEffect(() => {
    if (!id) {
      return;
    }

    void loadComments(Number(id));
  }, [id]);

  async function handleReport(event: FormEvent) {
    event.preventDefault();
    if (!post) {
      return;
    }

    await createReportApi({
      targetPostId: post.id,
      reason: reportReason,
      details: reportDetails
    });

    setReportDetails("");
    alert("Đã gửi báo cáo.");
  }

  async function handleOwnerUpdate(event: FormEvent) {
    event.preventDefault();
    if (!post) {
      return;
    }

    const formData = new FormData();
    formData.append("title", editTitle);
    formData.append("description", editDescription);
    formData.append("status", editStatus);
    formData.append("tags", editTags);
    formData.append("contactNote", editContactNote);
    for (const file of editImageFiles) {
      formData.append("images", file);
    }

    await updatePostApi(post.id, formData);
    const refreshed = await getPostApi(post.id);
    setPost(refreshed);
    setEditImageFiles([]);
    alert("Đã cập nhật bài đăng.");
  }

  async function handleOwnerDelete() {
    if (!post) {
      return;
    }

    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa bài đăng này?");
    if (!confirmed) {
      return;
    }

    await deletePostApi(post.id);
    navigate("/");
  }

  async function handleSubmitComment(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!post || sendingComment) {
      return;
    }

    const trimmed = commentText.trim();
    if (!trimmed) {
      return;
    }

    setSendingComment(true);
    try {
      await createPostCommentApi(post.id, trimmed);
      setCommentText("");
      await loadComments(post.id);
    } finally {
      setSendingComment(false);
    }
  }

  if (!post) {
    return (
      <AppShell title="Chi tiết bài đăng">
        <p>Đang tải bài đăng...</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Chi tiết bài đăng">
      <article className="panel post-detail">
        <div className="post-top">
          <span className={`chip chip-${post.type}`}>{typeLabel}</span>
          <span className="chip">{statusLabel}</span>
          <span className={`chip moderation-${post.moderationStatus}`}>{moderationLabel}</span>
        </div>
        <h3>{post.title}</h3>
        <p>{post.description}</p>

        <ul className="detail-list">
          <li>Danh mục: {post.categoryName}</li>
          <li>Vị trí: {post.locationName}</li>
          <li>Thời gian: {new Date(post.eventTime).toLocaleString()}</li>
          <li>Người đăng: {post.owner?.fullName}</li>
          <li>Ghi chú liên hệ: {post.contactNote || "Không có"}</li>
          <li>Chính sách số điện thoại: ẩn trên trang công khai, chỉ hiển thị trong chat riêng tư.</li>
        </ul>

        <PostMediaGallery post={post} />

        {user?.id !== post.userId && (
          <button
            className="primary-btn"
            onClick={() => navigate(`/chat?postId=${post.id}&receiverId=${post.userId}`)}
          >
            Nhắn tin cho chủ bài đăng
          </button>
        )}

        {user?.id === post.userId && (
          <form className="stack-form" onSubmit={handleOwnerUpdate}>
            <h4>Chỉnh sửa bài đăng của tôi</h4>
            <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} required />
            <textarea
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              required
            />
            <select value={editStatus} onChange={(event) => setEditStatus(event.target.value as any)}>
              <option value="searching">Đang tìm</option>
              <option value="found">Đã tìm thấy</option>
              <option value="returned">Đã trả lại</option>
            </select>
            <HashtagInputOverlay
              value={editTags}
              onChange={setEditTags}
              placeholder="#ba-lo #sac-dien-thoai"
            />
            <p className="hint-text">Gõ # và một vài ký tự để nhận gợi ý thẻ.</p>
            <input
              placeholder="Ghi chú liên hệ"
              value={editContactNote}
              onChange={(event) => setEditContactNote(event.target.value)}
            />
            <label>
              Thay thế/Thêm ảnh
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => setEditImageFiles(Array.from(event.target.files ?? []).slice(0, 4))}
              />
            </label>
            <label>
              Ảnh xác minh (tùy chọn)
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setBypassImageFile(event.target.files?.[0] ?? null)}
              />
            </label>
            {bypassImageFile && (
              <div className="hint-text">Đã chọn ảnh xác minh: {bypassImageFile.name}</div>
            )}
            {editImageFiles.length > 0 && (
              <p className="hint-text">Đã chọn {editImageFiles.length} ảnh để cập nhật.</p>
            )}
            <div className="button-group">
              <button className="primary-btn" type="submit">
                Lưu thay đổi
              </button>
              <button className="danger-btn" type="button" onClick={handleOwnerDelete}>
                Xóa bài đăng
              </button>
              <button
                className="secondary-btn"
                type="button"
                onClick={async () => {
                  if (!post) return;
                  try {
                    await requestPostBypassApi(post.id, bypassImageFile ?? undefined);
                    alert("Đã gửi yêu cầu xác minh thủ công. Admin sẽ kiểm tra.");
                    setBypassImageFile(null);
                  } catch (err) {
                    alert("Gửi yêu cầu thất bại.");
                  }
                }}
              >
                Gửi yêu cầu xác minh (bỏ qua tự động)
              </button>
            </div>
          </form>
        )}
      </article>

      <section className="panel" id="comments">
        <h3>Bình luận</h3>
        {loadingComments && <p className="hint-text">Đang tải bình luận...</p>}
        {!loadingComments && comments.length === 0 && (
          <p className="hint-text">Chưa có bình luận nào. Hãy là người đầu tiên bình luận.</p>
        )}
        {!loadingComments && comments.length > 0 && (
          <div className="post-viewer-comment-list">
            {comments.map((comment) => (
              <div className="post-viewer-comment-item" key={comment.id}>
                <strong>{comment.author.fullName}</strong>
                <p>{comment.content}</p>
                <small>{new Date(comment.createdAt).toLocaleString()}</small>
              </div>
            ))}
          </div>
        )}

        <form className="stack-form" onSubmit={handleSubmitComment}>
          <textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Nhập nội dung bình luận"
            maxLength={1000}
          />
          <button className="primary-btn" type="submit" disabled={sendingComment}>
            {sendingComment ? "Đang đăng..." : "Đăng bình luận"}
          </button>
        </form>
      </section>

      <section className="panel">
        <h3>Báo cáo bài đăng/người dùng</h3>
        <form onSubmit={handleReport} className="stack-form">
          <select value={reportReason} onChange={(event) => setReportReason(event.target.value as any)}>
            <option value="spam">Spam</option>
            <option value="fraud">Lừa đảo</option>
            <option value="abuse">Xúc phạm</option>
            <option value="unsafe">Không an toàn</option>
            <option value="other">Khác</option>
          </select>
          <textarea
            value={reportDetails}
            onChange={(event) => setReportDetails(event.target.value)}
            required
            placeholder="Mô tả vấn đề"
          />
          <button className="secondary-btn" type="submit">
            Gửi báo cáo
          </button>
        </form>
      </section>
    </AppShell>
  );
}
