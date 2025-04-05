import { Client } from "@notionhq/client";

// 书籍记录的类型定义
/**
 * @typedef {Object} BookRecord
 * @property {string} name - 书名
 * @property {string[]} authors - 作者列表
 * @property {string} category - 分类
 * @property {string|null} url - URL链接
 * @property {string|null} status - 状态
 * @property {string|null} rating - 评价
 * @property {Date|null} ratingDate - 评价日期
 */

/**
 * 将日期字符串格式化为本地日期字符串
 * @param {Date|null} date - Date对象
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  if (!date) return "未设置";

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 获取所有形式为"书"的记录
 * @returns {Promise<BookRecord[]>} 包含书籍信息的数组
 */
export async function getBookRecords() {
  try {
    // 初始化Notion客户端
    const notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });

    // 获取数据库ID
    const databaseId = process.env.NOTION_THINGS_DATABASE_ID;

    // 确保环境变量已正确设置
    if (!process.env.NOTION_API_KEY || !databaseId) {
      throw new Error("Missing required environment variables");
    }

    const books = [];
    let startCursor = undefined;
    let hasMore = true;

    // 处理分页，获取所有结果
    while (hasMore) {
      // 查询数据库，包含分页参数
      const response = await notion.databases.query({
        database_id: databaseId,
        start_cursor: startCursor,
      });

      // 遍历当前页的所有记录
      for (const page of response.results) {
        // 确保页面具有properties属性
        if (!("properties" in page)) continue;

        const properties = page.properties;

        // 检查形式是否为"书"
        const formField = properties["形式"];
        if (
          formField?.type === "multi_select" &&
          "multi_select" in formField &&
          formField.multi_select.some((item) => item.name === "书")
        ) {
          // 获取书名
          let name = "未命名";
          const titleField = properties["名称"];
          if (
            titleField?.type === "title" &&
            "title" in titleField &&
            Array.isArray(titleField.title) &&
            titleField.title.length > 0 &&
            titleField.title[0].type === "text" &&
            "plain_text" in titleField.title[0]
          ) {
            name = titleField.title[0].plain_text;
          }

          // 获取作者列表
          let authors = [];
          const authorField = properties["创作者"];
          if (
            authorField?.type === "multi_select" &&
            "multi_select" in authorField
          ) {
            authors = authorField.multi_select.map((author) => author.name);
          }

          // 获取分类
          let category = "";
          const categoryField = properties["分类"];
          if (
            categoryField?.type === "formula" &&
            "formula" in categoryField &&
            categoryField.formula.type === "string" &&
            typeof categoryField.formula.string === "string"
          ) {
            category = categoryField.formula.string;
          }

          // 获取URL
          let url = null;
          const urlField = properties["URL"];
          if (urlField?.type === "url" && "url" in urlField) {
            url = urlField.url;
          }

          // 获取状态
          let status = null;
          const statusField = properties["状态"];
          if (
            statusField?.type === "select" &&
            "select" in statusField &&
            statusField.select &&
            "name" in statusField.select
          ) {
            status = statusField.select.name;
          }

          // 获取评价
          let rating = null;
          const ratingField = properties["评价"];
          if (
            ratingField?.type === "select" &&
            "select" in ratingField &&
            ratingField.select &&
            "name" in ratingField.select
          ) {
            rating = ratingField.select.name;
          }

          // 获取评价日期并转换为Date对象
          let ratingDate = null;
          const ratingDateField = properties["评价日期"];
          if (
            ratingDateField?.type === "date" &&
            "date" in ratingDateField &&
            ratingDateField.date &&
            ratingDateField.date.start
          ) {
            // 将字符串日期转换为Date对象
            ratingDate = new Date(ratingDateField.date.start);
          }

          // 添加到结果数组
          books.push({
            name,
            authors,
            category,
            url,
            status,
            rating,
            ratingDate,
          });
        }
      }

      // 更新分页信息
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    return books;
  } catch (error) {
    console.error("获取书籍记录时出错:", error);
    return [];
  }
}
