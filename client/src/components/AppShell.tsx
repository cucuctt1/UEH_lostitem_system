import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useAppStore } from "../store/appStore";

interface AppShellProps {
  title: string;
  children: ReactNode;
}

export function AppShell({ title, children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const unreadCount = useAppStore((state) =>
    state.notifications.filter((item) => item.is_read === 0).length
  );

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  function logoutAndGoLogin(): void {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-frame">
      <header className="fb-topnav">
        <div className="fb-top-left">
          <button className="menu-icon-btn" onClick={() => setSidebarOpen((prev) => !prev)}>
            ☰
          </button>

          <button className="fb-logo" onClick={() => navigate("/")}> 
            lf
          </button>

          <div className="fb-search-pill" onClick={() => navigate("/")}>Search lost & found posts</div>
        </div>

        <div className="fb-top-right">
          <span className="top-chip">Unread {unreadCount}</span>
          <span className="top-chip">{user?.role}</span>
          <button className="pill-btn" onClick={() => navigate("/profile")}>
            {user?.fullName ?? "Unknown"}
          </button>
          <button className="secondary-btn" onClick={logoutAndGoLogin}>
            Sign Out
          </button>
        </div>
      </header>

      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-scroll">
          <div>
            <p className="brand-caption">Campus DSA</p>
            <h1 className="brand-title">Lost & Found</h1>
          </div>

          <nav className="menu">
            <NavLink to="/">Home Feed</NavLink>
            <NavLink to="/posts/new">Create Post</NavLink>
            <NavLink to="/my-posts">My Posts</NavLink>
            <NavLink to="/profile">Profile</NavLink>
            <NavLink to="/chat">Messenger</NavLink>
            {user?.role === "admin" && <NavLink to="/admin">Admin Studio</NavLink>}
          </nav>

          <div className="sidebar-footer">
            <p className="hint-text">Sidebar stays fixed and overlays on small screens.</p>
            <button className="secondary-btn" onClick={logoutAndGoLogin}>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <h2>{title}</h2>
          <button className="menu-icon-btn content-menu-btn" onClick={() => setSidebarOpen(true)}>
            Menu
          </button>
        </header>

        <div className="subbar">
          <span className="badge">Role: {user?.role}</span>
          <span className="badge">Unread notifications: {unreadCount}</span>
          <span className="badge">Logged in as: {user?.email}</span>
        </div>

        {children}
      </main>
    </div>
  );
}
