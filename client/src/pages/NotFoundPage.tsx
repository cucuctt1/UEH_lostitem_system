import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>404</h1>
        <p>The page you requested does not exist.</p>
        <Link className="primary-btn" to="/">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
