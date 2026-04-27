import { MatchItem, NotificationItem } from "../types";

interface StatusPanelProps {
  matches: MatchItem[];
  notifications: NotificationItem[];
}

export function StatusPanel({ matches, notifications }: StatusPanelProps) {
  const unread = notifications.filter((item) => item.is_read === 0).length;

  return (
    <section className="status-panel">
      <div className="metric">
        <h4>Thông báo chưa đọc</h4>
        <p>{unread}</p>
      </div>
      <div className="metric">
        <h4>Gợi ý đang hoạt động</h4>
        <p>{matches.filter((match) => match.status === "suggested").length}</p>
      </div>
      <div className="metric">
        <h4>Đã trả lại</h4>
        <p>{matches.filter((match) => match.status === "returned").length}</p>
      </div>
    </section>
  );
}
