import { formatDate } from "../lib/notion-books";
import styles from "./BookCard.module.css";
import BookCover from "./BookCover";

export default function BookCard({ book, onClick }) {
  const handleClick = () => {
    if (onClick) {
      onClick(book);
    }
  };

  return (
    <div className={styles.bookCard} onClick={handleClick}>
      <BookCover book={book} className={styles.bookCover} />

      <div className={styles.bookCardTitle} title={book.name}>
        {book.name}
      </div>
    </div>
  );
}
