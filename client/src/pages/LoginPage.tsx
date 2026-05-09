import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const [email, setEmail] = useState("admin@st.ueh.edu.vn");
  const [password, setPassword] = useState("bacon123");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    await login({ email, password });
    navigate("/");
  }

  return (
    <div className="auth-page auth-layout">
      <div className="blob blob-one" />
      <div className="blob blob-two" />

      <section className="auth-side panel" aria-label="Thông tin hệ thống">
        <div className="auth-logo-group">
          <img src="/icon-dark-32x32.png" alt="UEH Lost and Found" className="auth-side-logo" />
          <p className="auth-kicker">Cộng đồng UEH</p>
        </div>
        <h2>Hệ thống Thất lạc & Nhặt được UEH</h2>
        {/* <p className="auth-hint">
          Giao diện mới tối ưu cho tìm kiếm theo #thẻ, vị trí và ngữ cảnh trả lại.
        </p>
        <ul className="auth-feature-list">
          <li>Tạo tài khoản bởi quản trị viên</li>
          <li>Bắt buộc email @st.ueh.edu.vn</li>
          <li>Bảo mật với quy trình đổi mật khẩu lần đầu</li>
        </ul> */}
      </section>

      <form className="auth-card auth-main-card" onSubmit={handleSubmit}>
        <div className="auth-logo-group auth-logo-inline">
          <img src="/icon-dark-32x32.png" alt="UEH Lost and Found" className="auth-inline-logo" />
          <span className="auth-kicker">Đăng nhập bảo mật UEH</span>
        </div>
        <p className="auth-kicker">Cộng đồng UEH</p>
        <h1>Đăng nhập hệ thống</h1>
        {/* <p className="auth-hint">
          Tài khoản mới chỉ được tạo bởi quản trị viên. Email bắt buộc kết thúc bằng @st.ueh.edu.vn.
        </p> */}

        <label>
          Email UEH
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Mật khẩu
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
