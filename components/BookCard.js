import { formatDate } from "../lib/notion-books";
import { CHINESE_SANS_FONT_FAMILY } from "../lib/constants";

export default function BookCard({ book }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.8rem",
        width: "135px",
        fontFamily: CHINESE_SANS_FONT_FAMILY,
      }}
    >
      <div
        style={{
          border: "1px solid #eaeaea",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          height: "200px",
          width: "100%",
          overflow: "hidden",
          display: "flex",
        }}
      >
        {book.coverUrl ? (
          <img
            src={`https://wsrv.nl/?url=${book.coverUrl}&w=135&h=200`}
            alt={book.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              padding: "2rem 1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              overflow: "hidden",
              alignItems: "flex-end",
              textAlign: "end",
            }}
          >
            <div
              style={{
                fontSize: "15px",
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
        )}
      </div>

      <div
        style={{
          width: "100%",
          fontSize: "15px",
          fontWeight: "bold",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={book.name}
      >
        {book.name}
      </div>
    </div>
  );
}
