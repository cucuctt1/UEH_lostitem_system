import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useAppStore } from "../store/appStore";
import { AppIcon } from "./AppIcon";

interface AppShellProps {
  title: string;
  children: ReactNode;
}

export function AppShell({ title, children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileViewport, setMobileViewport] = useState<boolean>(window.innerWidth <= 980);
  const unreadCount = useAppStore((state) =>
    state.notifications.filter((item) => item.is_read === 0).length
  );

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      const nextIsMobile = window.innerWidth <= 980;
      setMobileViewport(nextIsMobile);
      if (nextIsMobile) {
        setSidebarCollapsed(false);
      }
      if (!nextIsMobile) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setMobileSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function logoutAndGoLogin(): void {
    logout();
    navigate("/login");
  }

  function toggleSidebar(): void {
    if (mobileViewport) {
      setMobileSidebarOpen((prev) => !prev);
      return;
    }

    setSidebarCollapsed((prev) => !prev);
  }

  const roleLabel = user?.role === "admin" ? "Quản trị viên" : "Người dùng";
  const menuEntries = [
    { to: "/", label: "Bảng tin", icon: "search" as const },
    { to: "/notifications", label: "Thông báo", icon: "bell" as const },
    { to: "/posts/new", label: "Tạo bài đăng", icon: "plus" as const },
    { to: "/my-posts", label: "Bài đăng của tôi", icon: "posts" as const },
    { to: "/profile", label: "Hồ sơ", icon: "user" as const },
    { to: "/chat", label: "Tin nhắn", icon: "mail" as const }
  ];

  return (
    <div className={`app-frame ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <header className="fb-topnav">
        <div className="fb-top-left">
          <button
            className="menu-icon-btn top-menu-btn"
            onClick={toggleSidebar}
            aria-label={mobileSidebarOpen ? "Đóng menu" : "Mở menu"}
            type="button"
          >
            {mobileViewport ? (
              mobileSidebarOpen ? <AppIcon name="close" size={18} /> : <AppIcon name="menu" size={18} />
            ) : sidebarCollapsed ? (
              <AppIcon name="menu" size={18} />
            ) : (
              <AppIcon name="chevron-left" size={18} />
            )}
          </button>

          <button className="brand-lockup" onClick={() => navigate("/")}
            aria-label="Về bảng tin"
            type="button"
          >
            <img src="/icon-dark-32x32.png" alt="UEH Lost and Found" className="brand-logo" />
            <span className="brand-name">UEH Lost and Found</span>
          </button>

          <button className="fb-search-pill" onClick={() => navigate("/?focusSearch=1")} type="button">
            Tìm bài đăng theo tiêu đề, vị trí hoặc #thẻ...
          </button>
        </div>

        <div className="fb-top-right">
          <button className="pill-btn top-user-btn" onClick={() => navigate("/notifications")} type="button">
            Thông báo ({unreadCount})
          </button>
          <span className="top-chip">{roleLabel}</span>
          <button className="pill-btn top-user-btn" onClick={() => navigate("/profile")} type="button">
            {user?.fullName ?? "Người dùng"}
          </button>
          <button className="secondary-btn" onClick={logoutAndGoLogin} type="button">
            Đăng xuất
          </button>
        </div>
      </header>

      <div
        className={`sidebar-overlay ${mobileSidebarOpen ? "visible" : ""}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <aside className={`sidebar ${mobileSidebarOpen ? "open" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-scroll">
          <div>
            <div className="sidebar-brand-line">
              <img src="/icon-dark-32x32.png" alt="UEH" className="sidebar-brand-icon" />
              <div>
                <p className="brand-caption">Cộng đồng UEH</p>
                <h1 className="brand-title">Thất lạc & Nhặt được</h1>
              </div>
            </div>
            <button className="ghost-btn sidebar-toggle-btn" type="button" onClick={toggleSidebar}>
              {mobileViewport ? "Đóng menu" : sidebarCollapsed ? "Mở rộng" : "Thu gọn"}
            </button>

            <div className="sidebar-kpis">
              <span className="kpi-chip">Chưa đọc {unreadCount}</span>
              <span className="kpi-chip">{roleLabel}</span>
            </div>
          </div>

          <nav className="menu">
            {menuEntries.map((entry) => (
              <NavLink key={entry.to} to={entry.to}>
                <span className="menu-icon" aria-hidden="true">
                  <AppIcon name={entry.icon} size={16} />
                </span>
                <span className="menu-label">{entry.label}</span>
              </NavLink>
            ))}

            {user?.role === "admin" && (
              <NavLink to="/admin">
                <span className="menu-icon" aria-hidden="true">
                  <AppIcon name="settings" size={16} />
                </span>
                <span className="menu-label">Quản trị</span>
              </NavLink>
            )}
          </nav>

          <div className="sidebar-footer">
            <button className="secondary-btn" onClick={logoutAndGoLogin} type="button">
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="auth-kicker">Điều hướng nhanh</p>
            <h2>{title}</h2>
          </div>
          <button
            className="menu-icon-btn content-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
            type="button"
          >
            Mở menu
          </button>
        </header>

        <div className="subbar">
          <span className="badge">Vai trò: {roleLabel}</span>
          <span className="badge">Thông báo chưa đọc: {unreadCount}</span>
          <span className="badge">Đăng nhập với: {user?.email}</span>
        </div>

        {children}
      </main>
    </div>
  );
}
