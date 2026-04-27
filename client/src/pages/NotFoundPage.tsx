import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>404</h1>
        <p>Trang bạn yêu cầu không tồn tại.</p>
        <Link className="primary-btn" to="/">
          Quay về trang chủ
        </Link>
      </div>
    </div>
  );
}
