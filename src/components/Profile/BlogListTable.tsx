'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BsTrash, BsPencil, BsSearch, BsStar, BsStarFill } from 'react-icons/bs';
import styles from './BlogListTable.module.css';

const STATUS_STYLE = {
  Live: { backgroundColor: '#d1fae5', color: '#065f46' },
  Draft: { backgroundColor: '#fef3c7', color: '#92400e' },
  Pending: { backgroundColor: '#e0e7ff', color: '#3730a3' },
  Removed: { backgroundColor: '#fee2e2', color: '#991b1b' },
};

const CATEGORY_COLORS = ['#059669', '#0f172a', '#2563eb', '#0f766e', '#d4a017', '#7c3aed'];

const categoryColor = (name) => {
  const total = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return CATEGORY_COLORS[total % CATEGORY_COLORS.length];
};

export default function BlogListTable({ posts }) {
  const router = useRouter();
  const pageSize = posts?.pageSize || 6;
  const [items, setItems] = useState(posts?.items || []);
  const [total, setTotal] = useState(posts?.total || 0);
  const [page, setPage] = useState(posts?.page || 1);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('date');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), q: query, sort });
        const res = await fetch(`/api/dashboard/posts?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Could not load posts.');
        setItems(json.items || []);
        setTotal(json.total || 0);
      } catch (err) {
        setError(err.message || 'Could not load posts.');
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [page, query, sort]);

  const toggleEditorPick = async (slug: string, picked: boolean) => {
    setError('');
    const res = await fetch(`/api/dashboard/posts/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editorPick: !picked }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.message || "Could not update Editor's Pick.");
      return;
    }
    setItems((current) =>
      current.map((item) => (item.slug === slug ? { ...item, editorPick: !picked } : item)),
    );
    router.refresh();
  };

  const removePost = async (slug) => {
    if (!window.confirm('Delete this post?')) return;
    setError('');
    const res = await fetch(`/api/dashboard/posts/${slug}`, { method: 'DELETE' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.message || 'Could not delete that post.');
      return;
    }
    setItems((current) => current.filter((item) => item.slug !== slug));
    setTotal((current) => Math.max(0, current - 1));
    router.refresh();
  };

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 5);

  return (
    <div className={styles.card} id="blog-list">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>Blog list</h3>
          <span className={styles.badge}>{total}</span>
        </div>
        <Link href="/write" className={styles.addBtn}>Add New</Link>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search"
            className={styles.searchInput}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
          <BsSearch className={styles.searchIcon} />
        </div>
        <div className={styles.sortBox}>
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            <option value="date">Date</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Blog Name</th>
              <th>Author Name</th>
              <th>Published Date</th>
              <th>Categories</th>
              <th>Status</th>
              <th>Pick</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7}>{loading ? 'Loading...' : 'No posts yet.'}</td>
              </tr>
            )}
            {items.map((blog) => {
              const statusStyle = STATUS_STYLE[blog.status] || STATUS_STYLE.Draft;
              return (
                <tr key={blog.id}>
                  <td className={styles.blogName}>{blog.name}</td>
                  <td>{blog.author}</td>
                  <td>{blog.date}</td>
                  <td>
                    <span className={styles.category} style={{ backgroundColor: categoryColor(blog.category) }}>
                      <span className={styles.dot} />
                      {blog.category}
                    </span>
                  </td>
                  <td>
                    <span className={styles.status} style={statusStyle}>
                      {blog.status}
                    </span>
                  </td>
                  <td>
                    {blog.status === 'Live' ? (
                      <button
                        type="button"
                        className={styles.actionBtn}
                        aria-label={blog.editorPick ? "Remove from Editor's Pick" : "Add to Editor's Pick"}
                        title={blog.editorPick ? "Remove from Editor's Pick" : "Add to Editor's Pick (max 4)"}
                        onClick={() => toggleEditorPick(blog.slug, Boolean(blog.editorPick))}
                      >
                        {blog.editorPick ? <BsStarFill /> : <BsStar />}
                      </button>
                    ) : (
                      <span className={styles.mutedPick}>—</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button type="button" className={styles.actionBtn} aria-label={`Delete ${blog.name}`} onClick={() => removePost(blog.slug)}>
                        <BsTrash />
                      </button>
                      <Link href={`/write?slug=${blog.slug}`} className={styles.actionBtn} aria-label={`Edit ${blog.name}`}>
                        <BsPencil />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={styles.pagination}>
        <span className={styles.showing}>
          {loading ? 'Loading...' : `Showing ${start} to ${end} of ${total} entries`}
        </span>
        <div className={styles.pager}>
          <button type="button" className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Prev</button>
          {pageNumbers.map((number) => (
            <button
              type="button"
              key={number}
              className={`${styles.pageBtn} ${number === page ? styles.active : ''}`}
              onClick={() => setPage(number)}
            >
              {number}
            </button>
          ))}
          <button type="button" className={styles.pageBtn} disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
