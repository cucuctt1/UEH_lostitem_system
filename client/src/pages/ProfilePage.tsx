import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { apiClient } from "../services/api/client";
import { getMyHistoryApi } from "../services/api/miscApi";
import { useAuthStore } from "../store/authStore";
import { MyHistoryItem } from "../types";

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const initialize = useAuthStore((state) => state.initialize);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [history, setHistory] = useState<MyHistoryItem>({ posts: [], returns: [] });

  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setBio(user?.bio ?? "");
  }, [user]);

  useEffect(() => {
    void getMyHistoryApi().then(setHistory);
  }, []);

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    await apiClient.put("/users/me", { fullName, bio });
    await initialize();
    alert("Đã cập nhật hồ sơ.");
  }

  return (
    <AppShell title="Hồ sơ của tôi">
      <section className="panel">
        <h3>Thông tin cá nhân</h3>
        <form className="stack-form" onSubmit={handleUpdate}>
          <label>
            Họ và tên
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>
          <label>
            Giới thiệu
            <textarea value={bio ?? ""} onChange={(event) => setBio(event.target.value)} />
          </label>
          <p>Email: {user?.email}</p>
          <p>Số điện thoại được ẩn trên bài đăng công khai, chỉ hiển thị trong ngữ cảnh chat hợp lệ.</p>
          <button className="secondary-btn" type="button" onClick={() => navigate("/my-posts")}>
            Quản lý bài đăng của tôi
          </button>
          <button className="ghost-btn" type="button" onClick={() => navigate("/doi-mat-khau")}>
            Đổi mật khẩu
          </button>
          <button className="primary-btn" type="submit">
            Lưu hồ sơ
          </button>
        </form>
      </section>

      <section className="panel split-panel">
        <div>
          <h3>Lịch sử bài đăng</h3>
          {history.posts.map((item) => (
            <div className="row-card" key={item.id}>
              <p>{item.title}</p>
              <small>
                {item.type} / {item.status} / duyệt: {item.moderation_status}
              </small>
            </div>
          ))}
        </div>

        <div>
          <h3>Lịch sử trả lại</h3>
          {history.returns.map((item) => (
            <div className="row-card" key={item.match_id}>
              <p>Kết nối #{item.match_id}</p>
              <small>Điểm: {item.score} | Trả lại lúc: {item.returned_at || "-"}</small>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
