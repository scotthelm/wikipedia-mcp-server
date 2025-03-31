# Wikipedia MCP Server

An MCP (Model Context Protocol) server for Wikipedia API interactions.

## Overview

This server provides tools for interacting with the Wikipedia API through the Model Context Protocol. It allows AI assistants to access Wikipedia content, search for articles, get historical events, and retrieve images.

## Features

The server provides the following tools:

- **onThisDay**: Get historical events that occurred on a specific date
- **findPage**: Search for Wikipedia pages matching a query
- **getPage**: Get content of a Wikipedia page by title
- **getImagesForPage**: Get images from a Wikipedia page by title

## Installation

```bash
npm install
npm run build
```

## Usage

### Running the Server

```bash
npx wikipedia-mcp-server
```

This will start the MCP server, which communicates over stdio.

### Example Client

An example client is provided to demonstrate how to interact with the server:

```bash
node example-client.js
```

This will:

1. Start the server
2. Query for available tools
3. Demonstrate each tool with sample queries
4. Display the results in a simple web interface at http://localhost:3000

## Development

### Building

```bash
npm run build
```

### Running in Development Mode

```bash
npm run dev
```

### Testing

This project can be tested manually using the example client:

```bash
node example-client.js
```

This will demonstrate all the available tools with sample queries.

## MCP Server Configuration

To use this server with Claude or other MCP-compatible assistants, add it to your MCP configuration:

```json
{
  "mcpServers": {
    "wikipedia": {
      "command": "npx",
      "args": ["wikipedia-mcp-server"],
      "env": {}
    }
  }
}
```

## Attribution

This would not be possible without the great work done by the folks who created the [wikipedia package](https://github.com/dopecodez/wikipedia)

## License

MIT
