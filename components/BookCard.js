import { formatDate } from "../lib/notion-books";

export default function BookCard({ book }) {
  return (
    <div
      style={{
        border: "1px solid #eaeaea",
        borderRadius: "8px",
        padding: "1.5rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ marginTop: 0 }}>{book.name}</h2>
      {book.authors.length > 0 && <p>作者: {book.authors.join(", ")}</p>}
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
  );
}
