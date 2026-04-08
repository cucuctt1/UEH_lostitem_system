import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { HashtagInputOverlay } from "../components/HashtagInputOverlay";
import { PostMediaGallery } from "../components/PostMediaGallery";
import { deletePostApi, getPostApi, updatePostApi } from "../services/api/postApi";
import { createReportApi } from "../services/api/miscApi";
import { PostItem } from "../types";
import { useAuthStore } from "../store/authStore";

export function PostDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAuthStore((state) => state.user);

  const [post, setPost] = useState<PostItem | null>(null);
  const [reportReason, setReportReason] = useState<"spam" | "fraud" | "abuse" | "unsafe" | "other">(
    "other"
  );
  const [reportDetails, setReportDetails] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"searching" | "found" | "returned">("searching");
  const [editTags, setEditTags] = useState("");
  const [editContactNote, setEditContactNote] = useState("");
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!id) {
      return;
    }
    void getPostApi(Number(id)).then((result) => {
      setPost(result);
      setEditTitle(result.title);
      setEditDescription(result.description);
      setEditStatus(result.status);
      setEditTags(result.tags.map((tag) => `#${tag}`).join(" "));
      setEditContactNote(result.contactNote || "");
    });
  }, [id]);

  async function handleReport(event: FormEvent) {
    event.preventDefault();
    if (!post) {
      return;
    }

    await createReportApi({
      targetPostId: post.id,
      reason: reportReason,
      details: reportDetails
    });

    setReportDetails("");
    alert("Report submitted");
  }

  async function handleOwnerUpdate(event: FormEvent) {
    event.preventDefault();
    if (!post) {
      return;
    }

    const formData = new FormData();
    formData.append("title", editTitle);
    formData.append("description", editDescription);
    formData.append("status", editStatus);
    formData.append("tags", editTags);
    formData.append("contactNote", editContactNote);
    for (const file of editImageFiles) {
      formData.append("images", file);
    }

    await updatePostApi(post.id, formData);
    const refreshed = await getPostApi(post.id);
    setPost(refreshed);
    setEditImageFiles([]);
    alert("Post updated");
  }

  async function handleOwnerDelete() {
    if (!post) {
      return;
    }

    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) {
      return;
    }

    await deletePostApi(post.id);
    navigate("/");
  }

  if (!post) {
    return (
      <AppShell title="Post Detail">
        <p>Loading post...</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Post Detail">
      <article className="panel post-detail">
        <div className="post-top">
          <span className={`chip chip-${post.type}`}>{post.type.toUpperCase()}</span>
          <span className="chip">{post.status}</span>
          <span className={`chip moderation-${post.moderationStatus}`}>{post.moderationStatus}</span>
        </div>
        <h3>{post.title}</h3>
        <p>{post.description}</p>

        <ul className="detail-list">
          <li>Category: {post.categoryName}</li>
          <li>Location: {post.locationName}</li>
          <li>Time: {new Date(post.eventTime).toLocaleString()}</li>
          <li>Posted by: {post.owner?.fullName}</li>
          <li>Contact note: {post.contactNote || "No note"}</li>
          <li>Phone policy: phone is hidden and only shown in private chat.</li>
        </ul>

        <PostMediaGallery post={post} />

        {user?.id !== post.userId && (
          <button
            className="primary-btn"
            onClick={() => navigate(`/chat?postId=${post.id}&receiverId=${post.userId}`)}
          >
            Start Chat With Owner
          </button>
        )}

        {user?.id === post.userId && (
          <form className="stack-form" onSubmit={handleOwnerUpdate}>
            <h4>Edit My Post</h4>
            <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} required />
            <textarea
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              required
            />
            <select value={editStatus} onChange={(event) => setEditStatus(event.target.value as any)}>
              <option value="searching">Searching</option>
              <option value="found">Found</option>
              <option value="returned">Returned</option>
            </select>
            <HashtagInputOverlay
              value={editTags}
              onChange={setEditTags}
              placeholder="#backpack #charger"
            />
            <p className="hint-text">Type # then letters (e.g. #ba) to see overlay suggestions.</p>
            <input
              placeholder="Contact note"
              value={editContactNote}
              onChange={(event) => setEditContactNote(event.target.value)}
            />
            <label>
              Replace/Add Images
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => setEditImageFiles(Array.from(event.target.files ?? []).slice(0, 4))}
              />
            </label>
            {editImageFiles.length > 0 && (
              <p className="hint-text">Selected {editImageFiles.length} image(s) for update.</p>
            )}
            <div className="button-group">
              <button className="primary-btn" type="submit">
                Save Changes
              </button>
              <button className="danger-btn" type="button" onClick={handleOwnerDelete}>
                Delete Post
              </button>
            </div>
          </form>
        )}
      </article>

      <section className="panel">
        <h3>Report This Post/User</h3>
        <form onSubmit={handleReport} className="stack-form">
          <select value={reportReason} onChange={(event) => setReportReason(event.target.value as any)}>
            <option value="spam">Spam</option>
            <option value="fraud">Fraud</option>
            <option value="abuse">Abuse</option>
            <option value="unsafe">Unsafe</option>
            <option value="other">Other</option>
          </select>
          <textarea
            value={reportDetails}
            onChange={(event) => setReportDetails(event.target.value)}
            required
            placeholder="Describe the issue"
          />
          <button className="secondary-btn" type="submit">
            Submit Report
          </button>
        </form>
      </section>
    </AppShell>
  );
}
