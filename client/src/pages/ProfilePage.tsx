import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { apiClient } from "../services/api/client";
import { getMyHistoryApi } from "../services/api/miscApi";
import { getPublicProfileApi } from "../services/api/userApi";
import { useAuthStore } from "../store/authStore";
import { MyHistoryItem, PublicProfileItem } from "../types";

export function ProfilePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const initialize = useAuthStore((state) => state.initialize);
  const viewedUserId = params.get("userId") ? Number(params.get("userId")) : null;
  const isPublicProfile = Boolean(viewedUserId && viewedUserId !== user?.id);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [history, setHistory] = useState<MyHistoryItem>({ posts: [], returns: [] });
  const [publicProfile, setPublicProfile] = useState<PublicProfileItem | null>(null);
  const [loadingPublicProfile, setLoadingPublicProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!isPublicProfile) {
      setFullName(user?.fullName ?? "");
      setBio(user?.bio ?? "");
    }
  }, [user, isPublicProfile]);

  useEffect(() => {
    if (isPublicProfile) {
      if (!viewedUserId) {
        return;
      }

      setLoadingPublicProfile(true);
      void getPublicProfileApi(viewedUserId)
        .then(setPublicProfile)
        .finally(() => setLoadingPublicProfile(false));
      return;
    }

    void getMyHistoryApi().then(setHistory);
  }, [isPublicProfile, viewedUserId]);

  const pageTitle = useMemo(() => {
    if (isPublicProfile && publicProfile) {
      return publicProfile.fullName;
    }

    return "Hồ sơ của tôi";
  }, [isPublicProfile, publicProfile]);

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    if (isPublicProfile) {
      return;
    }

    setProfileMessage(null);
    setUpdatingProfile(true);
    try {
      await apiClient.put("/users/me", { fullName, bio });
      await initialize();
      setProfileMessage({ type: "success", text: "Đã cập nhật hồ sơ thành công." });
    } catch (requestError: any) {
      setProfileMessage({
        type: "error",
        text: requestError?.response?.data?.message ?? "Không thể cập nhật hồ sơ. Vui lòng thử lại."
      });
    } finally {
      setUpdatingProfile(false);
    }
  }

  if (isPublicProfile) {
    return (
      <AppShell title={pageTitle}>
        <section className="panel">
          {loadingPublicProfile && <p>Đang tải hồ sơ công khai...</p>}
          {!loadingPublicProfile && publicProfile && (
            <div className="stack-form">
              <p className="auth-kicker">Hồ sơ công khai</p>
              <h3>{publicProfile.fullName}</h3>
              <p>{publicProfile.bio || "Người dùng này chưa có phần giới thiệu."}</p>
              <p>
                Tham gia từ: {publicProfile.createdAt ? new Date(publicProfile.createdAt).toLocaleString("vi-VN") : "-"}
              </p>
              <button className="secondary-btn" type="button" onClick={() => navigate(-1)}>
                Quay lại
              </button>
            </div>
          )}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title={pageTitle}>
      <section className="panel">
        <h3>Thông tin cá nhân</h3>
        <form className="stack-form" onSubmit={handleUpdate}>
          {profileMessage && (
            <div className={`ui-notice ${profileMessage.type === "error" ? "ui-notice-error" : "ui-notice-success"}`}>
              <p>{profileMessage.text}</p>
            </div>
          )}

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
          <button className="primary-btn" type="submit" disabled={updatingProfile}>
            {updatingProfile ? "Đang lưu..." : "Lưu hồ sơ"}
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
              <button className="ghost-btn" type="button" onClick={() => navigate(`/posts/${item.id}`)}>
                Mở bài đăng
              </button>
            </div>
          ))}
        </div>

        <div>
          <h3>Lịch sử trả lại</h3>
          {history.returns.map((item) => (
            <div className="row-card" key={item.match_id}>
              <p>Kết nối #{item.match_id}</p>
              <small>Điểm: {item.score} | Trả lại lúc: {item.returned_at || "-"}</small>
              <button className="ghost-btn" type="button" onClick={() => navigate(`/posts/${item.lost_post_id}`)}>
                Mở bài thất lạc
              </button>
              <button className="ghost-btn" type="button" onClick={() => navigate(`/posts/${item.found_post_id}`)}>
                Mở bài nhặt được
              </button>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
