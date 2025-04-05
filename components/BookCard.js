import { formatDate } from "../lib/notion-books";

export default function BookCard({ book }) {
  return (
    <div
      style={{
        border: "1px solid #eaeaea",
        padding: "1.5rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        height: "230px", // 长边是高度
        width: "144px", // 宽高比16:10，高250px对应宽156px
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <h2 style={{ marginTop: 0 }}>{book.name}</h2>
      <p style={{ marginTop: 0 }}>{book.authors.join(", ")}</p>
    </div>
  );
}
