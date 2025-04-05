import { useState, useEffect } from "react";
import { formatDate } from "../lib/notion-books";

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const response = await fetch("/api/books");
        if (!response.ok) {
          throw new Error("Failed to fetch books");
        }
        const data = await response.json();
        setBooks(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching books:", err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchBooks();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        加载图书列表中...
      </div>
    );
  }

  if (error) {
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
              .filter(book => book.status === "进行")
              .map((book, index) => (
                <div
                  key={index}
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
                  key={index}
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
        </div>
      )}
    </div>
  );
}
