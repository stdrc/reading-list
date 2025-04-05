#!/usr/bin/env tsx

import "dotenv/config";
import { Client } from "@notionhq/client";
import axios from "axios";
import * as cheerio from "cheerio";

// Define types
interface BookPage {
  id: string;
  properties: {
    [key: string]: any;
    名称?: {
      title: Array<{
        plain_text: string;
      }>;
    };
    URL?: {
      url: string | null;
    };
    "封面 URL"?: {
      url: string | null;
    };
  };
}

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY as string,
});

const databaseId = process.env.NOTION_THINGS_DATABASE_ID as string;
const doubanCookie = process.env.DOUBAN_COOKIE as string;

// Utility to extract cover URL from Douban page
async function extractCoverUrl(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        Referer: "https://www.douban.com/",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
        Cookie: doubanCookie,
      },
    });

    const $ = cheerio.load(response.data);

    // For book pages, the cover is typically in #mainpic img
    let coverUrl = $("#mainpic img").attr("src");

    // If not found, try alternative selectors
    if (!coverUrl) {
      coverUrl = $("a.nbg img").attr("src");
    }

    if (!coverUrl) {
      coverUrl = $(".subject-img img").attr("src");
    }

    // Clean up the URL if needed (remove size constraints for better quality)
    if (coverUrl) {
      // Replace small cover with large one
      coverUrl = coverUrl.replace(/s_/g, "l_");

      // Remove size constraints
      coverUrl = coverUrl.replace(/\?v=.*$/, "");
    }

    return coverUrl || null;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to extract cover from ${url}:`, errorMsg);
    return null;
  }
}

// Get all book entries from the database
async function getDoubanBooks(): Promise<BookPage[]> {
  try {
    let results: BookPage[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: databaseId,
        start_cursor: startCursor,
        filter: {
          and: [
            {
              property: "形式",
              multi_select: {
                contains: "书",
              },
            },
            {
              property: "URL",
              url: {
                contains: "douban.com",
              },
            },
          ],
        },
      });

      results = [...results, ...(response.results as BookPage[])];
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    return results;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error querying database:", errorMsg);
    return [];
  }
}

// Update the cover URL for a book entry
async function updateCoverUrl(
  pageId: string,
  coverUrl: string,
): Promise<boolean> {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        "封面 URL": {
          url: coverUrl,
        },
      },
    });
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to update page ${pageId}:`, errorMsg);
    return false;
  }
}

// Main function
async function main(): Promise<void> {
  console.log("Starting to update book covers...");

  // Check if necessary environment variables are set
  if (!process.env.NOTION_API_KEY || !databaseId) {
    console.error(
      "Missing required environment variables: NOTION_API_KEY or NOTION_THINGS_DATABASE_ID",
    );
    process.exit(1);
  }

  if (!doubanCookie) {
    console.warn(
      "Warning: DOUBAN_COOKIE not set. May encounter rate limiting.",
    );
  }

  // Get all book entries from Douban
  const books = await getDoubanBooks();
  console.log(`Found ${books.length} Douban book entries`);

  // Process each book
  let successCount = 0;
  let failureCount = 0;

  for (const book of books) {
    try {
      // Extract book info
      const title = book.properties["名称"]?.title[0]?.plain_text || "Unknown";
      const url = book.properties["URL"]?.url;
      const currentCoverUrl = book.properties["封面 URL"]?.url;

      // Skip if no URL
      if (!url) {
        console.log(`Skipping "${title}" - No URL`);
        continue;
      }

      // Skip if already has cover URL
      if (currentCoverUrl) {
        console.log(`Skipping "${title}" - Already has cover URL`);
        continue;
      }

      console.log(`Processing "${title}" - ${url}`);

      // Extract cover URL
      const coverUrl = await extractCoverUrl(url);

      if (!coverUrl) {
        console.log(`  No cover found for "${title}"`);
        failureCount++;
        continue;
      }

      // Update database
      const success = await updateCoverUrl(book.id, coverUrl);

      if (success) {
        console.log(`  ✅ Updated cover for "${title}": ${coverUrl}`);
        successCount++;
      } else {
        console.log(`  ❌ Failed to update cover for "${title}"`);
        failureCount++;
      }

      // Add a delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Error processing book:`, errorMsg);
      failureCount++;
    }
  }

  console.log("\nSummary:");
  console.log(`Total books processed: ${books.length}`);
  console.log(`Successful updates: ${successCount}`);
  console.log(`Failed updates: ${failureCount}`);
}

// Run the script
main().catch((error) => {
  const errorMsg = error instanceof Error ? error.message : String(error);
  console.error("Fatal error:", errorMsg);
  process.exit(1);
});
