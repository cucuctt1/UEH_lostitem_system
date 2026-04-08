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
        <h4>Unread Notifications</h4>
        <p>{unread}</p>
      </div>
      <div className="metric">
        <h4>Active Suggestions</h4>
        <p>{matches.filter((match) => match.status === "suggested").length}</p>
      </div>
      <div className="metric">
        <h4>Returned Matches</h4>
        <p>{matches.filter((match) => match.status === "returned").length}</p>
      </div>
    </section>
  );
}
