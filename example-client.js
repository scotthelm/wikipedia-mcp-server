#!/usr/bin/env node
import { spawn } from "child_process";
import { createInterface } from "readline";
import { createServer } from "http";
import { readFileSync } from "fs";
import { promises as fsPromises } from "fs";

// Create a simple HTTP server to display results
const httpServer = createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(readFileSync("example-results.html"));
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

httpServer.listen(3000, () => {
  console.log("HTTP server running at http://localhost:3000");
});

// Spawn the MCP server process
const serverProcess = spawn("npx", ["wikipedia-mcp-server"], {
  stdio: ["pipe", "pipe", "inherit"],
});

// Create readline interface to read server responses line by line
const rl = createInterface({
  input: serverProcess.stdout,
  crlfDelay: Infinity,
});

// Store results for display
const results = {
  tools: [],
  onThisDay: null,
  findPage: null,
  getPage: null,
  getImagesForPage: null,
};

// Function to send a request to the server
function sendRequest(request) {
  const requestStr = JSON.stringify(request) + "\n";

  // Send JSON message as a single line
  serverProcess.stdin.write(requestStr);

  console.log(`Sent request: ${requestStr.trim()}`);
}

// Function to update the HTML results file
async function updateResultsHtml() {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Wikipedia MCP Server Example</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2 { color: #333; }
    pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    .tool { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
    .images { display: flex; flex-wrap: wrap; gap: 10px; }
    .images img { max-width: 200px; max-height: 200px; object-fit: contain; }
  </style>
</head>
<body>
  <h1>Wikipedia MCP Server Example</h1>
  
  <div class="tool">
    <h2>Available Tools</h2>
    <ul>
      ${results.tools
        .map(
          (tool) =>
            `<li><strong>${tool.name}</strong>: ${tool.description}</li>`
        )
        .join("")}
    </ul>
  </div>
  
  <!--
  <div class="tool">
    <h2>On This Day</h2>
    ${
      // results.onThisDay
      //   ? `<pre>${JSON.stringify(results.onThisDay, null, 2)}</pre>`
      //   : "<p>Loading...</p>"
      "xxx"
    }
  </div>
  -->
  
  <div class="tool">
    <h2>Find Page</h2>
    ${
      results.findPage
        ? `<pre>${JSON.stringify(results.findPage, null, 2)}</pre>`
        : "<p>Loading...</p>"
    }
  </div>
  
  <div class="tool">
    <h2>Get Page</h2>
    ${
      results.getPage
        ? `
      <h3>${results.getPage.title}</h3>
      <p><strong>URL:</strong> <a href="${
        results.getPage.url
      }" target="_blank">${results.getPage.url}</a></p>
      <h4>Summary</h4>
      <div>${
        results.getPage.summary.extract_html || results.getPage.summary.extract
      }</div>
      <h4>Content</h4>
      <pre>${JSON.stringify(results.getPage.content, null, 2)}</pre>
    `
        : "<p>Loading...</p>"
    }
  </div>
  
  <div class="tool">
    <h2>Get Images for Page</h2>
    ${
      results.getImagesForPage
        ? `
      <div class="images">
        ${results.getImagesForPage
          .slice(0, 50)
          .map(
            (img) => `
          <a href="${img.url}" target="_blank">
            <img src="${img.url}" alt="${img.title}" title="${img.title}">
          </a>
        `
          )
          .join("")}
      </div>
      <p>Showing 10 of ${results.getImagesForPage.length} images</p>
    `
        : "<p>Loading...</p>"
    }
  </div>
</body>
</html>
  `;

  // Write the HTML to a file
  try {
    await fsPromises.writeFile("example-results.html", html);
    console.log("Updated results HTML file");
  } catch (error) {
    console.error("Error writing results HTML:", error);
  }
}

// Process server responses
rl.on("line", (line) => {
  if (line.trim() === "") {
    return;
  }

  try {
    const response = JSON.parse(line);
    console.log("Received response ID:", response.id);

    // Process response based on the request ID
    switch (response.id) {
      case 1: // listTools response
        if (response.result && response.result.tools) {
          results.tools = response.result.tools;
          console.log(
            "Available tools:",
            results.tools.map((t) => t.name).join(", ")
          );
          updateResultsHtml();

          // Now call onThisDay
          const today = new Date();
          const formattedDate = `${today.getFullYear()}-${String(
            today.getMonth() + 1
          ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

          sendRequest({
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: {
              name: "onThisDay",
              arguments: {
                date: formattedDate,
              },
            },
          });
        }
        break;

      case 2: // onThisDay response
        if (response.result && response.result.content) {
          try {
            results.onThisDay = JSON.parse(response.result.content[0].text);
            updateResultsHtml();
          } catch (e) {
            console.error("Error parsing onThisDay result:", e);
          }

          // Now call findPage
          sendRequest({
            jsonrpc: "2.0",
            id: 3,
            method: "tools/call",
            params: {
              name: "findPage",
              arguments: {
                query: "Albert Einstein",
              },
            },
          });
        }
        break;

      case 3: // findPage response
        if (response.result && response.result.content) {
          try {
            results.findPage = JSON.parse(response.result.content[0].text);
            updateResultsHtml();
          } catch (e) {
            console.error("Error parsing findPage result:", e);
          }

          // Now call getPage
          sendRequest({
            jsonrpc: "2.0",
            id: 4,
            method: "tools/call",
            params: {
              name: "getPage",
              arguments: {
                title: "Albert Einstein",
              },
            },
          });
        }
        break;

      case 4: // getPage response
        if (response.result && response.result.content) {
          try {
            results.getPage = JSON.parse(response.result.content[0].text);
            updateResultsHtml();
          } catch (e) {
            console.error("Error parsing getPage result:", e);
          }

          // Now call getImagesForPage
          sendRequest({
            jsonrpc: "2.0",
            id: 5,
            method: "tools/call",
            params: {
              name: "getImagesForPage",
              arguments: {
                title: "Albert Einstein",
              },
            },
          });
        }
        break;

      case 5: // getImagesForPage response
        if (response.result && response.result.content) {
          try {
            results.getImagesForPage = JSON.parse(
              response.result.content[0].text
            );
            updateResultsHtml();
            console.log(
              "All requests completed. View results at http://localhost:3000"
            );
          } catch (e) {
            console.error("Error parsing getImagesForPage result:", e);
          }
        }
        break;
    }
  } catch (error) {
    console.error("Error parsing response:", error);
  }
});

// Handle server process exit
serverProcess.on("exit", (code) => {
  console.log(`Server process exited with code ${code}`);
  httpServer.close();
  process.exit(code);
});

// Send initial request to list available tools
sendRequest({
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list",
  params: {},
});

// Handle client process exit
process.on("SIGINT", () => {
  console.log("Terminating client and server...");
  serverProcess.kill();
  httpServer.close();
  process.exit(0);
});

console.log("Starting Wikipedia MCP client example...");
console.log(
  "This will demonstrate all available tools in the Wikipedia MCP server."
);
console.log("Results will be displayed at http://localhost:3000");
