import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  approvePostApi,
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

  return (
    <AppShell title="Admin Dashboard">
      <section className="status-panel">
        <div className="metric">
          <h4>Total Posts</h4>
          <p>{analytics?.totals?.total_posts ?? 0}</p>
        </div>
        <div className="metric">
          <h4>Return Success Rate</h4>
          <p>{analytics?.returnSuccessRate ?? 0}%</p>
        </div>
        <div className="metric">
          <h4>Total Users</h4>
          <p>{analytics?.totals?.total_users ?? 0}</p>
        </div>
      </section>

      <section className="panel">
        <h3>Pending Post Moderation</h3>
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
                Approve
              </button>
              <button className="danger-btn" onClick={() => moderatePost(post.id, false)}>
                Reject
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="panel split-panel">
        <div>
          <h3>User Management</h3>
          {users.map((entry) => (
            <div key={entry.id} className="row-actions">
              <div>
                <strong>{entry.full_name}</strong>
                <small>
                  {entry.email} | {entry.role}
                </small>
              </div>
              <button
                className="secondary-btn"
                onClick={() => toggleUserLock(entry.id, entry.is_locked === 0)}
              >
                {entry.is_locked ? "Unlock" : "Lock"}
              </button>
            </div>
          ))}
        </div>

        <div>
          <h3>Reports Queue</h3>
          {reports.map((report) => (
            <div key={report.id} className="row-card">
              <strong>{report.reason}</strong>
              <p>{report.details}</p>
              <small>Status: {report.status}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="panel split-panel">
        <div>
          <h3>Warehouse Items</h3>
          {items.map((item) => (
            <div key={item.id} className="row-card">
              <strong>{item.name}</strong>
              <small>
                {item.status} | qty {item.quantity}
              </small>
            </div>
          ))}
        </div>

        <div>
          <h3>Add Warehouse Item</h3>
          <form className="stack-form" onSubmit={handleCreateItem}>
            <input
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              placeholder="Item name"
              required
            />
            <textarea
              value={itemDescription}
              onChange={(event) => setItemDescription(event.target.value)}
              placeholder="Description"
              required
            />
            <input
              type="number"
              value={itemCategoryId}
              onChange={(event) => setItemCategoryId(Number(event.target.value))}
              placeholder="Category ID"
              min={1}
              required
            />
            <input
              type="number"
              value={itemLocationId}
              onChange={(event) => setItemLocationId(Number(event.target.value))}
              placeholder="Location ID"
              min={1}
              required
            />
            <button className="primary-btn" type="submit">
              Create Item
            </button>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
