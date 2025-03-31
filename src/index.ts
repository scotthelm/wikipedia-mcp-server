#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import wiki from "wikipedia";

// Type definitions for tool arguments
export interface OnThisDayArgs {
  date: string; // ISO8601 date portion (YYYY-MM-DD)
}

export interface FindPageArgs {
  query: string;
}

export interface GetPageArgs {
  title: string;
}

export interface GetImagesForPageArgs {
  title: string;
}

// Type guards for argument validation
export const isValidOnThisDayArgs = (args: any): args is OnThisDayArgs =>
  typeof args === "object" &&
  args !== null &&
  typeof args.date === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(args.date);

export const isValidFindPageArgs = (args: any): args is FindPageArgs =>
  typeof args === "object" &&
  args !== null &&
  typeof args.query === "string" &&
  args.query.trim() !== "";

export const isValidGetPageArgs = (args: any): args is GetPageArgs =>
  typeof args === "object" &&
  args !== null &&
  typeof args.title === "string" &&
  args.title.trim() !== "";

export const isValidGetImagesForPageArgs = (
  args: any
): args is GetImagesForPageArgs =>
  typeof args === "object" &&
  args !== null &&
  typeof args.title === "string" &&
  args.title.trim() !== "";

export class WikipediaServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "wikipedia-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error: Error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "onThisDay",
          description: "Get historical events that occurred on a specific date",
          inputSchema: {
            type: "object",
            properties: {
              date: {
                type: "string",
                description: "ISO8601 date portion (YYYY-MM-DD)",
                pattern: "^\\d{4}-\\d{2}-\\d{2}$",
              },
            },
            required: ["date"],
          },
        },
        {
          name: "findPage",
          description: "Search for Wikipedia pages matching a query",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "getPage",
          description: "Get content of a Wikipedia page by title",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Page title",
              },
            },
            required: ["title"],
          },
        },
        {
          name: "getImagesForPage",
          description: "Get images from a Wikipedia page by title",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Page title",
              },
            },
            required: ["title"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: any) => {
        try {
          switch (request.params.name) {
            case "onThisDay":
              return await this.handleOnThisDay(request.params.arguments);
            case "findPage":
              return await this.handleFindPage(request.params.arguments);
            case "getPage":
              return await this.handleGetPage(request.params.arguments);
            case "getImagesForPage":
              return await this.handleGetImagesForPage(
                request.params.arguments
              );
            default:
              throw new McpError(
                ErrorCode.MethodNotFound,
                `Unknown tool: ${request.params.name}`
              );
          }
        } catch (error) {
          if (error instanceof McpError) {
            throw error;
          }
          console.error("Error handling tool request:", error);
          throw new McpError(
            ErrorCode.InternalError,
            `Internal error: ${(error as Error).message}`
          );
        }
      }
    );
  }

  public async handleOnThisDay(args: any) {
    if (!isValidOnThisDayArgs(args)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid onThisDay arguments. Expected { date: "YYYY-MM-DD" }'
      );
    }

    try {
      // Parse the date to extract month and day
      const dateParts = args.date.split("-");
      const month = parseInt(dateParts[1], 10);
      const day = parseInt(dateParts[2], 10);

      // Use the Wikipedia API to get events on this day
      const onThisDayData = await wiki.onThisDay({
        month: month.toString(),
        day: day.toString(),
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(onThisDayData, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching on this day data: ${
              (error as Error).message
            }`,
          },
        ],
        isError: true,
      };
    }
  }

  public async handleFindPage(args: any) {
    if (!isValidFindPageArgs(args)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Invalid findPage arguments. Expected { query: string }"
      );
    }

    try {
      // Search for pages matching the query
      const searchResults = await wiki.search(args.query);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(searchResults, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching for pages: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }

  public async handleGetPage(args: any) {
    if (!isValidGetPageArgs(args)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Invalid getPage arguments. Expected { title: string }"
      );
    }

    try {
      // Get the page content
      const page = await wiki.page(args.title);
      const summary = await page.summary();
      const content = await page.content();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                title: page.title,
                summary,
                content,
                url: page.fullurl,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching page: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }

  public async handleGetImagesForPage(args: any) {
    if (!isValidGetImagesForPageArgs(args)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Invalid getImagesForPage arguments. Expected { title: string }"
      );
    }

    try {
      // Get the page images
      const page = await wiki.page(args.title);
      const images = await page.images();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(images, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching images: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Wikipedia MCP server running on stdio");
  }
}

const server = new WikipediaServer();
server.run().catch(console.error);
