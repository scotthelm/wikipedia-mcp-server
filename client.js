#!/usr/bin/env node
import { spawn } from "child_process";
import { createInterface } from "readline";

// Spawn the MCP server process
const serverProcess = spawn("npx", ["wikipedia-mcp-server"], {
  stdio: ["pipe", "pipe", "inherit"],
});

// Create readline interface to read server responses line by line
const rl = createInterface({
  input: serverProcess.stdout,
  crlfDelay: Infinity,
});

// Function to send a request to the server
function sendRequest(request) {
  const requestStr = JSON.stringify(request) + "\n";

  // Send JSON message as a single line
  serverProcess.stdin.write(requestStr);

  console.log(`Sent request: ${requestStr.trim()}`);
}

// Process server responses
rl.on("line", (line) => {
  if (line.trim() === "") {
    return;
  }

  try {
    const response = JSON.parse(line);
    console.log("Received response:", JSON.stringify(response, null, 2));

    // If we received the list of tools, call the onThisDay tool
    if (response.result && response.result.tools) {
      console.log("Available tools:");
      response.result.tools.forEach((tool) => {
        console.log(`- ${tool.name}: ${tool.description}`);
      });

      // Call the onThisDay tool with today's date
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
  } catch (error) {
    console.error("Error parsing response:", error);
  }
});

// Handle server process exit
serverProcess.on("exit", (code) => {
  console.log(`Server process exited with code ${code}`);
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
  process.exit(0);
});
