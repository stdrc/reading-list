import { formatDate } from "../lib/notion-books";
import styles from "./BookCard.module.css";
import ProxiedImage from "./ProxiedImage";

export default function BookCard({ book, onClick }) {
  const handleClick = () => {
    if (onClick) {
      onClick(book);
    }
  };

  return (
    <div className={styles.bookCard} onClick={handleClick}>
      <div className={styles.imageContainer}>
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

            <div className={styles.bookAuthors}>{book.authors.join(", ")}</div>
          </div>
        )}
      </div>

      <div className={styles.bookCardTitle} title={book.name}>
        {book.name}
      </div>
    </div>
  );
}
