import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { HashtagInputOverlay } from "../components/HashtagInputOverlay";
import { createPostApi } from "../services/api/postApi";
import { listCategoriesApi, listLocationsApi } from "../services/api/miscApi";
import { Category, Location } from "../types";

export function CreatePostPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [type, setType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [locationId, setLocationId] = useState<number | "">("");
  const [eventTime, setEventTime] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [status, setStatus] = useState<"searching" | "found" | "returned">("searching");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    void Promise.all([listCategoriesApi(), listLocationsApi()]).then(([cats, locs]) => {
      setCategories(cats);
      setLocations(locs);
      if (cats[0]) {
        setCategoryId(cats[0].id);
      }
      if (locs[0]) {
        setLocationId(locs[0].id);
      }
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormMessage(null);
    if (!categoryId || !locationId) {
      setFormMessage({ type: "error", text: "Vui lòng chọn danh mục và vị trí." });
      return;
    }

    const formData = new FormData();
    formData.append("type", type);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("categoryId", String(categoryId));
    formData.append("locationId", String(locationId));
    formData.append("eventTime", new Date(eventTime).toISOString());
    formData.append("tags", tagsText);
    formData.append("contactNote", contactNote);
    formData.append("status", status);

    for (const file of imageFiles) {
      formData.append("images", file);
    }

    setSubmitting(true);
    try {
      await createPostApi(formData);
      setFormMessage({ type: "success", text: "Đăng bài thành công. Đang chuyển về bảng tin..." });
      navigate("/");
    } catch (requestError: any) {
      setFormMessage({
        type: "error",
        text: requestError?.response?.data?.message ?? "Không thể tạo bài đăng. Vui lòng thử lại."
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Tạo bài đăng thất lạc/nhặt được">
      <section className="panel">
        <form className="stack-form" onSubmit={handleSubmit}>
          {formMessage && (
            <div className={`ui-notice ${formMessage.type === "error" ? "ui-notice-error" : "ui-notice-success"}`}>
              <p>{formMessage.text}</p>
            </div>
          )}

          <label>
            Loại bài đăng
            <select value={type} onChange={(event) => setType(event.target.value as any)}>
              <option value="lost">Thất lạc</option>
              <option value="found">Nhặt được</option>
            </select>
          </label>

          <label>
            Tiêu đề
            <input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={5} />
          </label>

          <label>
            Mô tả
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              minLength={10}
            />
          </label>

          <label>
            Danh mục
            <select value={categoryId} onChange={(event) => setCategoryId(Number(event.target.value))}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Vị trí
            <select value={locationId} onChange={(event) => setLocationId(Number(event.target.value))}>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Thời điểm xảy ra
            <input
              type="datetime-local"
              value={eventTime}
              onChange={(event) => setEventTime(event.target.value)}
              required
            />
          </label>

          <label>
            Thẻ (cách nhau bởi khoảng trắng, mỗi thẻ bắt đầu bằng #)
            <HashtagInputOverlay
              value={tagsText}
              onChange={setTagsText}
              placeholder="#ba-lo #sac-dien-thoai #the-sv"
            />
          </label>
          <p className="hint-text">Gõ # và một vài ký tự (vd: #ba) để gợi ý thẻ tự động.</p>

          <label>
            Ghi chú liên hệ
            <input value={contactNote} onChange={(event) => setContactNote(event.target.value)} />
          </label>

          <label>
            Trạng thái vật phẩm
            <select value={status} onChange={(event) => setStatus(event.target.value as any)}>
              <option value="searching">Đang tìm</option>
              <option value="found">Đã tìm thấy</option>
              <option value="returned">Đã trả lại</option>
            </select>
          </label>

          <label>
            Hình ảnh (nhiều ảnh)
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setImageFiles(Array.from(event.target.files ?? []).slice(0, 4))}
            />
          </label>
          {imageFiles.length > 0 && (
            <p className="hint-text">Đã chọn {imageFiles.length} ảnh cho bài đăng này.</p>
          )}

          <button className="primary-btn" type="submit" disabled={submitting}>
            {submitting ? "Đang đăng..." : "Tạo bài đăng"}
          </button>
        </form>
      </section>
    </AppShell>
  );
}
