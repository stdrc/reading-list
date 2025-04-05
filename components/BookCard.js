import { formatDate } from "../lib/notion-books";

export default function BookCard({ book }) {
  return (
    <div
      style={{
        border: "1px solid #eaeaea",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        height: "200px",
        width: "135px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "2rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          overflow: "hidden",
          alignItems: "flex-end",
          textAlign: "end",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {book.name}
        </div>

        <div
          style={{
            marginTop: 0,
            fontSize: "13px",
          }}
        >
          {book.authors.join(", ")}
        </div>
      </div>
    </div>
  );
}
