import { useState, useEffect, useRef, useCallback } from "react";
import BookCard from "../components/BookCard";

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  // 获取图书数据
  const fetchBooks = useCallback(async (cursor = null) => {
    try {
      if (!cursor) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // 获取数据
      const url = `/api/books${cursor ? `?cursor=${cursor}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch books");
      }
      const data = await response.json();

      // 更新状态
      setBooks((prevBooks) => cursor ? [...prevBooks, ...data.books] : data.books);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
      setLoading(false);
      setLoadingMore(false);

      return data; // 返回数据以便链式调用
    } catch (err) {
      console.error("Error fetching books:", err);
      setError(err.message);
      setLoading(false);
      setLoadingMore(false);
      throw err; // 抛出错误以便处理
    }
  }, []);

  // 首次加载
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // 无限滚动逻辑
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          fetchBooks(nextCursor);
        }
      },
      { threshold: 0.5 },
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, loading, loadingMore, nextCursor, fetchBooks]);

  if (error && books.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>
        错误: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: "3rem", maxWidth: "656px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "3rem" }}>阿西读书</h1>

      <div>
        <h2 style={{ marginTop: "3rem" }}>读过</h2>

        {loading && books.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              style={{
                animation: "spin 1s linear infinite",
                display: "inline-block",
              }}
            >
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#0070f3"
                strokeWidth="4"
                fill="none"
                strokeDasharray="30 60"
              />
            </svg>
          </div>
        ) : books.length === 0 ? (
          <p>没有找到图书</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "36px",
            }}
          >
            {books.map((book, index) => (
              <BookCard key={`finished-${index}`} book={book} />
            ))}
          </div>
        )}

        {/* 加载更多指示器 */}
        {hasMore && (
          <div
            ref={loaderRef}
            style={{
              textAlign: "center",
              padding: "3rem",
            }}
          >
            {loadingMore ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                style={{
                  animation: "spin 1s linear infinite",
                  display: "inline-block",
                }}
              >
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#0070f3"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="30 60"
                />
              </svg>
            ) : (
              <span>向下滚动加载更多</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
