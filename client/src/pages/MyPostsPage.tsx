import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { clearMyHistoryCache, getMyHistoryApi } from "../services/api/miscApi";
import { deletePostApi } from "../services/api/postApi";
import { UserPostHistoryItem } from "../types";

type ModerationFilter = "all" | "pending" | "approved" | "rejected";
type TypeFilter = "all" | "lost" | "found";

function formatDateTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return value;
  }
  return new Date(timestamp).toLocaleString();
}

export function MyPostsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<UserPostHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [moderationFilter, setModerationFilter] = useState<ModerationFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  async function loadMyPosts(): Promise<void> {
    setLoading(true);
    try {
      const history = await getMyHistoryApi();
      setPosts(history.posts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMyPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return posts.filter((post) => {
      if (moderationFilter !== "all" && post.moderation_status !== moderationFilter) {
        return false;
      }
      if (typeFilter !== "all" && post.type !== typeFilter) {
        return false;
      }
      if (normalizedKeyword && !post.title.toLowerCase().includes(normalizedKeyword)) {
        return false;
      }
      return true;
    });
  }, [posts, moderationFilter, typeFilter, keyword]);

  const counts = useMemo(() => {
    return {
      total: posts.length,
      pending: posts.filter((post) => post.moderation_status === "pending").length,
      approved: posts.filter((post) => post.moderation_status === "approved").length,
      rejected: posts.filter((post) => post.moderation_status === "rejected").length
    };
  }, [posts]);

  async function handleDelete(post: UserPostHistoryItem): Promise<void> {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa bài đăng \"${post.title}\"?`);
    if (!confirmed) {
      return;
    }

    setDeletingPostId(post.id);
    try {
      await deletePostApi(post.id);
      clearMyHistoryCache();
      await loadMyPosts();
    } finally {
      setDeletingPostId(null);
    }
  }

  function toTypeLabel(type: UserPostHistoryItem["type"]): string {
    return type === "lost" ? "THẤT LẠC" : "NHẶT ĐƯỢC";
  }

  function toStatusLabel(status: UserPostHistoryItem["status"]): string {
    if (status === "searching") {
      return "Đang tìm";
    }
    if (status === "found") {
      return "Đã tìm thấy";
    }
    return "Đã trả lại";
  }

  function toModerationLabel(status: UserPostHistoryItem["moderation_status"]): string {
    if (status === "pending") {
      return "Chờ duyệt";
    }
    if (status === "approved") {
      return "Đã duyệt";
    }
    return "Từ chối";
  }

  return (
    <AppShell title="Quản lý bài đăng của tôi">
      <section className="panel manage-posts-toolbar">
        <div className="manage-posts-filters">
          <input
            placeholder="Tìm bài đăng của tôi"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />

          <select
            value={moderationFilter}
            onChange={(event) => setModerationFilter(event.target.value as ModerationFilter)}
          >
            <option value="all">Tất cả trạng thái duyệt</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>

          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}>
            <option value="all">Tất cả loại</option>
            <option value="lost">Thất lạc</option>
            <option value="found">Nhặt được</option>
          </select>

          <button className="ghost-btn" type="button" onClick={() => void loadMyPosts()}>
            Làm mới
          </button>
        </div>

        <div className="manage-posts-summary">
          <span className="badge">Tổng: {counts.total}</span>
          <span className="badge">Chờ duyệt: {counts.pending}</span>
          <span className="badge">Đã duyệt: {counts.approved}</span>
          <span className="badge">Từ chối: {counts.rejected}</span>
        </div>
      </section>

      <section className="manage-posts-grid">
        {loading && <p>Đang tải danh sách bài đăng...</p>}

        {!loading && filteredPosts.length === 0 && (
          <div className="panel">
            <p>Không có bài đăng nào phù hợp với bộ lọc hiện tại.</p>
          </div>
        )}

        {!loading &&
          filteredPosts.map((post) => (
            <article key={post.id} className="panel manage-post-card">
              <div className="manage-post-head">
                <h3>
                  <button
                    type="button"
                    className="manage-post-title-btn"
                    onClick={() => navigate(`/posts/${post.id}`)}
                  >
                    {post.title}
                  </button>
                </h3>
                <div className="post-top">
                  <span className={`chip chip-${post.type}`}>{toTypeLabel(post.type)}</span>
                  <span className="chip">{toStatusLabel(post.status)}</span>
                  <span className={`chip moderation-${post.moderation_status}`}>
                    {toModerationLabel(post.moderation_status)}
                  </span>
                </div>
              </div>

              <p className="hint-text">Tạo lúc {formatDateTime(post.created_at)}</p>

              <div className="manage-post-actions">
                <button className="secondary-btn" type="button" onClick={() => navigate(`/posts/${post.id}`)}>
                  Mở/Sửa
                </button>
                <button
                  className="danger-btn"
                  type="button"
                  onClick={() => void handleDelete(post)}
                  disabled={deletingPostId === post.id}
                >
                  {deletingPostId === post.id ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </article>
          ))}
      </section>
    </AppShell>
  );
}
