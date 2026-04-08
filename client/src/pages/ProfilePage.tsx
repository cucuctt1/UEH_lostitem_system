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
    alert("Profile updated");
  }

  return (
    <AppShell title="My Profile">
      <section className="panel">
        <h3>Profile Information</h3>
        <form className="stack-form" onSubmit={handleUpdate}>
          <label>
            Full Name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>
          <label>
            Bio
            <textarea value={bio ?? ""} onChange={(event) => setBio(event.target.value)} />
          </label>
          <p>Email: {user?.email}</p>
          <p>Phone visibility: hidden in public views, available in direct chat context.</p>
          <button className="secondary-btn" type="button" onClick={() => navigate("/my-posts")}>
            Manage My Posts
          </button>
          <button className="primary-btn" type="submit">
            Save Profile
          </button>
        </form>
      </section>

      <section className="panel split-panel">
        <div>
          <h3>Post History</h3>
          {history.posts.map((item) => (
            <div className="row-card" key={item.id}>
              <p>{item.title}</p>
              <small>
                {item.type} / {item.status} / moderation: {item.moderation_status}
              </small>
            </div>
          ))}
        </div>

        <div>
          <h3>Return History</h3>
          {history.returns.map((item) => (
            <div className="row-card" key={item.match_id}>
              <p>Match #{item.match_id}</p>
              <small>Score: {item.score} | Returned at: {item.returned_at || "-"}</small>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
