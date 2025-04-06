import { useState, useEffect, useRef, memo } from "react";
import { formatDate } from "../lib/notion-books";
import LoadingSpinner from "./LoadingSpinner";
import styles from "./BookDetail.module.css";
import BookCover from "./BookCover";

// 使用 React.memo 包装组件以避免不必要的重新渲染
const BookDetail = memo(function BookDetail({ book }) {
  const [notionContent, setNotionContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedPageIdRef = useRef(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!book || !book.notionPageId) {
      setLoading(false);
      setError("没有找到书籍页面 ID");
      return;
    }

    if (
      fetchedPageIdRef.current === book.notionPageId ||
      isLoadingRef.current
    ) {
      return;
    }

    const controller = new AbortController(); // 创建 AbortController 用于取消请求

    const fetchNotionContent = async () => {
      try {
        isLoadingRef.current = true;
        setLoading(true);

        console.log("Fetching notion page:", book.notionPageId);
        const response = await fetch(
          `/api/notionPage?pageId=${book.notionPageId}`,
          { signal: controller.signal }, // 使用 signal 以便可以取消请求
        );

        if (!response.ok) {
          throw new Error("获取 Notion 页面内容失败");
        }

        const data = await response.json();

        // 检查组件是否仍然挂载（通过 ref 值是否被清除判断）
        if (controller.signal.aborted) {
          return;
        }

        setNotionContent(data);
        fetchedPageIdRef.current = book.notionPageId;
        setLoading(false);
        isLoadingRef.current = false;
      } catch (err) {
        // 忽略已中止的请求错误
        if (err.name === "AbortError") {
          console.log("Fetch aborted");
          return;
        }

        console.error("获取 Notion 内容错误:", err);
        setError(err.message);
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    fetchNotionContent();

    // 清理函数，在组件卸载或依赖项变化时取消请求
    return () => {
      controller.abort();
      isLoadingRef.current = false;
    };
  }, [book?.notionPageId]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>错误: {error}</div>;
  }

  return (
    <div className={styles.bookDetail}>
      <div className={styles.header}>
        <BookCover book={book} className={styles.detailCover} />

        <div className={styles.info}>
          <h1 className={styles.bookName}>{book.name}</h1>
          <p className={styles.authors}>
            <span className={styles.label}>作者：</span>
            <span className={styles.value}>{book.authors.join(", ")}</span>
          </p>
          {book.category && (
            <p className={styles.category}>
              <span className={styles.label}>分类：</span>
              <span className={styles.value}>{book.category}</span>
            </p>
          )}
          <p className={styles.rating}>
            {book.rating && (
              <>
                <span className={styles.label}>评价：</span>
                <span className={styles.value}>
                  {book.rating}
                  {book.ratingDate &&
                    `（${formatDate(new Date(book.ratingDate))}）`}
                </span>
              </>
            )}
            {!book.rating && book.ratingDate && (
              <>
                <span className={styles.label}>评价日期:</span>
                <span className={styles.value}>
                  {formatDate(new Date(book.ratingDate))}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {notionContent && notionContent.content ? (
        <div className={styles.content}>
          <div
            className={styles.notionContent}
            dangerouslySetInnerHTML={{ __html: notionContent.content }}
          />
        </div>
      ) : notionContent === null ? (
        <div className={styles.content}>
          <div className={styles.noContent}>没有找到内容</div>
        </div>
      ) : null}
    </div>
  );
});

export default BookDetail;
