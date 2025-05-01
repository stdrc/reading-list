import { useState, useEffect, useRef, useCallback } from "react";
import BookCard from "../components/BookCard";
import BookDetail from "../components/BookDetail";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import styles from "./index.module.css";

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("读过");
  const loaderRef = useRef(null);
  const initialFetchDone = useRef(false);

  // 打开书籍详情 Modal
  const openBookDetail = (book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
    // 更新URL参数
    const url = new URL(window.location);
    url.searchParams.set("bookId", book.notionPageId);
    window.history.replaceState({}, "", url);
  };

  // 关闭 Modal
  const closeBookDetail = () => {
    setIsModalOpen(false);
    // 清除URL参数
    const url = new URL(window.location);
    url.searchParams.delete("bookId");
    window.history.replaceState({}, "", url);
  };

  // 获取图书数据
  const fetchBooks = useCallback(
    async (cursor = null) => {
      try {
        if (!cursor) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        // 映射标签为API状态参数
        const status = activeTab === "读过" ? "finished" : "reading";

        // 获取数据
        const url = `/api/books${cursor ? `?cursor=${cursor}` : ""}${
          cursor ? "&" : "?"
        }status=${status}`;
        console.log("Fetching books with URL:", url); // 添加日志帮助调试
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch books");
        }
        const data = await response.json();

        // 更新状态
        setBooks((prevBooks) =>
          cursor ? [...prevBooks, ...data.books] : data.books,
        );
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
    },
    [activeTab],
  );

  // 根据URL参数打开Modal
  const checkUrlParams = useCallback(() => {
    if (typeof window !== "undefined" && books.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const bookId = urlParams.get("bookId");

      if (bookId) {
        const book = books.find((b) => b.notionPageId === bookId);
        if (book) {
          setSelectedBook(book);
          setIsModalOpen(true);
        }
      }
    }
  }, [books]);

  // 切换标签时重新获取数据
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setBooks([]);
      setNextCursor(null);
      setHasMore(false);
      initialFetchDone.current = false; // 重置初始加载标志
    }
  };

  // 仅在首次加载时或标签变更时获取数据
  useEffect(() => {
    if (!initialFetchDone.current) {
      console.log("Initial fetch");
      fetchBooks();
      initialFetchDone.current = true;
    }
  }, [activeTab, fetchBooks]);

  // 仅在 books 变化时检查 URL 参数，不会触发新的 API 调用
  useEffect(() => {
    if (books.length > 0) {
      checkUrlParams();
    }
  }, [books, checkUrlParams]);

  // 无限滚动逻辑
  useEffect(() => {
    // 避免在组件首次渲染时触发额外的请求
    if (!initialFetchDone.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          console.log("Infinite scroll fetch");
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
    return <div className={styles.error}>错误: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>阿西读书</h1>

      <div>
        {/* 标签栏 */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabButton} ${
              activeTab === "读过" ? styles.activeTab : ""
            }`}
            onClick={() => handleTabChange("读过")}
          >
            读过
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "在读" ? styles.activeTab : ""
            }`}
            onClick={() => handleTabChange("在读")}
          >
            在读
          </button>
        </div>

        {loading && books.length === 0 ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner />
          </div>
        ) : books.length === 0 ? (
          <p className={styles.emptyMessage}>没有找到图书</p>
        ) : (
          <div className={styles.booksGrid}>
            {books.map((book, index) => (
              <BookCard
                key={`${activeTab}-${index}`}
                book={book}
                onClick={openBookDetail}
              />
            ))}
          </div>
        )}

        {/* 加载更多指示器 */}
        {hasMore && (
          <div ref={loaderRef} className={styles.loadMore}>
            {loadingMore ? <LoadingSpinner /> : <span>向下滚动加载更多</span>}
          </div>
        )}
      </div>

      {/* 书籍详情 Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeBookDetail}
        title={selectedBook?.name || "书籍详情"}
      >
        {selectedBook && <BookDetail book={selectedBook} />}
      </Modal>

      {/* 页脚版权信息 */}
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} 阿西读书. All rights reserved.</p>
        <p>
          Coded with vibe by <a href="https://github.com/stdrc">stdrc</a> and AI
          agents.
        </p>
      </footer>
    </div>
  );
}
