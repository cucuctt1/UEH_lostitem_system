import { FormEvent, useEffect, useMemo, useState } from "react";
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

function parseHybridSearchQuery(query: string): { keyword?: string; tag?: string } {
  const normalized = query.trim();
  if (!normalized) {
    return {};
  }

  const tagMatches = normalized.match(/#[a-z0-9][a-z0-9-_]*/gi) ?? [];
  const keyword = normalized
    .replace(/#[a-z0-9][a-z0-9-_]*/gi, " ")
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
    <AppShell title="Community Feed">
      <div className="timeline-layout">
        <div className="timeline-main">
          <section className="panel feed-composer">
            <div className="composer-header">
              <div>
                <p className="auth-kicker">Campus Timeline</p>
                <h3>Post updates like a social feed</h3>
                <p className="hint-text">
                  Share what you lost or found, and let the recommendation engine surface likely helpers.
                </p>
              </div>
              <button className="primary-btn" onClick={() => navigate("/posts/new")}>
                Create Post
              </button>
            </div>
            <div className="composer-meta">
              <span className="badge">Ranking factors: category, location, tags, type intent, recency</span>
            </div>
          </section>

          <section className="panel">
            <form className="filter-grid feed-filter-grid" onSubmit={handleSearch}>
              <input
                placeholder="Search text + #tag (e.g. wallet #id-card)"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <select value={sort} onChange={(event) => setSort(event.target.value as any)}>
                <option value="newest">Newest</option>
                <option value="relevance">Relevance</option>
              </select>
              <button className="primary-btn" type="submit">
                Search
              </button>
              <button className="ghost-btn" type="button" onClick={resetFilters}>
                Reset
              </button>
            </form>

            <div className="feed-tabs" role="tablist" aria-label="Feed tabs">
              <button
                className={`feed-tab ${activeTab === "for-you" ? "active" : ""}`}
                onClick={() => setActiveTab("for-you")}
              >
                For You
              </button>
              <button
                className={`feed-tab ${activeTab === "latest" ? "active" : ""}`}
                onClick={() => setActiveTab("latest")}
              >
                Latest
              </button>
              <button
                className={`feed-tab ${activeTab === "lost" ? "active" : ""}`}
                onClick={() => setActiveTab("lost")}
              >
                Lost
              </button>
              <button
                className={`feed-tab ${activeTab === "found" ? "active" : ""}`}
                onClick={() => setActiveTab("found")}
              >
                Found
              </button>
            </div>
          </section>

          <section className="feed-list">
            {loading && <p>Loading feed...</p>}
            {!loading && visiblePosts.length === 0 && <p>No posts found for the current filters.</p>}
            {!loading && visiblePosts.map((post) => <PostCard key={post.id} post={post} />)}
          </section>
        </div>

        <aside className="timeline-side">
          <StatusPanel matches={matches} notifications={notifications} />

          <section className="panel recommendation-rail">
            <h3>Recommended For You</h3>
            <div className="mini-recommend-list">
              {recommendedPosts.slice(0, 6).map((post) => (
                <Link key={post.id} to={`/posts/${post.id}`} className="mini-recommend-card">
                  <strong>{post.title}</strong>
                  <small>{post.recommendationReason ?? "Related to your activity"}</small>
                </Link>
              ))}
              {recommendedPosts.length === 0 && <p className="hint-text">No recommendations yet.</p>}
            </div>
          </section>

          <section className="panel">
            <h3>Trending Tags</h3>
            <div className="trend-list">
              {trendingTags.length === 0 && <p className="hint-text">Tags appear as users post items.</p>}
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
