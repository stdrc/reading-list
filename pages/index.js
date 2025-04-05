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
    <div style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "2rem" }}>阿西读书</h1>

      {books.length === 0 ? (
        <p>没有找到图书</p>
      ) : (
        <div>
          {/* 在读书籍 */}
          <h2 style={{ marginTop: "2rem" }}>在读</h2>
          <div
            style={{
              display: "grid",
              gap: "2rem",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              marginBottom: "3rem",
            }}
          >
            {books
              .filter((book) => book.status === "进行")
              .map((book, index) => (
                <BookCard key={`reading-${index}`} book={book} />
              ))}
          </div>

          {/* 读过的书籍 */}
          <h2 style={{ marginTop: "2rem" }}>读过</h2>
          <div
            style={{
              display: "grid",
              gap: "2rem",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            }}
          >
            {books
              .filter(
                (book) => book.status === "完成" || book.status === "归档",
              )
              .sort((a, b) => {
                // 如果两本书都有ratingDate
                if (a.ratingDate && b.ratingDate) {
                  return new Date(b.ratingDate) - new Date(a.ratingDate);
                }
                // 如果只有a有ratingDate，a排在前面
                if (a.ratingDate) return -1;
                // 如果只有b有ratingDate，b排在前面
                if (b.ratingDate) return 1;
                // 如果都没有ratingDate，保持原顺序
                return 0;
              })
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
                padding: "2rem",
                margin: "2rem 0",
                height: "80px", // 固定高度避免加载状态切换时的布局变化
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
