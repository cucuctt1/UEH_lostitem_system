import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changeMyPasswordApi } from "../services/api/authApi";
import { useAuthStore } from "../store/authStore";

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const initialize = useAuthStore((state) => state.initialize);
  const logout = useAuthStore((state) => state.logout);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isFirstLogin = useMemo(() => Boolean(user?.mustChangePassword), [user?.mustChangePassword]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    setSubmitting(true);
    try {
      await changeMyPasswordApi({
        currentPassword,
        newPassword
      });
      await initialize();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Đổi mật khẩu thành công.");
      navigate("/");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "Không thể đổi mật khẩu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page auth-layout">
      <div className="blob blob-one" />
      <div className="blob blob-two" />

      <section className="auth-side panel" aria-label="Hướng dẫn bảo mật">
        <div className="auth-logo-group">
          <img src="/icon-dark-32x32.png" alt="UEH Lost and Found" className="auth-side-logo" />
          <p className="auth-kicker">Security First</p>
        </div>
        <h2>Cập nhật thông tin xác thực</h2>
        <p className="auth-hint">
          Mật khẩu mạnh giúp bảo vệ tài khoản và toàn bộ lịch sử bài đăng, nhắn tin, thông báo của bạn.
        </p>
        <ul className="auth-feature-list">
          <li>Tối thiểu 8 ký tự</li>
          <li>Không trùng mật khẩu hiện tại</li>
          <li>Đổi mật khẩu ngay khi có nghi ngờ bị lộ</li>
        </ul>
      </section>

      <form className="auth-card auth-main-card" onSubmit={handleSubmit}>
        <div className="auth-logo-group auth-logo-inline">
          <img src="/icon-dark-32x32.png" alt="UEH Lost and Found" className="auth-inline-logo" />
          <span className="auth-kicker">UEH Account Security</span>
        </div>
        <p className="auth-kicker">Bảo mật tài khoản</p>
        <h1>{isFirstLogin ? "Bắt buộc đổi mật khẩu" : "Đổi mật khẩu"}</h1>
        <p className="auth-hint">
          {isFirstLogin
            ? "Tài khoản mới cần đổi mật khẩu trước khi tiếp tục sử dụng hệ thống."
            : "Cập nhật mật khẩu để bảo vệ tài khoản của bạn."}
        </p>

        <label>
          Mật khẩu hiện tại
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </label>

        <label>
          Mật khẩu mới
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>

        <label>
          Xác nhận mật khẩu mới
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>

        {error && <p className="error-text">{error}</p>}
        {success && <p className="hint-text">{success}</p>}

        <button className="primary-btn" type="submit" disabled={submitting}>
          {submitting ? "Đang cập nhật..." : "Lưu mật khẩu mới"}
        </button>

        <button
          className="ghost-btn"
          type="button"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Đăng xuất
        </button>
      </form>
    </div>
  );
}
