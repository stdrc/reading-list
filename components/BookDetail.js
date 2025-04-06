import { useState, useEffect } from "react";
import { formatDate } from "../lib/notion-books";
import LoadingSpinner from "./LoadingSpinner";
import styles from "./BookDetail.module.css";
import ProxiedImage from "./ProxiedImage";

export default function BookDetail({ book }) {
  const [notionContent, setNotionContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotionContent = async () => {
      try {
        setLoading(true);

        // 检查是否有 notionPageId
        if (!book.notionPageId) {
          throw new Error("找不到有效的 Notion 页面 ID");
        }

        // 调用 API 获取页面内容
        const response = await fetch(
          `/api/notionPage?pageId=${book.notionPageId}`,
        );
        if (!response.ok) {
          throw new Error("获取 Notion 页面内容失败");
        }

        const data = await response.json();
        setNotionContent(data);
        setLoading(false);
      } catch (err) {
        console.error("获取 Notion 内容错误:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (book && book.notionPageId) {
      fetchNotionContent();
    } else {
      setLoading(false);
      setError("没有找到书籍页面 ID");
    }
  }, [book]);

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
        <div className={styles.coverContainer}>
          {book.coverUrl ? (
            <ProxiedImage
              src={book.coverUrl}
              width={135}
              height={200}
              dpr={2}
              alt={book.name}
              className={styles.coverImage}
            />
          ) : (
            <div className={styles.fallbackCover}>
              <div className={styles.bookTitle}>{book.name}</div>
              <div className={styles.bookAuthors}>
                {book.authors.join(", ")}
              </div>
            </div>
          )}
        </div>

        <div className={styles.info}>
          <h1 className={styles.bookName}>{book.name}</h1>
          <p className={styles.authors}>作者: {book.authors.join(", ")}</p>
          {book.category && (
            <p className={styles.category}>分类: {book.category}</p>
          )}
          <p className={styles.rating}>
            {book.rating && `评价: ${book.rating}`}
            {book.rating &&
              book.ratingDate &&
              ` (${formatDate(new Date(book.ratingDate))})`}
            {!book.rating &&
              book.ratingDate &&
              `评价日期: ${formatDate(new Date(book.ratingDate))}`}
          </p>
        </div>
      </div>

      <div className={styles.content}>
        {notionContent ? (
          <div
            className={styles.notionContent}
            dangerouslySetInnerHTML={{ __html: notionContent.content }}
          />
        ) : (
          <div className={styles.noContent}>没有找到内容</div>
        )}
      </div>
    </div>
  );
}
