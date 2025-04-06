import ProxiedImage from "./ProxiedImage";
import styles from "./BookCover.module.css";

/**
 * 书籍封面组件，用于显示书籍封面或生成一个带有书名和作者的替代封面
 */
export default function BookCover({ book, className = "" }) {
  return (
    <div className={`${styles.coverContainer} ${className}`}>
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
  );
}
