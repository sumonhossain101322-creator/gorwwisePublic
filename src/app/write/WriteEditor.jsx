"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import "react-quill/dist/quill.snow.css";
import styles from "./writePage.module.css";
import { uploadImageFile } from "@/utils/uploadImage";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <p className={styles.editorLoading}>Loading editor...</p>,
});

const CATEGORIES = ["investing", "personal-finance", "credit-cards", "cryptocurrency", "real-estate", "insurance"];
const CATEGORY_LABELS = {
  investing: "Investing",
  "personal-finance": "Personal Finance",
  "credit-cards": "Credit Cards",
  cryptocurrency: "Cryptocurrency",
  "real-estate": "Real Estate",
  insurance: "Insurance",
};
const STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "In review",
  PUBLISHED: "Published",
  PENDING_DELETE: "Pending delete",
};

const toolbarConfig = {
  toolbar: [
    [{ header: [2, 3] }],
    ["bold", "italic", "underline", "strike"],
    ["blockquote", "code-block"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
};

const formats = [
  "header", "bold", "italic", "underline", "strike",
  "blockquote", "code-block", "list", "link", "image",
];

const imageFilesFromList = (list) => [...(list || [])].filter((file) => file?.type?.startsWith("image/"));
const norm = (html) => (html === "<p><br></p>" ? "" : html);
const plainText = (html) => String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const wordCount = (html) => {
  const text = plainText(html);
  return text ? text.split(" ").filter(Boolean).length : 0;
};
const readingLabel = (html) => `${Math.max(1, Math.ceil(wordCount(html) / 220))} min read`;

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const EMPTY = {
  title: "",
  excerpt: "",
  value: "",
  media: "",
  catSlug: "personal-finance",
};

export default function WriteEditor() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const requestedSlug = useSearchParams().get("slug") || "";

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [catSlug, setCatSlug] = useState("personal-finance");
  const [value, setValue] = useState("");
  const [media, setMedia] = useState("");
  const [baseline, setBaseline] = useState(EMPTY);
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState("");
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editingStatus, setEditingStatus] = useState("");

  const editingSlug = useRef("");
  const editingId = useRef("");
  const toastTimer = useRef(undefined);
  const skipGuard = useRef(false);
  const titleRef = useRef(null);
  const editorRef = useRef(null);
  const coverInputRef = useRef(null);

  const words = useMemo(() => wordCount(value), [value]);
  const readTime = useMemo(() => readingLabel(value), [value]);
  const isAdmin = session?.user?.role === "ADMIN";
  const isEdit = Boolean(editingStatus);
  const locked = editingStatus === "PENDING_DELETE";
  const needsReview = editingStatus === "PUBLISHED" && !isAdmin;
  const slugPreview = isEdit ? editingSlug.current : slugify(title);
  const categoryOptions = CATEGORIES.includes(catSlug) ? CATEGORIES : [catSlug, ...CATEGORIES];
  const authorName = profile?.name?.trim() || session?.user?.name?.trim() || "You";
  const authorImage = profile?.image || session?.user?.image || "";
  const authorTitle = typeof profile?.role === "string" ? profile.role.trim() : "";

  const flash = useCallback((msg, ms = 2500) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), ms);
  }, []);

  const getEditor = () => editorRef.current?.querySelector(".ql-container")?.__quill || null;

  const uploadEditorImage = useCallback(async (file) => {
    setError("");
    setUploading(true);
    setToast("Uploading image...");
    try {
      const url = await uploadImageFile(file);
      flash("Image added to the article");
      return url;
    } catch (err) {
      setError(err?.message || "Image upload failed. Please try again.");
      setToast("");
      return null;
    } finally {
      setUploading(false);
    }
  }, [flash]);
  const uploadEditorImageRef = useRef(uploadEditorImage);
  uploadEditorImageRef.current = uploadEditorImage;

  const insertEditorImages = useCallback(async (files) => {
    for (const file of files) {
      const url = await uploadEditorImageRef.current?.(file);
      const editor = getEditor();
      if (!url || !editor) continue;
      const range = editor.getSelection(true);
      const index = range ? range.index : editor.getLength();
      editor.insertEmbed(index, "image", url, "user");
      editor.setSelection(index + 1, 0);
    }
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: toolbarConfig.toolbar,
      handlers: {
        image() {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/png,image/jpeg,image/webp,image/gif";
          input.click();
          input.onchange = () => {
            const file = input.files?.[0];
            if (file) insertEditorImages([file]);
          };
        },
      },
    },
  }), [insertEditorImages]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return undefined;
    let cancel = false;
    fetch("/api/user")
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => {
        if (!cancel && user) setProfile(user);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return undefined;
    if (!requestedSlug) {
      setTitle(EMPTY.title);
      setExcerpt(EMPTY.excerpt);
      setValue(EMPTY.value);
      setMedia(EMPTY.media);
      setCatSlug(EMPTY.catSlug);
      setBaseline(EMPTY);
      setEditingStatus("");
      setError("");
      editingSlug.current = "";
      editingId.current = "";
      setBooting(false);
      return undefined;
    }
    let cancel = false;
    setBooting(true);
    (async () => {
      const res = await fetch(`/api/dashboard/posts/${encodeURIComponent(requestedSlug)}`);
      if (cancel) return;
      if (!res.ok) {
        setError("That article could not be opened.");
        setBooting(false);
        return;
      }
      const post = await res.json();
      if (cancel) return;
      const next = {
        title: post.title || "",
        excerpt: post.excerpt || "",
        value: post.desc || "",
        media: post.img || "",
        catSlug: post.catSlug || "personal-finance",
      };
      setTitle(next.title);
      setExcerpt(next.excerpt);
      setValue(next.value);
      setMedia(next.media);
      setCatSlug(next.catSlug);
      setBaseline(next);
      setEditingStatus(post.status || "");
      editingSlug.current = post.slug;
      editingId.current = post.id || "";
      setError("");
      setBooting(false);
    })();
    return () => {
      cancel = true;
    };
  }, [status, requestedSlug]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    const wrap = editorRef.current;
    if (!wrap) return undefined;
    let editorEl;
    const onPaste = (event) => {
      const files = imageFilesFromList([...(event.clipboardData?.items || [])].map((item) => item.getAsFile?.()).filter(Boolean));
      if (!files.length) return;
      event.preventDefault();
      event.stopPropagation();
      insertEditorImages(files);
    };
    const onDrop = (event) => {
      const files = imageFilesFromList(event.dataTransfer?.files);
      if (!files.length) return;
      event.preventDefault();
      event.stopPropagation();
      insertEditorImages(files);
    };
    const onDragOver = (event) => {
      const draggingFile = [...(event.dataTransfer?.items || [])].some((item) => item.kind === "file");
      if (!draggingFile) return;
      event.preventDefault();
    };
    const apply = () => {
      const el = wrap.querySelector(".ql-editor");
      if (!el) return false;
      el.setAttribute("aria-label", "Article body");
      el.setAttribute("role", "textbox");
      el.setAttribute("aria-multiline", "true");
      if (editorEl !== el) {
        editorEl?.removeEventListener("paste", onPaste, true);
        editorEl?.removeEventListener("drop", onDrop, true);
        editorEl?.removeEventListener("dragover", onDragOver);
        editorEl = el;
        editorEl.addEventListener("paste", onPaste, true);
        editorEl.addEventListener("drop", onDrop, true);
        editorEl.addEventListener("dragover", onDragOver);
      }
      return true;
    };
    if (!apply()) {
      const mo = new MutationObserver(() => {
        if (apply()) mo.disconnect();
      });
      mo.observe(wrap, { childList: true, subtree: true });
      return () => {
        mo.disconnect();
        editorEl?.removeEventListener("paste", onPaste, true);
        editorEl?.removeEventListener("drop", onDrop, true);
        editorEl?.removeEventListener("dragover", onDragOver);
      };
    }
    return () => {
      editorEl?.removeEventListener("paste", onPaste, true);
      editorEl?.removeEventListener("drop", onDrop, true);
      editorEl?.removeEventListener("dragover", onDragOver);
    };
  }, [insertEditorImages, status, booting]);

  const dirty =
    title !== baseline.title ||
    excerpt !== baseline.excerpt ||
    norm(value) !== norm(baseline.value) ||
    media !== baseline.media ||
    catSlug !== baseline.catSlug;

  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (event) => {
      if (skipGuard.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const onCoverPick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    setToast("Uploading cover...");
    try {
      const url = await uploadImageFile(file);
      setMedia(url);
      flash("Cover image uploaded");
    } catch (err) {
      setError(err?.message || "Image upload failed. Please try again.");
      setToast("");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (draft) => {
    if (saving || locked) return;
    setError("");

    const postSlug = slugify(title);
    if (!title.trim()) {
      setError("Add a title before saving.");
      titleRef.current?.focus();
      return;
    }
    if (!postSlug) {
      setError("Use a title with letters or numbers so the article has an address.");
      titleRef.current?.focus();
      return;
    }

    const clean = norm(value);
    const text = plainText(clean);
    const hasImage = /<img\b/i.test(clean);
    if (!text && !hasImage) {
      setError("Write the article, or add an image, before saving.");
      return;
    }
    if (uploading) {
      setError("Wait for the image upload to finish.");
      return;
    }

    const editing = Boolean(editingId.current || editingSlug.current);
    try {
      setSaving(draft ? "draft" : "publish");
      setToast(draft ? "Saving draft..." : isAdmin ? "Publishing..." : "Submitting for review...");

      const res = await fetch(editing ? `/api/posts/${editingId.current || editingSlug.current}` : "/api/posts", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim(),
          desc: clean,
          img: media,
          slug: editing ? editingSlug.current || postSlug : postSlug,
          catSlug,
          draft,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not save this article.");
      if (!json.slug) throw new Error("The article saved, but no address was returned.");

      skipGuard.current = true;
      router.push(json.pending || json.status !== "PUBLISHED" ? "/dashboard/writer" : `/posts/${json.slug}`);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setToast("");
    } finally {
      setSaving("");
    }
  };

  if (status === "loading" || status === "unauthenticated" || booting) {
    return <div className={styles.loading}>Loading the editor...</div>;
  }

  const publishLabel = saving === "publish" ? "Saving..." : isAdmin ? "Publish" : "Submit for review";

  return (
    <div className={styles.page}>
      <div className={styles.bar}>
        <div className={styles.barCopy}>
          <p className={styles.kicker}>{isEdit ? STATUS_LABELS[editingStatus] || "Editing" : "New article"}</p>
          <p className={styles.dek}>
            {isAdmin
              ? "Publishing puts this article live immediately."
              : "Submitting sends the article to an admin. A draft stays private."}
          </p>
        </div>
        <div className={styles.barActions}>
          <Link href="/dashboard/writer" className={styles.textLink}>Your posts</Link>
          <button type="button" className={styles.draftBtn} onClick={() => handleSubmit(true)} disabled={Boolean(saving) || uploading || locked}>
            {saving === "draft" ? "Saving..." : "Save draft"}
          </button>
          <button type="button" className={styles.publish} onClick={() => handleSubmit(false)} disabled={Boolean(saving) || uploading || locked} aria-busy={saving === "publish"}>
            {publishLabel}
          </button>
        </div>
      </div>

      {needsReview ? (
        <p className={styles.reviewWarning} role="status">
          This article is live. Saving sends your changes to an admin, and the published version stays as it is until they approve.
        </p>
      ) : null}
      {locked ? (
        <p className={styles.reviewWarning} role="status">
          This article is waiting to be deleted, so it cannot be edited.
        </p>
      ) : null}
      {error ? <p className={styles.errorText} role="alert">{error}</p> : null}

      <div className={styles.layout}>
        <div className={styles.sheet}>
          <div className={`${styles.cover} ${media ? styles.coverFilled : ""}`}>
            {media ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media} alt={title.trim() ? `Cover for ${title.trim()}` : "Cover image"} className={styles.coverImage} />
            ) : (
              <div className={styles.coverEmpty}>
                <p>Add a cover image</p>
                <span>Shown at the top of the article. PNG, JPG, WEBP, or GIF, up to 10 MB.</span>
              </div>
            )}
            <div className={styles.coverActions}>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className={styles.srOnly}
                onChange={onCoverPick}
              />
              <button type="button" className={styles.coverBtn} onClick={() => coverInputRef.current?.click()} disabled={uploading || locked}>
                {uploading ? "Uploading..." : media ? "Replace cover" : "Upload cover"}
              </button>
              {media ? (
                <button type="button" className={styles.coverBtn} onClick={() => setMedia("")} disabled={uploading || locked}>
                  Remove
                </button>
              ) : null}
            </div>
          </div>

          <input
            ref={titleRef}
            type="text"
            className={styles.title}
            value={title}
            maxLength={180}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Article title"
            aria-label="Article title"
            autoComplete="off"
          />

          <label className={styles.excerptField}>
            <span>Excerpt</span>
            <textarea
              value={excerpt}
              maxLength={300}
              rows={3}
              placeholder="A short summary for search results and article cards. Optional."
              onChange={(event) => setExcerpt(event.target.value)}
            />
            <em>{excerpt.length}/300</em>
          </label>

          <div className={styles.editorWrap} ref={editorRef}>
            <ReactQuill
              theme="snow"
              value={value}
              onChange={setValue}
              placeholder="Tell the story..."
              modules={modules}
              formats={formats}
            />
          </div>
        </div>

        <aside className={styles.rail}>
          <section className={styles.card}>
            <h2>Details</h2>
            <label className={styles.field}>
              Category
              <select aria-label="Category" value={catSlug} onChange={(event) => setCatSlug(event.target.value)} disabled={locked}>
                {categoryOptions.map((slug) => (
                  <option key={slug} value={slug}>{CATEGORY_LABELS[slug] || slug}</option>
                ))}
              </select>
            </label>
            <p className={styles.metaLine}><span>Length</span><strong>{words} {words === 1 ? "word" : "words"}</strong></p>
            <p className={styles.metaLine}><span>Reading time</span><strong>{readTime}</strong></p>
            <p className={styles.metaLine}><span>Address</span><strong>{slugPreview ? `/posts/${slugPreview}` : "Add a title"}</strong></p>
          </section>

          <section className={styles.card}>
            <h2>Publishing as</h2>
            <div className={styles.author}>
              {authorImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={authorImage} alt="" className={styles.avatar} />
              ) : (
                <span className={styles.avatarFallback} aria-hidden="true">{authorName.charAt(0).toUpperCase()}</span>
              )}
              <div>
                <p className={styles.authorName}>{authorName}</p>
                {authorTitle ? <p className={styles.authorTitle}>{authorTitle}</p> : null}
              </div>
            </div>
            <p className={styles.hint}>
              Readers see this name on the article. You can change it from Update on your profile.
            </p>
          </section>
        </aside>
      </div>

      <div role="status" aria-live="polite" className={`${styles.status} ${toast ? styles.statusVisible : ""}`}>
        {toast}
      </div>
    </div>
  );
}
