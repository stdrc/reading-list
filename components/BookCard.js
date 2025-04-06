import { formatDate } from "../lib/notion-books";
import styles from "./BookCard.module.css";
import BookCover from "./BookCover";

export default function BookCard({ book, onClick }) {
  const handleClick = () => {
    if (onClick) {
      onClick(book);
    }
  };

  // Get the first Unicode character of the rating if it exists
  const ratingEmoji = book.rating ? Array.from(book.rating)[0] : null;

  return (
    <div className={styles.bookCard} onClick={handleClick}>
      <div className={styles.coverWrapper}>
        <BookCover book={book} className={styles.bookCover} />
        {ratingEmoji && (
          <div className={styles.ratingBadge}>
            {ratingEmoji}
          </div>
        )}
      </div>

      <div className={styles.bookCardTitle} title={book.name}>
        {book.name}
      </div>
    </div>
  );
}
