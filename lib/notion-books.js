import { Client } from "@notionhq/client";

// 书籍记录的类型定义
/**
 * @typedef {Object} BookRecord
 * @property {string|null} notionPageId - Notion 页面 ID
 * @property {string} name - 书名
 * @property {string[]} authors - 作者列表
 * @property {string} category - 分类
 * @property {string|null} url - URL链接
 * @property {string|null} coverUrl - 封面图片 URL
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

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}/${month}/${day}`;
}

/**
 * 获取所有形式为"书"的记录
 * @param {number|null} pageSize - 每页大小，默认50
 * @param {string|null} startCursor - 开始游标，用于分页
 * @param {string[]} statusFilter - 状态过滤，默认为["进行", "完成", "归档"]
 * @returns {Promise<{books: BookRecord[], hasMore: boolean, nextCursor: string|null}>} 包含书籍信息的数组及分页信息
 */
export async function getBookRecords(
  pageSize = 50,
  startCursor = undefined,
  statusFilter = ["完成", "归档"],
) {
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
    let hasMore = false;
    let nextCursor = null;

    // 设置每页大小（最大为100）
    pageSize = Math.min(pageSize || 50, 100); // 确保不超过100

    // 构建状态过滤条件
    const statusConditions = statusFilter.map((status) => ({
      property: "状态",
      select: {
        equals: status,
      },
    }));

    // 查询数据库，包含分页参数、筛选条件和属性选择
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: startCursor,
      page_size: pageSize,
      filter: {
        and: [
          {
            property: "形式",
            multi_select: {
              contains: "书",
            },
          },
          {
            or: statusConditions,
          },
        ],
      },
      sorts: [
        {
          property: "评价日期",
          direction: "descending",
        },
      ],
      // 只获取我们需要的属性，减少数据传输量
      properties: {
        名称: {},
        创作者: {},
        分类: {},
        URL: {},
        "封面 URL": {},
        状态: {},
        评价: {},
        评价日期: {},
      },
    });

    // 遍历当前页的所有记录
    for (const page of response.results) {
      // 确保页面具有properties属性
      if (!("properties" in page)) continue;

      const properties = page.properties;

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

      // 获取封面URL
      let coverUrl = null;
      const coverUrlField = properties["封面 URL"];
      if (coverUrlField?.type === "url" && "url" in coverUrlField) {
        coverUrl = coverUrlField.url;
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

      // 添加到结果数组，包含页面 ID
      books.push({
        notionPageId: page.id, // Notion 页面 ID
        name,
        authors,
        category,
        url,
        coverUrl,
        status,
        rating,
        ratingDate,
      });
    }

    // 更新分页信息
    hasMore = response.has_more;
    nextCursor = response.next_cursor;

    return {
      books,
      hasMore,
      nextCursor,
    };
  } catch (error) {
    console.error("获取书籍记录时出错:", error);
    return {
      books: [],
      hasMore: false,
      nextCursor: null,
    };
  }
}
