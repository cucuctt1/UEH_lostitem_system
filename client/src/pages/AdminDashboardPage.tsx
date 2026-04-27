import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  approvePostApi,
  createUserByAdminApi,
  createItemApi,
  getAnalyticsApi,
  getItemsApi,
  getReportsApi,
  getUsersApi,
  lockUserApi
} from "../services/api/adminApi";
import { listPostsApi } from "../services/api/postApi";

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
  if (reason === "spam") {
    return "Spam";
  }
  if (reason === "fraud") {
    return "Lừa đảo";
  }
  if (reason === "abuse") {
    return "Xúc phạm";
  }
  if (reason === "unsafe") {
    return "Không an toàn";
  }
  return "Khác";
}

function formatReportStatus(status: string): string {
  return status === "resolved" ? "Đã xử lý" : "Đang mở";
}

function formatStorageStatus(status: string): string {
  if (status === "stored") {
    return "Đang lưu kho";
  }
  if (status === "claimed") {
    return "Đã nhận";
  }
  return "Đã tiêu hủy";
}

export function AdminDashboardPage() {
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState(1);
  const [itemLocationId, setItemLocationId] = useState(1);
  const [accountFullName, setAccountFullName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);

  async function loadAdminData() {
    const [allPosts, userRows, reportRows, itemRows, analyticRows] = await Promise.all([
      listPostsApi(),
      getUsersApi(),
      getReportsApi(),
      getItemsApi(),
      getAnalyticsApi()
    ]);

    setPendingPosts(allPosts.filter((post) => post.moderationStatus === "pending"));
    setUsers(userRows);
    setReports(reportRows);
    setItems(itemRows);
    setAnalytics(analyticRows);
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  async function moderatePost(postId: number, approved: boolean) {
    await approvePostApi(postId, approved);
    await loadAdminData();
  }

  async function toggleUserLock(userId: number, locked: boolean) {
    await lockUserApi(userId, locked);
    await loadAdminData();
  }

  async function handleCreateItem(event: FormEvent) {
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

  async function handleCreateAccount(event: FormEvent) {
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
      setAccountMessage(`Đã tạo tài khoản: ${result.email}. Người dùng sẽ phải đổi mật khẩu khi đăng nhập lần đầu.`);
      await loadAdminData();
    } catch (error: any) {
      setAccountMessage(error?.response?.data?.message ?? "Không thể tạo tài khoản mới.");
    } finally {
      setCreatingAccount(false);
    }
  }

  return (
    <AppShell title="Bảng điều khiển quản trị">
      <section className="status-panel">
        <div className="metric">
          <h4>Tổng bài đăng</h4>
          <p>{analytics?.totals?.total_posts ?? 0}</p>
        </div>
        <div className="metric">
          <h4>Tỷ lệ trả lại thành công</h4>
          <p>{analytics?.returnSuccessRate ?? 0}%</p>
        </div>
        <div className="metric">
          <h4>Tổng người dùng</h4>
          <p>{analytics?.totals?.total_users ?? 0}</p>
        </div>
      </section>

      <section className="panel">
        <h3>Chờ duyệt bài đăng</h3>
        {pendingPosts.length === 0 && <p className="hint-text">Không có bài đăng nào đang chờ duyệt.</p>}
        {pendingPosts.map((post) => (
          <div key={post.id} className="row-actions">
            <div>
              <strong>{post.title}</strong>
              <small>
                {formatPostType(post.type)} | {formatPostStatus(post.status)}
              </small>
            </div>
            <div className="button-group">
              <button className="primary-btn" onClick={() => moderatePost(post.id, true)}>
                Duyệt
              </button>
              <button className="danger-btn" onClick={() => moderatePost(post.id, false)}>
                Từ chối
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="panel split-panel">
        <div>
          <h3>Quản lý người dùng</h3>
          {users.map((entry) => (
            <div key={entry.id} className="row-actions">
              <div>
                <strong>{entry.full_name}</strong>
                <small>
                  {entry.email} | {entry.role}
                </small>
                {entry.must_change_password === 1 && (
                  <p className="hint-text">Cần đổi mật khẩu ở lần đăng nhập đầu tiên</p>
                )}
              </div>
              <button
                className="secondary-btn"
                onClick={() => toggleUserLock(entry.id, entry.is_locked === 0)}
                disabled={entry.role === "admin"}
              >
                {entry.is_locked ? "Mở khóa" : "Khóa"}
              </button>
            </div>
          ))}

          <h4>Tạo tài khoản mới</h4>
          <form className="stack-form" onSubmit={handleCreateAccount}>
            <input
              placeholder="Họ và tên"
              value={accountFullName}
              onChange={(event) => setAccountFullName(event.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email sinh viên (vd: user@st.ueh.edu.vn)"
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
              {creatingAccount ? "Đang tạo..." : "Tạo tài khoản người dùng"}
            </button>
          </form>
        </div>

        <div>
          <h3>Hàng đợi báo cáo</h3>
          {reports.length === 0 && <p className="hint-text">Chưa có báo cáo nào.</p>}
          {reports.map((report) => (
            <div key={report.id} className="row-card">
              <strong>{formatReportReason(report.reason)}</strong>
              <p>{report.details}</p>
              <small>Trạng thái: {formatReportStatus(report.status)}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="panel split-panel">
        <div>
          <h3>Vật phẩm kho lưu trữ</h3>
          {items.length === 0 && <p className="hint-text">Kho hiện chưa có vật phẩm nào.</p>}
          {items.map((item) => (
            <div key={item.id} className="row-card">
              <strong>{item.name}</strong>
              <small>
                {formatStorageStatus(item.status)} | số lượng {item.quantity}
              </small>
            </div>
          ))}
        </div>

        <div>
          <h3>Thêm vật phẩm vào kho</h3>
          <form className="stack-form" onSubmit={handleCreateItem}>
            <input
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              placeholder="Tên vật phẩm"
              required
            />
            <textarea
              value={itemDescription}
              onChange={(event) => setItemDescription(event.target.value)}
              placeholder="Mô tả"
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
              placeholder="ID vị trí"
              min={1}
              required
            />
            <button className="primary-btn" type="submit">
              Tạo vật phẩm
            </button>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
