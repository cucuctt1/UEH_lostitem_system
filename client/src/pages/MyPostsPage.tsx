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
    const confirmed = window.confirm(`Delete post \"${post.title}\"?`);
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

  return (
    <AppShell title="Manage My Posts">
      <section className="panel manage-posts-toolbar">
        <div className="manage-posts-filters">
          <input
            placeholder="Search my posts"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />

          <select
            value={moderationFilter}
            onChange={(event) => setModerationFilter(event.target.value as ModerationFilter)}
          >
            <option value="all">All Moderation</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}>
            <option value="all">All Types</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>

          <button className="ghost-btn" type="button" onClick={() => void loadMyPosts()}>
            Refresh
          </button>
        </div>

        <div className="manage-posts-summary">
          <span className="badge">Total {counts.total}</span>
          <span className="badge">Pending {counts.pending}</span>
          <span className="badge">Approved {counts.approved}</span>
          <span className="badge">Rejected {counts.rejected}</span>
        </div>
      </section>

      <section className="manage-posts-grid">
        {loading && <p>Loading your posts...</p>}

        {!loading && filteredPosts.length === 0 && (
          <div className="panel">
            <p>No posts match the current filters.</p>
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
                  <span className={`chip chip-${post.type}`}>{post.type.toUpperCase()}</span>
                  <span className="chip">{post.status}</span>
                  <span className={`chip moderation-${post.moderation_status}`}>{post.moderation_status}</span>
                </div>
              </div>

              <p className="hint-text">Created {formatDateTime(post.created_at)}</p>

              <div className="manage-post-actions">
                <button className="secondary-btn" type="button" onClick={() => navigate(`/posts/${post.id}`)}>
                  Open/Edit
                </button>
                <button
                  className="danger-btn"
                  type="button"
                  onClick={() => void handleDelete(post)}
                  disabled={deletingPostId === post.id}
                >
                  {deletingPostId === post.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
      </section>
    </AppShell>
  );
}
