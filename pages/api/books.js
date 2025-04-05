import { getBookRecords } from "../../lib/notion-books";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const apiStart = Date.now();

  try {
    // 获取分页参数
    const { pageSize = 50, cursor } = req.query;
    const pageSizeNum = parseInt(pageSize, 10);

    // 获取书籍数据，支持分页
    const { books, hasMore, nextCursor } = await getBookRecords(pageSizeNum, cursor);

    // 将Date对象转换为ISO字符串，以便在JSON中正确序列化
    const serializeStart = Date.now();
    const serializedBooks = books.map((book) => ({
      ...book,
      ratingDate: book.ratingDate ? book.ratingDate.toISOString() : null,
    }));
    console.log(`[Performance] 序列化图书数据: ${Date.now() - serializeStart}ms`);

    // 记录总API处理时间
    console.log(`[Performance] API总响应时间: ${Date.now() - apiStart}ms`);
    console.log(`[Performance] 返回图书数量: ${serializedBooks.length}`);

    // 返回分页数据
    res.status(200).json({
      books: serializedBooks,
      hasMore,
      nextCursor
    });
  } catch (error) {
    console.error("API Error:", error);
    console.log(`[Performance] API错误处理时间: ${Date.now() - apiStart}ms`);
    res.status(500).json({ message: "Failed to fetch books from Notion" });
  }
}
