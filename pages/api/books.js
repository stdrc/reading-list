import { getBookRecords } from "../../lib/notion-books";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const books = await getBookRecords();

    // 将Date对象转换为ISO字符串，以便在JSON中正确序列化
    const serializedBooks = books.map((book) => ({
      ...book,
      ratingDate: book.ratingDate ? book.ratingDate.toISOString() : null,
    }));

    res.status(200).json(serializedBooks);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ message: "Failed to fetch books from Notion" });
  }
}
