declare module "@modelcontextprotocol/sdk" {
  export class Server {
    constructor(
      info: { name: string; version: string },
      options: { capabilities: { tools: any } }
    );

    onerror: (error: Error) => void;

    setRequestHandler(
      schema: any,
      handler: (request: any) => Promise<any>
    ): void;

    connect(transport: any): Promise<void>;

    close(): Promise<void>;
  }

  export class StdioServerTransport {
    constructor();
  }

  export const CallToolRequestSchema: any;
  export const ErrorCode: {
    ParseError: number;
    InvalidRequest: number;
    MethodNotFound: number;
    InvalidParams: number;
    InternalError: number;
    ServerError: number;
  };
  export const ListToolsRequestSchema: any;
  export const ListResourcesRequestSchema: any;
  export const ListResourceTemplatesRequestSchema: any;
  export const ReadResourceRequestSchema: any;

  export class McpError extends Error {
    constructor(code: number, message: string);
  }
}
