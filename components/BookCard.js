import { formatDate } from "../lib/notion-books";

export default function BookCard({ book }) {
  return (
    <div
      style={{
        border: "1px solid #eaeaea",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        height: "240px",
        width: "162px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      >
      <div
        style={{
          padding: "1.5rem",
        }}
      >
        <h2 style={{ marginTop: 0 }}>{book.name}</h2>
        <p style={{ marginTop: 0 }}>{book.authors.join(", ")}</p>
      </div>
    </div>
  );
}
