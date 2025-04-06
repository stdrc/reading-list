import { Client } from "@notionhq/client";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // 从请求参数获取页面 ID
  const { pageId } = req.query;

  if (!pageId) {
    return res.status(400).json({ message: "Missing pageId parameter" });
  }

  try {
    // 初始化 Notion 客户端
    const notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });

    // 确保环境变量已正确设置
    if (!process.env.NOTION_API_KEY) {
      throw new Error("Missing NOTION_API_KEY environment variable");
    }

    // 获取页面内容
    const [pageResponse, blocksResponse] = await Promise.all([
      // 1. 获取页面基本信息
      notion.pages.retrieve({ page_id: pageId }),

      // 2. 获取页面块内容
      notion.blocks.children.list({
        block_id: pageId,
        page_size: 100, // 获取最多 100 个块
      }),
    ]);

    // 提取页面标题和内容
    const pageTitle = getPageTitle(pageResponse);
    const blocks = blocksResponse.results;

    // 将 Notion 块转换为 HTML
    const htmlContent = await blocksToHtml(blocks, notion);

    // 返回页面内容
    res.status(200).json({
      title: pageTitle,
      content: htmlContent,
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      message: "Failed to fetch Notion page",
      error: error.message
    });
  }
}

// 从页面响应中提取标题
function getPageTitle(pageResponse) {
  if (
    pageResponse.properties &&
    pageResponse.properties.title &&
    pageResponse.properties.title.title &&
    Array.isArray(pageResponse.properties.title.title) &&
    pageResponse.properties.title.title.length > 0
  ) {
    return pageResponse.properties.title.title[0].plain_text;
  }

  // 尝试获取名称属性
  if (
    pageResponse.properties &&
    pageResponse.properties.Name &&
    pageResponse.properties.Name.title &&
    Array.isArray(pageResponse.properties.Name.title) &&
    pageResponse.properties.Name.title.length > 0
  ) {
    return pageResponse.properties.Name.title[0].plain_text;
  }

  // 如果找不到标题，返回默认值
  return "Untitled";
}

// 将 Notion 块转换为 HTML
async function blocksToHtml(blocks, notion) {
  let html = "";

  for (const block of blocks) {
    html += await blockToHtml(block, notion);
  }

  return html;
}

// 处理单个块
async function blockToHtml(block, notion) {
  const { type, id } = block;

  // 检查块是否有子块
  const hasChildren = block.has_children;

  // 根据块类型生成相应的 HTML
  switch (type) {
    case "paragraph":
      return `<p>${richTextToHtml(block.paragraph.rich_text)}</p>\n`;

    case "heading_1":
      return `<h1>${richTextToHtml(block.heading_1.rich_text)}</h1>\n`;

    case "heading_2":
      return `<h2>${richTextToHtml(block.heading_2.rich_text)}</h2>\n`;

    case "heading_3":
      return `<h3>${richTextToHtml(block.heading_3.rich_text)}</h3>\n`;

    case "bulleted_list_item":
      return `<li>${richTextToHtml(block.bulleted_list_item.rich_text)}</li>\n`;

    case "numbered_list_item":
      return `<li>${richTextToHtml(block.numbered_list_item.rich_text)}</li>\n`;

    case "to_do":
      const checked = block.to_do.checked ? 'checked' : '';
      return `<div><input type="checkbox" ${checked} disabled /> ${richTextToHtml(block.to_do.rich_text)}</div>\n`;

    case "quote":
      return `<blockquote>${richTextToHtml(block.quote.rich_text)}</blockquote>\n`;

    case "code":
      return `<pre><code class="language-${block.code.language}">${richTextToHtml(block.code.rich_text)}</code></pre>\n`;

    case "image":
      let imageUrl = "";
      if (block.image.type === "external") {
        imageUrl = block.image.external.url;
      } else if (block.image.type === "file") {
        imageUrl = block.image.file.url;
      }
      const caption = block.image.caption && block.image.caption.length > 0
        ? richTextToHtml(block.image.caption)
        : "";
      return `<figure><img src="${imageUrl}" alt="${caption}" />${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>\n`;

    case "divider":
      return `<hr />\n`;

    case "callout":
      return `<div class="callout"><div class="callout-emoji">${block.callout.icon?.emoji || ""}</div><div>${richTextToHtml(block.callout.rich_text)}</div></div>\n`;

    default:
      return `<div>不支持的块类型: ${type}</div>\n`;
  }
}

// 处理富文本内容
function richTextToHtml(richText) {
  if (!richText || richText.length === 0) return "";

  let html = "";

  for (const text of richText) {
    let content = text.plain_text;
    // 转义 HTML 特殊字符
    content = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    // 应用文本样式
    if (text.annotations.bold) content = `<strong>${content}</strong>`;
    if (text.annotations.italic) content = `<em>${content}</em>`;
    if (text.annotations.underline) content = `<u>${content}</u>`;
    if (text.annotations.strikethrough) content = `<s>${content}</s>`;
    if (text.annotations.code) content = `<code>${content}</code>`;

    // 处理链接
    if (text.href) {
      content = `<a href="${text.href}" target="_blank" rel="noopener noreferrer">${content}</a>`;
    }

    html += content;
  }

  return html;
}