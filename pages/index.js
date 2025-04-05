import { useState, useEffect, useRef, useCallback } from "react";
import { formatDate } from "../lib/notion-books";

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadTimes, setLoadTimes] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  // 获取图书数据
  const fetchBooks = useCallback(async (cursor = null, shouldAppend = false) => {
    const timeStats = {
      start: performance.now(),
      cacheCheck: 0,
      fetchStart: 0,
      fetchEnd: 0
    };

    try {
      if (!cursor) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // 如果是第一页，先检查缓存
      if (!cursor) {
        const cacheKey = 'books_cache';
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheKey + '_time');

        timeStats.cacheCheck = performance.now();

        // 首先显示缓存数据以提高用户体验
        if (cachedData && cachedTime) {
          const parsedCache = JSON.parse(cachedData);
          setBooks(parsedCache.books || []);
          setHasMore(parsedCache.hasMore || false);
          setNextCursor(parsedCache.nextCursor || null);
          setLastUpdated(new Date(parseInt(cachedTime)));

          // 如果缓存时间少于5分钟，使用缓存并停止加载
          if (Date.now() - parseInt(cachedTime) < 5 * 60 * 1000) {
            setLoading(false);
            timeStats.end = performance.now();
            setLoadTimes({
              total: Math.round(timeStats.end - timeStats.start),
              cacheCheck: Math.round(timeStats.cacheCheck - timeStats.start),
              source: "本地缓存"
            });
            return;
          }
        }
      }

      // 获取最新数据
      timeStats.fetchStart = performance.now();
      const url = `/api/books${cursor ? `?cursor=${cursor}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch books");
      }
      const data = await response.json();
      timeStats.fetchEnd = performance.now();

      // 更新状态
      if (shouldAppend) {
        setBooks(prevBooks => [...prevBooks, ...data.books]);
      } else {
        setBooks(data.books);
      }

      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);

      // 只有首次加载时更新缓存
      if (!cursor) {
        localStorage.setItem('books_cache', JSON.stringify(data));
        localStorage.setItem('books_cache_time', Date.now().toString());
        setLastUpdated(new Date());

        timeStats.end = performance.now();
        setLoadTimes({
          total: Math.round(timeStats.end - timeStats.start),
          cacheCheck: Math.round(timeStats.cacheCheck - timeStats.start),
          apiCall: Math.round(timeStats.fetchEnd - timeStats.fetchStart),
          source: "API请求"
        });
      }

      setLoading(false);
      setLoadingMore(false);
    } catch (err) {
      console.error("Error fetching books:", err);
      setError(err.message);
      setLoading(false);
      setLoadingMore(false);

      timeStats.end = performance.now();
      setLoadTimes({
        total: Math.round(timeStats.end - timeStats.start),
        error: true,
        source: "错误"
      });
    }
  }, []);

  // 首次加载
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // 无限滚动逻辑
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          fetchBooks(nextCursor, true);
        }
      },
      { threshold: 0.5 }
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

  if (loading && books.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        加载图书列表中...
      </div>
    );
  }

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

      {lastUpdated && (
        <p style={{ fontSize: "0.8rem", color: "#666" }}>
          最后更新: {formatDate(lastUpdated)}
          {loading && " (正在刷新...)"}
          {loadTimes && !loading && (
            <span> - 加载耗时: {loadTimes.total}ms (来源: {loadTimes.source})</span>
          )}
        </p>
      )}

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
              .filter(book => book.status === "进行")
              .map((book, index) => (
                <div
                  key={`reading-${index}`}
                  style={{
                    border: "1px solid #eaeaea",
                    borderRadius: "8px",
                    padding: "1.5rem",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  <h2 style={{ marginTop: 0 }}>{book.name}</h2>
                  {book.authors.length > 0 && (
                    <p>作者: {book.authors.join(", ")}</p>
                  )}
                  {book.category && <p>分类: {book.category}</p>}
                  {book.rating && <p>评价: {book.rating}</p>}
                  {book.ratingDate && (
                    <p>评价日期: {formatDate(new Date(book.ratingDate))}</p>
                  )}
                  {book.url && (
                    <p>
                      <a
                        href={book.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#0070f3", textDecoration: "none" }}
                      >
                        查看链接
                      </a>
                    </p>
                  )}
                </div>
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
              .filter(book => book.status === "完成" || book.status === "归档")
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
                <div
                  key={`finished-${index}`}
                  style={{
                    border: "1px solid #eaeaea",
                    borderRadius: "8px",
                    padding: "1.5rem",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  <h2 style={{ marginTop: 0 }}>{book.name}</h2>
                  {book.authors.length > 0 && (
                    <p>作者: {book.authors.join(", ")}</p>
                  )}
                  {book.category && <p>分类: {book.category}</p>}
                  {book.rating && <p>评价: {book.rating}</p>}
                  {book.ratingDate && (
                    <p>评价日期: {formatDate(new Date(book.ratingDate))}</p>
                  )}
                  {book.url && (
                    <p>
                      <a
                        href={book.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#0070f3", textDecoration: "none" }}
                      >
                        查看链接
                      </a>
                    </p>
                  )}
                </div>
              ))}
          </div>

          {/* 加载更多指示器 */}
          {hasMore && (
            <div
              ref={loaderRef}
              style={{
                textAlign: 'center',
                padding: '2rem',
                margin: '2rem 0'
              }}
            >
              {loadingMore ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  style={{
                    animation: 'spin 1s linear infinite',
                    display: 'inline-block'
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
