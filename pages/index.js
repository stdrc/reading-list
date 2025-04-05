import { useState, useEffect, useRef, useCallback } from "react";
import { formatDate } from "../lib/notion-books";
import BookCard from "../components/BookCard";

export default function Home({
  initialBooks,
  initialNextCursor,
  initialHasMore,
}) {
  const [books, setBooks] = useState(initialBooks || []);
  const [loading, setLoading] = useState(!initialBooks);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
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
      setBooks((prevBooks) => [...prevBooks, ...data.books]);

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

  // 首次加载 - 只有在没有初始数据时才执行
  useEffect(() => {
    if (!initialBooks) {
      fetchBooks();
    }
  }, [fetchBooks, initialBooks]);

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
    <div style={{ padding: "3rem", maxWidth: "764px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "3rem" }}>阿西读书</h1>

      {books.length === 0 ? (
        <p>没有找到图书</p>
      ) : (
        <div>
          <h2 style={{ marginTop: "3rem" }}>读过</h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "36px",
            }}
          >
            {books
              .map((book, index) => (
                <BookCard key={`finished-${index}`} book={book} />
              ))}
          </div>

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
      )}
    </div>
  );
}

// 添加服务端数据预加载
export async function getServerSideProps() {
  try {
    // 在服务端调用相同的API路由
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = process.env.VERCEL_URL || "localhost:3000";
    const url = `${protocol}://${host}/api/books`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch books");
    }

    const data = await response.json();

    return {
      props: {
        initialBooks: data.books,
        initialNextCursor: data.nextCursor,
        initialHasMore: data.hasMore,
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      props: {
        initialBooks: [],
        initialNextCursor: null,
        initialHasMore: false,
      },
    };
  }
}
