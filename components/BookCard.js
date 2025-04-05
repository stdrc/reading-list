import { formatDate } from "../lib/notion-books";

export default function BookCard({ book }) {
  // 文本单行省略样式
  const ellipsisStyle = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "100%"
  };

  return (
    <div
      style={{
        border: "1px solid #eaeaea",
        borderRadius: "8px",
        padding: "1.5rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        height: "250px", // 长边是高度
        width: "156px", // 宽高比16:10，高250px对应宽156px
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <h2 style={{ marginTop: 0, ...ellipsisStyle }}>{book.name}</h2>
    </div>
  );
}
