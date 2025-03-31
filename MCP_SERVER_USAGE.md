# Using the Wikipedia MCP Server with Claude

This document explains how to use the Wikipedia MCP Server with Claude or other MCP-compatible assistants.

## Setup

1. Install and build the Wikipedia MCP Server:

   ```bash
   git clone https://github.com/yourusername/wikipedia-mcp-server.git
   cd wikipedia-mcp-server
   npm install
   npm run build
   ```

2. Add the server to your MCP configuration file:

   For Claude Desktop (macOS):

   ```json
   // ~/Library/Application Support/Claude/claude_desktop_config.json
   {
     "mcpServers": {
       "wikipedia": {
         "command": "npx",
         "args": ["wikipedia-mcp-server"],
         "env": {},
         "disabled": false,
         "autoApprove": ["onThisDay", "findPage", "getPage", "getImagesForPage"]
       }
     }
   }
   ```

   For Claude in VSCode:

   ```json
   // ~/.vscode-server/data/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
   {
     "mcpServers": {
       "wikipedia": {
         "command": "npx",
         "args": ["wikipedia-mcp-server"],
         "env": {},
         "disabled": false,
         "autoApprove": ["onThisDay", "findPage", "getPage", "getImagesForPage"]
       }
     }
   }
   ```

3. Restart Claude or reload the VSCode window to apply the changes.

## Available Tools

Once connected, the Wikipedia MCP Server provides the following tools:

### onThisDay

Get historical events that occurred on a specific date.

**Parameters:**

- `date`: ISO8601 date portion (YYYY-MM-DD)

**Example:**

```
What happened on January 1st, 2023?
```

### findPage

Search for Wikipedia pages matching a query.

**Parameters:**

- `query`: Search query

**Example:**

```
Search Wikipedia for Albert Einstein
```

### getPage

Get content of a Wikipedia page by title.

**Parameters:**

- `title`: Page title

**Example:**

```
Get the Wikipedia page for Albert Einstein
```

### getImagesForPage

Get images from a Wikipedia page by title.

**Parameters:**

- `title`: Page title

**Example:**

```
Show me images from the Wikipedia page for Albert Einstein
```

## Example Prompts

Here are some example prompts you can use with Claude to test the Wikipedia MCP Server:

1. "What historical events happened on March 14th, 1879?"
2. "Search Wikipedia for quantum physics and summarize the top 3 results."
3. "Get the Wikipedia page for Marie Curie and summarize her key contributions to science."
4. "Show me images from the Wikipedia page for the Eiffel Tower and describe what they show."
5. "Find information about the Apollo 11 mission on Wikipedia and create a timeline of key events."

## Troubleshooting

If you encounter issues with the Wikipedia MCP Server:

1. **Server not connecting**: Check that the path to the server in your MCP configuration is correct and that the server has been built (`npm run build`).

2. **Tool not found**: Ensure that the tool name in your prompt matches one of the available tools: `onThisDay`, `findPage`, `getPage`, or `getImagesForPage`.

3. **Invalid parameters**: Make sure you're providing the correct parameters for each tool:

   - `onThisDay` requires a date in YYYY-MM-DD format
   - `findPage` requires a non-empty query string
   - `getPage` and `getImagesForPage` require a non-empty title string

4. **Server crashes**: Check the server logs for error messages. Common issues include:
   - Network connectivity problems
   - Rate limiting by the Wikipedia API
   - Invalid input parameters

## Technical Details

### Communication Protocol

The Wikipedia MCP Server uses the Model Context Protocol (MCP), which is a JSON-RPC-based protocol for communication between AI assistants and external tools. The server communicates over stdio (standard input/output).

### Request Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "onThisDay",
    "arguments": {
      "date": "2023-04-15"
    }
  }
}
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "onThisDay",
        "description": "Get historical events that occurred on a specific date",
        "inputSchema": { ... }
      },
      ...
    ]
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{ ... JSON data ... }"
      }
    ]
  }
}
```

## Extending the Server

If you want to add more Wikipedia-related functionality to the server:

1. Add a new tool definition in the `setupToolHandlers` method in `src/index.ts`
2. Implement a handler function for the new tool
3. Add appropriate input validation
4. Build and test the server
5. Update your MCP configuration to include the new tool in the `autoApprove` array if needed
