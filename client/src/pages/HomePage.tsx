import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { PostCard } from "../components/PostCard";
import { StatusPanel } from "../components/StatusPanel";
import { getRecommendedPostsApi, searchPostsApi } from "../services/api/postApi";
import { listMatchesApi, listNotificationsApi } from "../services/api/miscApi";
import { listBookmarksApi } from "../services/api/bookmarkApi";
import { useAppStore } from "../store/appStore";
import { PostItem } from "../types";

type FeedTab = "for-you" | "latest" | "lost" | "found";
const FEED_BATCH_SIZE = 6;

function parseHybridSearchQuery(query: string): { keyword?: string; tag?: string } {
  const normalized = query.trim();
  if (!normalized) {
    return {};
  }

  const hashtagPattern = /#[\p{L}\p{N}][\p{L}\p{N}_-]*/gu;
  const tagMatches = normalized.match(hashtagPattern) ?? [];
  const keyword = normalized
    .replace(hashtagPattern, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    keyword: keyword || undefined,
    tag: tagMatches[0] ? tagMatches[0].replace(/^#/, "").toLowerCase() : undefined
  };
}

export function HomePage() {
  const navigate = useNavigate();
  const posts = useAppStore((state) => state.posts);
  const setPosts = useAppStore((state) => state.setPosts);
  const matches = useAppStore((state) => state.matches);
  const setMatches = useAppStore((state) => state.setMatches);
  const notifications = useAppStore((state) => state.notifications);
  const setNotifications = useAppStore((state) => state.setNotifications);
  const setBookmarkedPostIds = useAppStore((state) => state.setBookmarkedPostIds);

  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "relevance">("newest");
  const [activeTab, setActiveTab] = useState<FeedTab>("for-you");
  const [recommendedPosts, setRecommendedPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(FEED_BATCH_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const feedSentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreTimerRef = useRef<number | null>(null);

  async function loadDashboard(filters?: {
    keyword?: string;
    tag?: string;
    sort?: "newest" | "relevance";
  }) {
    setLoading(true);
    try {
      const [postResults, matchResults, notificationResults, recommendationResults, bookmarks] = await Promise.all([
        searchPostsApi(filters ?? {}),
        listMatchesApi(),
        listNotificationsApi(),
        getRecommendedPostsApi(10),
        listBookmarksApi()
      ]);
      setPosts(postResults);
      setMatches(matchResults);
      setNotifications(notificationResults);
      setRecommendedPosts(recommendationResults);
      setBookmarkedPostIds(bookmarks.map((bookmark) => bookmark.postId));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    return () => {
      if (loadingMoreTimerRef.current) {
        window.clearTimeout(loadingMoreTimerRef.current);
      }
    };
  }, []);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const parsed = parseHybridSearchQuery(searchQuery);
    await loadDashboard({
      keyword: parsed.keyword,
      tag: parsed.tag,
      sort
    });
  }

  const forYouFeed = useMemo(() => {
    const dedup = new Map<number, PostItem>();

    for (const post of recommendedPosts) {
      dedup.set(post.id, post);
    }

    for (const post of posts) {
      if (!dedup.has(post.id)) {
        dedup.set(post.id, post);
      }
    }

    return Array.from(dedup.values());
  }, [recommendedPosts, posts]);

  const visiblePosts = useMemo(() => {
    if (activeTab === "for-you") {
      return forYouFeed;
    }

    if (activeTab === "latest") {
      return [...posts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return posts.filter((post) => post.type === activeTab);
  }, [activeTab, forYouFeed, posts]);

  const renderedPosts = useMemo(
    () => visiblePosts.slice(0, visibleCount),
    [visiblePosts, visibleCount]
  );

  const hasMorePosts = visibleCount < visiblePosts.length;

  useEffect(() => {
    setVisibleCount(FEED_BATCH_SIZE);
    setLoadingMore(false);
  }, [activeTab, visiblePosts.length]);

  useEffect(() => {
    if (!feedSentinelRef.current || loading || !hasMorePosts || loadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        setLoadingMore(true);
        if (loadingMoreTimerRef.current) {
          window.clearTimeout(loadingMoreTimerRef.current);
        }

        loadingMoreTimerRef.current = window.setTimeout(() => {
          setVisibleCount((current) => Math.min(current + FEED_BATCH_SIZE, visiblePosts.length));
          setLoadingMore(false);
        }, 220);
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(feedSentinelRef.current);
    return () => observer.disconnect();
  }, [loading, hasMorePosts, loadingMore, visiblePosts.length]);

  const trendingTags = useMemo(() => {
    const tagCount = new Map<string, number>();
    for (const post of posts) {
      for (const postTag of post.tags) {
        const key = postTag.toLowerCase();
        tagCount.set(key, (tagCount.get(key) ?? 0) + 1);
      }
    }

    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [posts]);

  function resetFilters(): void {
    setSearchQuery("");
    setSort("newest");
    void loadDashboard();
  }

  return (
    <AppShell title="Bảng tin cộng đồng">
      <div className="timeline-layout">
        <div className="timeline-main">
          <section className="panel quick-post-card">
            <div className="quick-post-main">
              <div className="quick-post-avatar">UEH</div>
              <button className="quick-post-prompt" type="button" onClick={() => navigate("/posts/new")}>
                Hôm nay bạn thất lạc hoặc nhặt được gì? Đăng bài để cộng đồng UEH hỗ trợ ngay.
              </button>
            </div>
            <div className="quick-post-actions">
              <button className="ghost-btn" type="button" onClick={() => navigate("/posts/new")}>Thất lạc</button>
              <button className="ghost-btn" type="button" onClick={() => navigate("/posts/new")}>Nhặt được</button>
              <button className="primary-btn" type="button" onClick={() => navigate("/posts/new")}>
                Đăng bài ngay
              </button>
            </div>
          </section>

          <section className="panel feed-composer">
            <div className="composer-header">
              <div>
                <p className="auth-kicker">Bảng tin UEH</p>
                <h3>Cập nhật thất lạc và nhặt được theo thời gian thực</h3>
                <p className="hint-text">
                  Đăng bài nhanh, tìm đúng người nhanh hơn nhờ gợi ý thông minh theo vị trí và thẻ.
                </p>
              </div>
              <button className="primary-btn" onClick={() => navigate("/posts/new")}>
                Tạo bài đăng
              </button>
            </div>
            <div className="composer-meta">
              <span className="badge">Xếp hạng bởi danh mục, vị trí, thẻ, loại bài đăng và độ mới</span>
            </div>
          </section>

          <section className="panel">
            <form className="filter-grid feed-filter-grid" onSubmit={handleSearch}>
              <input
                placeholder="Tìm kiếm + #thẻ (vd: ví #thẻ-sv)"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <select value={sort} onChange={(event) => setSort(event.target.value as any)}>
                <option value="newest">Mới nhất</option>
                <option value="relevance">Liên quan</option>
              </select>
              <button className="primary-btn" type="submit">
                Tìm
              </button>
              <button className="ghost-btn" type="button" onClick={resetFilters}>
                Đặt lại
              </button>
            </form>

            <div className="feed-tabs" role="tablist" aria-label="Bộ lọc bảng tin">
              <button
                className={`feed-tab ${activeTab === "for-you" ? "active" : ""}`}
                onClick={() => setActiveTab("for-you")}
              >
                Dành cho bạn
              </button>
              <button
                className={`feed-tab ${activeTab === "latest" ? "active" : ""}`}
                onClick={() => setActiveTab("latest")}
              >
                Mới nhất
              </button>
              <button
                className={`feed-tab ${activeTab === "lost" ? "active" : ""}`}
                onClick={() => setActiveTab("lost")}
              >
                Thất lạc
              </button>
              <button
                className={`feed-tab ${activeTab === "found" ? "active" : ""}`}
                onClick={() => setActiveTab("found")}
              >
                Nhặt được
              </button>
            </div>
          </section>

          <section className="feed-list">
            {loading && <p>Đang tải bảng tin...</p>}
            {!loading && visiblePosts.length === 0 && <p>Không tìm thấy bài đăng phù hợp bộ lọc hiện tại.</p>}
            {!loading && renderedPosts.map((post) => <PostCard key={post.id} post={post} />)}

            {!loading && visiblePosts.length > 0 && (
              <div className="infinite-status">
                <p className="hint-text">Hiển thị {renderedPosts.length}/{visiblePosts.length} bài đăng</p>

                {hasMorePosts ? (
                  <>
                    <div ref={feedSentinelRef} className="feed-sentinel" aria-hidden="true" />
                    {loadingMore ? (
                      <p className="hint-text">Đang tải thêm bài đăng...</p>
                    ) : (
                      <button
                        className="ghost-btn"
                        type="button"
                        onClick={() => setVisibleCount((current) => Math.min(current + FEED_BATCH_SIZE, visiblePosts.length))}
                      >
                        Tải thêm
                      </button>
                    )}
                  </>
                ) : (
                  <p className="hint-text">Bạn đã xem hết bài đăng trong bộ lọc này.</p>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="timeline-side">
          <StatusPanel matches={matches} notifications={notifications} />

          <section className="panel recommendation-rail">
            <h3>Gợi ý cho bạn</h3>
            <div className="mini-recommend-list">
              {recommendedPosts.slice(0, 6).map((post) => (
                <Link key={post.id} to={`/posts/${post.id}`} className="mini-recommend-card">
                  <strong>{post.title}</strong>
                  <small>{post.recommendationReason ?? "Liên quan đến hành vi của bạn"}</small>
                </Link>
              ))}
              {recommendedPosts.length === 0 && <p className="hint-text">Chưa có gợi ý nào.</p>}
            </div>
          </section>

          <section className="panel">
            <h3>Thẻ xu hướng</h3>
            <div className="trend-list">
              {trendingTags.length === 0 && <p className="hint-text">Thẻ sẽ xuất hiện khi người dùng bắt đầu đăng bài.</p>}
              {trendingTags.map(([trendTag, count]) => (
                <button
                  key={trendTag}
                  className="trend-chip"
                  onClick={() => {
                    const parsed = parseHybridSearchQuery(searchQuery);
                    const nextQuery = [parsed.keyword, `#${trendTag}`].filter(Boolean).join(" ");
                    setSearchQuery(nextQuery);
                    void loadDashboard({ keyword: parsed.keyword, tag: trendTag, sort });
                  }}
                >
                  #{trendTag} <span>{count}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
