import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { listNotificationsApi, readNotificationApi } from "../services/api/miscApi";
import { useAppStore } from "../store/appStore";
import { NotificationItem } from "../types";

function formatNotificationTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return value;
  }

  return new Date(timestamp).toLocaleString();
}

function buildNotificationTarget(notification: NotificationItem): { to?: string; label: string } {
  if (notification.reference_type === "conversation" && notification.reference_id) {
    return { to: `/chat?conversationId=${notification.reference_id}`, label: "Mở tin nhắn" };
  }

  if (notification.reference_type === "post" && notification.reference_id) {
    return { to: `/posts/${notification.reference_id}`, label: "Mở bài đăng" };
  }

  if (notification.reference_type === "user" && notification.reference_id) {
    return { to: `/profile?userId=${notification.reference_id}`, label: "Mở hồ sơ" };
  }

  if (notification.type === "new_message" && notification.reference_id) {
    return { to: `/chat?conversationId=${notification.reference_id}`, label: "Mở tin nhắn" };
  }

  if (notification.type === "post_status" && notification.reference_id) {
    return { to: `/posts/${notification.reference_id}`, label: "Mở bài đăng" };
  }

  return { label: "Xem chi tiết" };
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const notifications = useAppStore((state) => state.notifications);
  const setNotifications = useAppStore((state) => state.setNotifications);
  const [loading, setLoading] = useState(true);

  async function loadNotifications(): Promise<void> {
    setLoading(true);
    try {
      const rows = await listNotificationsApi();
      setNotifications(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  const unreadCount = useMemo(() => notifications.filter((item) => item.is_read === 0).length, [notifications]);

  async function openNotification(notification: NotificationItem): Promise<void> {
    if (notification.is_read === 0) {
      await readNotificationApi(notification.id);
      setNotifications(
        notifications.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: 1
              }
            : item
        )
      );
    }

    const target = buildNotificationTarget(notification);
    if (target.to) {
      navigate(target.to);
    }
  }

  return (
    <AppShell title="Thông báo của tôi">
      <section className="panel">
        <div className="composer-header">
          <div>
            <p className="auth-kicker">Trung tâm thông báo</p>
            <h3>{unreadCount} thông báo chưa đọc</h3>
            <p className="hint-text">
              Mở từng thông báo để đi thẳng đến bài đăng, cuộc trò chuyện hoặc hồ sơ liên quan.
            </p>
          </div>
          <button className="secondary-btn" type="button" onClick={() => void loadNotifications()}>
            Làm mới
          </button>
        </div>
      </section>

      <section className="panel">
        {loading && <p>Đang tải thông báo...</p>}

        {!loading && notifications.length === 0 && <p>Bạn chưa có thông báo nào.</p>}

        {!loading && notifications.length > 0 && (
          <div className="stack-form">
            {notifications.map((notification) => {
              const target = buildNotificationTarget(notification);

              return (
                <article key={notification.id} className="row-card notification-card">
                  <div className="notification-head">
                    <div>
                      <strong>{notification.title}</strong>
                      <p>{notification.body}</p>
                    </div>
                    <span className={`badge ${notification.is_read === 0 ? "badge-accent" : ""}`}>
                      {notification.is_read === 0 ? "Chưa đọc" : "Đã đọc"}
                    </span>
                  </div>

                  <div className="notification-footer">
                    <small>{formatNotificationTime(notification.created_at)}</small>
                    <button className="secondary-btn" type="button" onClick={() => void openNotification(notification)}>
                      {target.label}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}