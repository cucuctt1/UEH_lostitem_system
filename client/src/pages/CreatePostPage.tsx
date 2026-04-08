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
    if (!categoryId || !locationId) {
      alert("Please choose category and location");
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

    await createPostApi(formData);
    navigate("/");
  }

  return (
    <AppShell title="Create Lost/Found Post">
      <section className="panel">
        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            Type
            <select value={type} onChange={(event) => setType(event.target.value as any)}>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </label>

          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={5} />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              minLength={10}
            />
          </label>

          <label>
            Category
            <select value={categoryId} onChange={(event) => setCategoryId(Number(event.target.value))}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Location
            <select value={locationId} onChange={(event) => setLocationId(Number(event.target.value))}>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Time
            <input
              type="datetime-local"
              value={eventTime}
              onChange={(event) => setEventTime(event.target.value)}
              required
            />
          </label>

          <label>
            Tags (space separated, each starts with #)
            <HashtagInputOverlay
              value={tagsText}
              onChange={setTagsText}
              placeholder="#backpack #charger #id-card"
            />
          </label>
          <p className="hint-text">Type # then letters (e.g. #ba) to see overlay tag suggestions.</p>

          <label>
            Contact Note
            <input value={contactNote} onChange={(event) => setContactNote(event.target.value)} />
          </label>

          <label>
            Item Status
            <select value={status} onChange={(event) => setStatus(event.target.value as any)}>
              <option value="searching">Searching</option>
              <option value="found">Found</option>
              <option value="returned">Returned</option>
            </select>
          </label>

          <label>
            Images (multiple)
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setImageFiles(Array.from(event.target.files ?? []).slice(0, 4))}
            />
          </label>
          {imageFiles.length > 0 && (
            <p className="hint-text">Selected {imageFiles.length} image(s) for this post.</p>
          )}

          <button className="primary-btn" type="submit">
            Create Post
          </button>
        </form>
      </section>
    </AppShell>
  );
}
