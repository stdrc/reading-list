import { Client } from "@notionhq/client";

// 缓存相关变量
let booksCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 1000 * 60 * 10; // 10分钟缓存

// 性能分析
const logPerformance = (message, startTime) => {
  const elapsed = Date.now() - startTime;
  console.log(`[Performance] ${message}: ${elapsed}ms`);
  return Date.now();
};

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
  const overallStart = Date.now();

  // 检查缓存是否有效
  const now = Date.now();
  if (booksCache && lastFetchTime && now - lastFetchTime < CACHE_DURATION) {
    logPerformance("返回缓存数据", overallStart);
    console.log("Using cached books data");
    return booksCache;
  }

  try {
    let timeMarker = overallStart;

    // 初始化Notion客户端
    const notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });
    timeMarker = logPerformance("初始化Notion客户端", timeMarker);

    // 获取数据库ID
    const databaseId = process.env.NOTION_THINGS_DATABASE_ID;

    // 确保环境变量已正确设置
    if (!process.env.NOTION_API_KEY || !databaseId) {
      throw new Error("Missing required环境变量未设置");
    }

    const books = [];
    let startCursor = undefined;
    let hasMore = true;
    let pageCount = 0;

    // 设置每页大小
    const pageSize = 100; // 最大允许的页面大小

    // 处理分页，获取所有结果
    while (hasMore) {
      const queryStart = Date.now();
      pageCount++;

      // 查询数据库，包含分页参数、筛选条件和属性选择
      const response = await notion.databases.query({
        database_id: databaseId,
        start_cursor: startCursor,
        page_size: pageSize,
        // 预先过滤只有形式为"书"的项目
        filter: {
          property: "形式",
          multi_select: {
            contains: "书"
          }
        },
        // 按状态和评价日期排序
        sorts: [
          {
            property: "状态",
            direction: "ascending",
          },
          {
            property: "评价日期",
            direction: "descending",
          }
        ],
        // 只获取我们需要的属性，减少数据传输量
        properties: {
          "名称": {},
          "创作者": {},
          "分类": {},
          "URL": {},
          "状态": {},
          "评价": {},
          "评价日期": {}
        }
      });
      timeMarker = logPerformance(`获取数据库页面 #${pageCount} (${response.results.length}条记录)`, timeMarker);

      // 遍历当前页的所有记录
      const processStart = Date.now();
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
      timeMarker = logPerformance(`处理页面 #${pageCount} 数据`, timeMarker);

      // 更新分页信息
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    // 更新缓存
    booksCache = books;
    lastFetchTime = Date.now();

    logPerformance("总获取和处理时间", overallStart);
    return books;
  } catch (error) {
    console.error("获取书籍记录时出错:", error);
    // 如果有缓存，在出错时返回缓存数据
    if (booksCache) {
      console.log("Error occurred, returning cached data");
      return booksCache;
    }
    return [];
  }
}
