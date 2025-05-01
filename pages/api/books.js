import { getBookRecords } from "../../lib/notion-books";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // 获取分页参数和状态参数
    const { pageSize = 50, cursor, status = "finished" } = req.query;
    const pageSizeNum = parseInt(pageSize, 10);

    // 将status参数映射到Notion状态
    let statusFilterArray;
    switch (status) {
      case "reading":
        statusFilterArray = ["进行"];
        break;
      case "finished":
      default:
        statusFilterArray = ["完成", "归档"];
        break;
    }

    // 获取书籍数据，支持分页
    const { books, hasMore, nextCursor } = await getBookRecords(
      pageSizeNum,
      cursor,
      statusFilterArray,
    );

    // 将Date对象转换为ISO字符串，以便在JSON中正确序列化
    const serializedBooks = books.map((book) => ({
      ...book,
      ratingDate: book.ratingDate ? book.ratingDate.toISOString() : null,
    }));

    // 返回分页数据
    res.status(200).json({
      books: serializedBooks,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ message: "Failed to fetch books from Notion" });
  }
}
