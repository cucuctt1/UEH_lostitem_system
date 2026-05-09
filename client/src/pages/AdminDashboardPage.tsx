import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { listPostsApi } from "../services/api/postApi";
import { listLocationsApi } from "../services/api/miscApi";
import { Location, PostItem } from "../types";
import {
  AdminReportRow,
  AdminStoredItemRow,
  AdminUserRow,
  AnalyticsSummaryRow,
  approvePostApi,
  createItemApi,
  createUserByAdminApi,
  getAnalyticsApi,
  getItemsApi,
  getReportsApi,
  getUsersApi,
  lockUserApi,
  resolveReportApi
} from "../services/api/adminApi";

type AdminSection = "dashboard" | "locations" | "disputes";

type WeekPoint = {
  key: string;
  label: string;
  reported: number;
  resolved: number;
};

type LocationInsight = {
  id: number | null;
  name: string;
  building: string;
  lost: number;
  found: number;
};

const SECTION_LABELS: Record<AdminSection, string> = {
  dashboard: "Bảng điều khiển",
  locations: "Quản lý địa điểm",
  disputes: "Xử lý tranh chấp"
};

const WEEKDAY_LABELS = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];

function extractErrorMessage(error: unknown, fallback: string): string {
  const maybeError = error as { response?: { data?: { message?: string } }; message?: string };
  return maybeError.response?.data?.message ?? maybeError.message ?? fallback;
}

function formatRole(role: "user" | "admin"): string {
  return role === "admin" ? "Quản trị viên" : "Người dùng";
}

function formatPostType(type: "lost" | "found"): string {
  return type === "lost" ? "Thất lạc" : "Nhặt được";
}

function formatPostStatus(status: "searching" | "found" | "returned"): string {
  if (status === "searching") {
    return "Đang tìm";
  }
  if (status === "found") {
    return "Đã tìm thấy";
  }
  return "Đã trả lại";
}

function formatReportReason(reason: string): string {
  const map: Record<string, string> = {
    spam: "Spam",
    fraud: "Lừa đảo",
    abuse: "Lạm dụng",
    unsafe: "Không an toàn",
    other: "Khác"
  };
  return map[reason] ?? "Khác";
}

function formatDate(dateValue: string | null): string {
  if (!dateValue) {
    return "--";
  }
  return new Date(dateValue).toLocaleDateString("vi-VN");
}

function formatDateTime(dateValue: string | null): string {
  if (!dateValue) {
    return "--";
  }
  return new Date(dateValue).toLocaleString("vi-VN");
}

function dayKey(input: Date): string {
  return input.toISOString().slice(0, 10);
}

function buildWeekTrend(posts: PostItem[]): WeekPoint[] {
  const today = new Date();
  const seed = new Map<string, WeekPoint>();

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - index);
    const key = dayKey(date);

    seed.set(key, {
      key,
      label: WEEKDAY_LABELS[date.getDay()],
      reported: 0,
      resolved: 0
    });
  }

  for (const post of posts) {
    const createdKey = dayKey(new Date(post.createdAt));
    const target = seed.get(createdKey);
    if (!target) {
      continue;
    }

    target.reported += 1;
    if (post.status === "found" || post.status === "returned") {
      target.resolved += 1;
    }
  }

  return Array.from(seed.values());
}

function buildLinePath(points: number[], width: number, height: number): string {
  if (points.length === 0) {
    return "";
  }

  const max = Math.max(...points, 1);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  return points
    .map((point, index) => {
      const x = index * stepX;
      const y = height - (point / max) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildLocationInsights(
  analytics: AnalyticsSummaryRow | null,
  items: AdminStoredItemRow[],
  locations: Location[]
): LocationInsight[] {
  const lostMap = new Map<string, number>();
  const foundMap = new Map<string, number>();

  for (const entry of analytics?.lostByLocation ?? []) {
    lostMap.set(entry.location_name, Number(entry.total) || 0);
  }

  for (const item of items) {
    const locationName = item.location_name ?? "Chưa rõ";
    const nextValue = (foundMap.get(locationName) ?? 0) + item.quantity;
    foundMap.set(locationName, nextValue);
  }

  const rows: LocationInsight[] = locations.map((location) => ({
    id: location.id,
    name: location.name,
    building: location.details?.trim() || "Cơ sở",
    lost: lostMap.get(location.name) ?? 0,
    found: foundMap.get(location.name) ?? 0
  }));

  for (const [name, lost] of lostMap.entries()) {
    if (rows.some((row) => row.name === name)) {
      continue;
    }
    rows.push({ id: null, name, building: "Cơ sở", lost, found: foundMap.get(name) ?? 0 });
  }

  for (const [name, found] of foundMap.entries()) {
    if (rows.some((row) => row.name === name)) {
      continue;
    }
    rows.push({ id: null, name, building: "Cơ sở", lost: 0, found });
  }

  return rows.sort((first, second) => second.lost + second.found - (first.lost + first.found));
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [moderatingPostId, setModeratingPostId] = useState<number | null>(null);
  const [lockingUserId, setLockingUserId] = useState<number | null>(null);

  const [allPosts, setAllPosts] = useState<PostItem[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [reports, setReports] = useState<AdminReportRow[]>([]);
  const [items, setItems] = useState<AdminStoredItemRow[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummaryRow | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);

  const [locationQuery, setLocationQuery] = useState("");
  const [disputeFilter, setDisputeFilter] = useState<"all" | "open" | "resolved">("all");
  const [resolvingReportId, setResolvingReportId] = useState<number | null>(null);

  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState(1);
  const [itemLocationId, setItemLocationId] = useState(1);

  const [accountFullName, setAccountFullName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);

  async function loadAdminData(): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      const [postRows, userRows, reportRows, itemRows, analyticRows, locationRows] = await Promise.all([
        listPostsApi(),
        getUsersApi(),
        getReportsApi(),
        getItemsApi(),
        getAnalyticsApi(),
        listLocationsApi()
      ]);

      setAllPosts(postRows);
      setUsers(userRows);
      setReports(reportRows);
      setItems(itemRows);
      setAnalytics(analyticRows);
      setLocations(locationRows);
      setLastUpdatedAt(new Date().toISOString());
    } catch (loadError) {
      setError(extractErrorMessage(loadError, "Không thể tải dữ liệu quản trị."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  async function moderatePost(postId: number, approved: boolean): Promise<void> {
    setModeratingPostId(postId);
    try {
      await approvePostApi(postId, approved);
      await loadAdminData();
    } finally {
      setModeratingPostId(null);
    }
  }

  async function toggleUserLock(userId: number, locked: boolean): Promise<void> {
    setLockingUserId(userId);
    try {
      await lockUserApi(userId, locked);
      await loadAdminData();
    } finally {
      setLockingUserId(null);
    }
  }

  async function resolveReport(reportId: number): Promise<void> {
    setResolvingReportId(reportId);
    try {
      await resolveReportApi(reportId);
      await loadAdminData();
    } finally {
      setResolvingReportId(null);
    }
  }

  async function handleCreateItem(event: FormEvent): Promise<void> {
    event.preventDefault();
    await createItemApi({
      name: itemName,
      description: itemDescription,
      categoryId: itemCategoryId,
      locationId: itemLocationId,
      quantity: 1,
      status: "stored"
    });
    setItemName("");
    setItemDescription("");
    await loadAdminData();
  }

  async function handleCreateAccount(event: FormEvent): Promise<void> {
    event.preventDefault();
    setAccountMessage(null);

    if (!accountEmail.toLowerCase().endsWith("@st.ueh.edu.vn")) {
      setAccountMessage("Email phải kết thúc bằng @st.ueh.edu.vn.");
      return;
    }

    setCreatingAccount(true);
    try {
      const result = await createUserByAdminApi({
        fullName: accountFullName,
        email: accountEmail,
        temporaryPassword
      });
      setAccountFullName("");
      setAccountEmail("");
      setTemporaryPassword("");
      setAccountMessage(`Đã tạo tài khoản: ${result.email}`);
      await loadAdminData();
    } catch (createError) {
      setAccountMessage(extractErrorMessage(createError, "Không thể tạo tài khoản mới."));
    } finally {
      setCreatingAccount(false);
    }
  }

  const pendingPosts = useMemo(
    () => allPosts.filter((post) => post.moderationStatus === "pending"),
    [allPosts]
  );

  const locationInsights = useMemo(
    () => buildLocationInsights(analytics, items, locations),
    [analytics, items, locations]
  );

  const filteredLocations = useMemo(() => {
    const keyword = locationQuery.trim().toLowerCase();
    if (!keyword) {
      return locationInsights;
    }
    return locationInsights.filter(
      (entry) => entry.name.toLowerCase().includes(keyword) || entry.building.toLowerCase().includes(keyword)
    );
  }, [locationInsights, locationQuery]);

  const weekTrend = useMemo(() => buildWeekTrend(allPosts), [allPosts]);
  const reportLine = weekTrend.map((entry) => entry.reported);
  const resolvedLine = weekTrend.map((entry) => entry.resolved);
  const maxWeekly = Math.max(...reportLine, ...resolvedLine, 1);
  const reportPath = buildLinePath(reportLine, 480, 160);
  const resolvedPath = buildLinePath(resolvedLine, 480, 160);

  const openDisputes = reports.filter((report) => report.status === "open").length;
  const totalFoundItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const weeklyReportedTotal = reportLine.reduce((sum, value) => sum + value, 0);
  const weeklyResolvedTotal = resolvedLine.reduce((sum, value) => sum + value, 0);
  const topLocations = locationInsights.slice(0, 5);
  const maxLocationValue = Math.max(...topLocations.map((location) => Math.max(location.lost, location.found)), 1);

  const distributionRows = topLocations.filter((row) => row.lost > 0 || row.found > 0);
  const distributionTotal = distributionRows.reduce((sum, row) => sum + row.lost + row.found, 0);

  const donutStyle =
    distributionTotal === 0
      ? { background: "#e5eef0" }
      : {
          background: `conic-gradient(${distributionRows
            .map((row, index) => {
              const before = distributionRows
                .slice(0, index)
                .reduce((sum, current) => sum + current.lost + current.found, 0);
              const start = (before / distributionTotal) * 100;
              const end = ((before + row.lost + row.found) / distributionTotal) * 100;
              const colors = ["#0e7a76", "#f17034", "#1f6fb2", "#cf3f5c", "#718355"];
              return `${colors[index % colors.length]} ${start}% ${end}%`;
            })
            .join(", ")})`
        };

  const visibleDisputes =
    disputeFilter === "all" ? reports : reports.filter((report) => report.status === disputeFilter);

  return (
    <AppShell title="Trung tâm quản trị">
      {error && <p className="error-text">{error}</p>}
      {isLoading && <p className="hint-text">Đang tải dữ liệu quản trị...</p>}

      <section className="panel admin-workspace">
        <aside className="admin-nav">
          <p className="admin-nav-kicker">Quản trị</p>
          <h3>Bảng điều phối</h3>

          <div className="admin-nav-links">
            {(Object.keys(SECTION_LABELS) as AdminSection[]).map((section) => (
              <button
                key={section}
                type="button"
                className={`admin-nav-link ${activeSection === section ? "active" : ""}`}
                onClick={() => setActiveSection(section)}
              >
                <span>{SECTION_LABELS[section]}</span>
                {section === "dashboard" && <small>{pendingPosts.length} chờ duyệt</small>}
                {section === "locations" && <small>{locationInsights.length} điểm</small>}
                {section === "disputes" && <small>{openDisputes} đang mở</small>}
              </button>
            ))}
          </div>

          <div className="admin-nav-footer">
            <p className="hint-text">Dữ liệu cập nhật lần cuối: {formatDateTime(lastUpdatedAt)}</p>
            <button className="ghost-btn" type="button" onClick={() => void loadAdminData()}>
              Làm mới dữ liệu
            </button>
          </div>
        </aside>

        <div className="admin-main">
          {activeSection === "dashboard" && (
            <div className="admin-view">
              <header className="admin-view-head">
                <div>
                  <h2>Bảng điều khiển thất lạc & nhặt được</h2>
                  <p className="hint-text">Theo dõi nhanh hoạt động, kiểm duyệt và khối lượng xử lý theo thời gian thực.</p>
                </div>
              </header>

              <div className="admin-metrics-grid">
                <article className="metric admin-metric-card">
                  <h4>Tổng bài đăng</h4>
                  <p>{analytics?.totals.total_posts ?? 0}</p>
                  <small>+{weeklyReportedTotal} trong 7 ngày gần nhất</small>
                </article>
                <article className="metric admin-metric-card">
                  <h4>Tổng người dùng</h4>
                  <p>{analytics?.totals.total_users ?? 0}</p>
                  <small>{users.filter((entry) => entry.is_locked === 0).length} tài khoản đang hoạt động</small>
                </article>
                <article className="metric admin-metric-card">
                  <h4>Tranh chấp mở</h4>
                  <p>{openDisputes}</p>
                  <small>{reports.length - openDisputes} tranh chấp đã xử lý</small>
                </article>
                <article className="metric admin-metric-card">
                  <h4>Tỷ lệ trả lại thành công</h4>
                  <p>{analytics?.returnSuccessRate ?? 0}%</p>
                  <small>{weeklyResolvedTotal} bài được xử lý tuần này</small>
                </article>
              </div>

              <div className="admin-chart-grid">
                <article className="panel admin-chart-card">
                  <h3>Thống kê thất lạc theo địa điểm</h3>
                  <div className="admin-location-bars">
                    {topLocations.map((location) => (
                      <div key={location.name} className="admin-location-row">
                        <div className="admin-location-meta">
                          <strong>{location.name}</strong>
                          <small>{location.building}</small>
                        </div>
                        <div className="admin-location-bar-group">
                          <div
                            className="admin-location-bar lost"
                            style={{ width: `${(location.lost / maxLocationValue) * 100}%` }}
                          />
                          <div
                            className="admin-location-bar found"
                            style={{ width: `${(location.found / maxLocationValue) * 100}%` }}
                          />
                        </div>
                        <div className="admin-location-count">
                          <span>{location.lost}</span>
                          <span>{location.found}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="hint-text">Màu đỏ: số báo mất. Màu xanh: số vật phẩm đã tìm thấy/lưu kho.</p>
                </article>

                <article className="panel admin-chart-card">
                  <h3>Xu hướng theo tuần</h3>
                  <div className="admin-line-wrap">
                    <svg viewBox="0 0 480 190" role="img" aria-label="Xu hướng số lượng báo mất và số lượng đã xử lý theo tuần">
                      <line x1="0" y1="160" x2="480" y2="160" className="admin-axis-line" />
                      {reportPath && <path d={reportPath} className="admin-line reported" />}
                      {resolvedPath && <path d={resolvedPath} className="admin-line resolved" />}
                    </svg>
                    <div className="admin-chart-xlabels">
                      {weekTrend.map((entry) => (
                        <span key={entry.key}>{entry.label}</span>
                      ))}
                    </div>
                  </div>
                  <p className="hint-text">
                    Đỉnh theo ngày: {maxWeekly} mục. Báo mới: {weeklyReportedTotal}, đã xử lý: {weeklyResolvedTotal}.
                  </p>
                </article>
              </div>

              <div className="admin-chart-grid single">
                <article className="panel admin-chart-card">
                  <h3>Phân bố vật phẩm theo địa điểm</h3>
                  <div className="admin-distribution-layout">
                    <div className="admin-donut" style={donutStyle} />
                    <div className="admin-donut-legend">
                      {distributionRows.length === 0 && <p className="hint-text">Chưa có dữ liệu hoạt động theo địa điểm.</p>}
                      {distributionRows.map((row, index) => {
                        const palette = ["#0e7a76", "#f17034", "#1f6fb2", "#cf3f5c", "#718355"];
                        return (
                          <p key={row.name}>
                            <span style={{ background: palette[index % palette.length] }} /> {row.name}: {row.lost + row.found}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </article>
              </div>

              <section className="admin-secondary-grid">
                <article className="panel">
                  <h3>Bài đăng chờ kiểm duyệt</h3>
                  {pendingPosts.length === 0 && <p className="hint-text">Hiện không có bài đăng đang chờ duyệt.</p>}
                  {pendingPosts.map((post) => (
                    <div key={post.id} className="row-actions">
                      <div>
                        <strong>{post.title}</strong>
                        <small>
                          {formatPostType(post.type)} | {formatPostStatus(post.status)}
                        </small>
                      </div>
                      <div className="button-group">
                        <button
                          className="primary-btn"
                          disabled={moderatingPostId === post.id}
                          onClick={() => void moderatePost(post.id, true)}
                        >
                          {moderatingPostId === post.id ? "Đang xử lý..." : "Duyệt"}
                        </button>
                        <button
                          className="danger-btn"
                          disabled={moderatingPostId === post.id}
                          onClick={() => void moderatePost(post.id, false)}
                        >
                          {moderatingPostId === post.id ? "Đang xử lý..." : "Từ chối"}
                        </button>
                      </div>
                    </div>
                  ))}
                </article>

                <article className="panel">
                  <h3>Quản lý người dùng</h3>
                  {users.map((entry) => (
                    <div key={entry.id} className="row-actions">
                      <div>
                        <strong>{entry.full_name}</strong>
                        <small>
                          {entry.email} | {formatRole(entry.role)}
                        </small>
                        {entry.must_change_password === 1 && (
                          <p className="hint-text">Người dùng cần đổi mật khẩu ở lần đăng nhập đầu tiên.</p>
                        )}
                      </div>
                      <button
                        className="secondary-btn"
                        onClick={() => void toggleUserLock(entry.id, entry.is_locked === 0)}
                        disabled={entry.role === "admin" || lockingUserId === entry.id}
                      >
                        {lockingUserId === entry.id ? "Đang xử lý..." : entry.is_locked === 1 ? "Mở khóa" : "Khóa"}
                      </button>
                    </div>
                  ))}
                </article>
              </section>

              <section className="panel split-panel">
                <div>
                  <h3>Tạo tài khoản người dùng</h3>
                  <form className="stack-form" onSubmit={(event) => void handleCreateAccount(event)}>
                    <input
                      placeholder="Họ và tên"
                      value={accountFullName}
                      onChange={(event) => setAccountFullName(event.target.value)}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email sinh viên (user@st.ueh.edu.vn)"
                      value={accountEmail}
                      onChange={(event) => setAccountEmail(event.target.value)}
                      required
                    />
                    <input
                      type="password"
                      placeholder="Mật khẩu tạm thời"
                      value={temporaryPassword}
                      onChange={(event) => setTemporaryPassword(event.target.value)}
                      minLength={8}
                      required
                    />
                    {accountMessage && <p className="hint-text">{accountMessage}</p>}
                    <button className="primary-btn" type="submit" disabled={creatingAccount}>
                      {creatingAccount ? "Đang tạo..." : "Tạo tài khoản"}
                    </button>
                  </form>
                </div>

                <div>
                  <h3>Thêm vật phẩm lưu kho</h3>
                  <form className="stack-form" onSubmit={(event) => void handleCreateItem(event)}>
                    <input
                      value={itemName}
                      onChange={(event) => setItemName(event.target.value)}
                      placeholder="Tên vật phẩm"
                      required
                    />
                    <textarea
                      value={itemDescription}
                      onChange={(event) => setItemDescription(event.target.value)}
                      placeholder="Mô tả vật phẩm"
                      required
                    />
                    <input
                      type="number"
                      value={itemCategoryId}
                      onChange={(event) => setItemCategoryId(Number(event.target.value))}
                      placeholder="ID danh mục"
                      min={1}
                      required
                    />
                    <input
                      type="number"
                      value={itemLocationId}
                      onChange={(event) => setItemLocationId(Number(event.target.value))}
                      placeholder="ID địa điểm"
                      min={1}
                      required
                    />
                    <button className="primary-btn" type="submit">
                      Tạo vật phẩm
                    </button>
                  </form>
                </div>
              </section>
            </div>
          )}

          {activeSection === "locations" && (
            <div className="admin-view">
              <header className="admin-view-head">
                <div>
                  <h2>Quản lý địa điểm</h2>
                  <p className="hint-text">Theo dõi hoạt động từng khu vực để xác định điểm nóng nhanh hơn.</p>
                </div>
                <div className="admin-view-actions">
                  <input
                    value={locationQuery}
                    onChange={(event) => setLocationQuery(event.target.value)}
                    placeholder="Tìm theo địa điểm hoặc tòa nhà"
                  />
                  <button
                    className="primary-btn"
                    type="button"
                    disabled
                    title="API tạo địa điểm chưa được triển khai ở backend."
                  >
                    + Thêm địa điểm
                  </button>
                </div>
              </header>

              <div className="panel admin-table-panel">
                <table className="table-basic admin-locations-table">
                  <thead>
                    <tr>
                      <th>Địa điểm</th>
                      <th>Tòa nhà</th>
                      <th>Đồ thất lạc</th>
                      <th>Đồ tìm thấy</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLocations.length === 0 && (
                      <tr>
                        <td colSpan={5} className="hint-text">
                          Không có địa điểm phù hợp với từ khóa tìm kiếm.
                        </td>
                      </tr>
                    )}
                    {filteredLocations.map((entry) => (
                      <tr key={`${entry.id ?? "x"}-${entry.name}`}>
                        <td>{entry.name}</td>
                        <td>{entry.building}</td>
                        <td>
                          <span className="admin-pill lost">{entry.lost}</span>
                        </td>
                        <td>
                          <span className="admin-pill found">{entry.found}</span>
                        </td>
                        <td>
                          <div className="admin-inline-actions">
                            <button
                              type="button"
                              className="ghost-btn"
                              onClick={() => {
                                setActiveSection("dashboard");
                                navigate("/admin");
                              }}
                            >
                              Xem nhanh
                            </button>
                            <button type="button" className="ghost-btn" disabled>
                              Chỉnh sửa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="hint-text">Tổng số vật phẩm đã ghi nhận trong kho: {totalFoundItems}.</p>
            </div>
          )}

          {activeSection === "disputes" && (
            <div className="admin-view">
              <header className="admin-view-head">
                <div>
                  <h2>Xử lý tranh chấp</h2>
                  <p className="hint-text">Rà soát các báo cáo lạm dụng, lừa đảo và nguy cơ không an toàn.</p>
                </div>
                <div className="admin-filter-pills">
                  {(["all", "open", "resolved"] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      type="button"
                      className={`feed-tab ${disputeFilter === filterKey ? "active" : ""}`}
                      onClick={() => setDisputeFilter(filterKey)}
                    >
                      {filterKey === "all" ? "Tất cả" : filterKey === "open" ? "Đang mở" : "Đã xử lý"}
                    </button>
                  ))}
                </div>
              </header>

              <div className="admin-dispute-list">
                {visibleDisputes.length === 0 && <p className="hint-text">Không có tranh chấp ở trạng thái này.</p>}

                {visibleDisputes.map((report) => (
                  <article key={report.id} className="panel admin-dispute-card">
                    <div className="admin-dispute-head">
                      <div>
                        <h3>{report.target_post_title || "Báo cáo người dùng"}</h3>
                        <p>
                          {report.reporter_name || `Người báo cáo #${report.reporter_id}`} và{" "}
                          {report.target_user_name || "Tài khoản ẩn danh"}
                        </p>
                        <small>Ngày: {formatDate(report.created_at)} | Lý do: {formatReportReason(report.reason)}</small>
                      </div>
                      <span className={`admin-status ${report.status === "open" ? "pending" : "resolved"}`}>
                        {report.status === "open" ? "Đang mở" : "Đã xử lý"}
                      </span>
                    </div>
                    <p>{report.details}</p>
                    <div className="admin-inline-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => {
                          if (report.target_post_id) {
                            navigate(`/posts/${report.target_post_id}`);
                            return;
                          }
                          navigate("/chat");
                        }}
                      >
                        Xem ngữ cảnh
                      </button>
                      {report.status === "open" && (
                        <button
                          type="button"
                          className="primary-btn"
                          disabled={resolvingReportId === report.id}
                          onClick={() => void resolveReport(report.id)}
                        >
                          {resolvingReportId === report.id ? "Đang xử lý..." : "Đánh dấu đã xử lý"}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
