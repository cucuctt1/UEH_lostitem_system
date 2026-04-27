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
      setAccountMessage("Email phai ket thuc bang @st.ueh.edu.vn.");
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
      setAccountMessage(`Da tao tai khoan: ${result.email}. Nguoi dung se phai doi mat khau khi dang nhap lan dau.`);
      await loadAdminData();
    } catch (error: any) {
      setAccountMessage(error?.response?.data?.message ?? "Khong the tao tai khoan moi.");
    } finally {
      setCreatingAccount(false);
    }
  }

  return (
    <AppShell title="Bang dieu khien quan tri">
      <section className="status-panel">
        <div className="metric">
          <h4>Tong bai dang</h4>
          <p>{analytics?.totals?.total_posts ?? 0}</p>
        </div>
        <div className="metric">
          <h4>Ty le tra lai thanh cong</h4>
          <p>{analytics?.returnSuccessRate ?? 0}%</p>
        </div>
        <div className="metric">
          <h4>Tong nguoi dung</h4>
          <p>{analytics?.totals?.total_users ?? 0}</p>
        </div>
      </section>

      <section className="panel">
        <h3>Cho duyet bai dang</h3>
        {pendingPosts.length === 0 && <p className="hint-text">Khong co bai dang nao dang cho duyet.</p>}
        {pendingPosts.map((post) => (
          <div key={post.id} className="row-actions">
            <div>
              <strong>{post.title}</strong>
              <small>
                {post.type} | {post.status}
              </small>
            </div>
            <div className="button-group">
              <button className="primary-btn" onClick={() => moderatePost(post.id, true)}>
                Duyet
              </button>
              <button className="danger-btn" onClick={() => moderatePost(post.id, false)}>
                Tu choi
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="panel split-panel">
        <div>
          <h3>Quan ly nguoi dung</h3>
          {users.map((entry) => (
            <div key={entry.id} className="row-actions">
              <div>
                <strong>{entry.full_name}</strong>
                <small>
                  {entry.email} | {entry.role}
                </small>
                {entry.must_change_password === 1 && (
                  <p className="hint-text">Can doi mat khau o lan dang nhap dau tien</p>
                )}
              </div>
              <button
                className="secondary-btn"
                onClick={() => toggleUserLock(entry.id, entry.is_locked === 0)}
                disabled={entry.role === "admin"}
              >
                {entry.is_locked ? "Mo khoa" : "Khoa"}
              </button>
            </div>
          ))}

          <h4>Tao tai khoan moi</h4>
          <form className="stack-form" onSubmit={handleCreateAccount}>
            <input
              placeholder="Ho va ten"
              value={accountFullName}
              onChange={(event) => setAccountFullName(event.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email sinh vien (vd: user@st.ueh.edu.vn)"
              value={accountEmail}
              onChange={(event) => setAccountEmail(event.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Mat khau tam thoi"
              value={temporaryPassword}
              onChange={(event) => setTemporaryPassword(event.target.value)}
              minLength={8}
              required
            />
            {accountMessage && <p className="hint-text">{accountMessage}</p>}
            <button className="primary-btn" type="submit" disabled={creatingAccount}>
              {creatingAccount ? "Dang tao..." : "Tao tai khoan nguoi dung"}
            </button>
          </form>
        </div>

        <div>
          <h3>Hang doi bao cao</h3>
          {reports.length === 0 && <p className="hint-text">Chua co bao cao nao.</p>}
          {reports.map((report) => (
            <div key={report.id} className="row-card">
              <strong>{report.reason}</strong>
              <p>{report.details}</p>
              <small>Trang thai: {report.status}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="panel split-panel">
        <div>
          <h3>Vat pham kho luu tru</h3>
          {items.length === 0 && <p className="hint-text">Kho hien chua co vat pham nao.</p>}
          {items.map((item) => (
            <div key={item.id} className="row-card">
              <strong>{item.name}</strong>
              <small>
                {item.status} | so luong {item.quantity}
              </small>
            </div>
          ))}
        </div>

        <div>
          <h3>Them vat pham vao kho</h3>
          <form className="stack-form" onSubmit={handleCreateItem}>
            <input
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              placeholder="Ten vat pham"
              required
            />
            <textarea
              value={itemDescription}
              onChange={(event) => setItemDescription(event.target.value)}
              placeholder="Mo ta"
              required
            />
            <input
              type="number"
              value={itemCategoryId}
              onChange={(event) => setItemCategoryId(Number(event.target.value))}
              placeholder="ID danh muc"
              min={1}
              required
            />
            <input
              type="number"
              value={itemLocationId}
              onChange={(event) => setItemLocationId(Number(event.target.value))}
              placeholder="ID vi tri"
              min={1}
              required
            />
            <button className="primary-btn" type="submit">
              Tao vat pham
            </button>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
