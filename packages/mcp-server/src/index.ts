#!/usr/bin/env node

/**
 * ActionFlows Dashboard MCP Server
 *
 * Provides MCP tools for orchestrators to check for control commands
 * and acknowledge their processing.
 *
 * Tools:
 * - check_commands: Poll for pending control commands
 * - ack_command: Acknowledge command processing
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

const DEFAULT_BACKEND_URL = process.env.AFW_BACKEND_URL || 'http://localhost:3001';

interface CommandResponse {
  sessionId: string;
  count: number;
  commands: Array<{
    id: string;
    type: string;
    payload?: Record<string, unknown>;
    timestamp: string;
  }>;
}

interface AckResponse {
  success: boolean;
  commandId: string;
  acknowledged: boolean;
}

/**
 * MCP Server for ActionFlows Dashboard control commands
 */
class ActionFlowsMCPServer {
  private server: Server;
  private backendUrl: string;

  constructor(backendUrl: string = DEFAULT_BACKEND_URL) {
    this.backendUrl = backendUrl;
    this.server = new Server(
      {
        name: 'actionflows-dashboard',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'check_commands',
            description:
              'Check for pending control commands from ActionFlows Dashboard. ' +
              'Returns an array of commands (pause, resume, cancel, retry) that have been ' +
              'issued by the user through the Dashboard UI.',
            inputSchema: {
              type: 'object',
              properties: {
                session_id: {
                  type: 'string',
                  description: 'Claude session ID to check for commands',
                },
              },
              required: ['session_id'],
            },
          },
          {
            name: 'ack_command',
            description:
              'Acknowledge processing of a control command. Call this after you have ' +
              'processed a command returned by check_commands. This prevents the command ' +
              'from appearing in future polls and updates the Dashboard UI.',
            inputSchema: {
              type: 'object',
              properties: {
                command_id: {
                  type: 'string',
                  description: 'Command ID to acknowledge (from check_commands response)',
                },
                result: {
                  type: 'string',
                  description: 'Optional result message (e.g., "Paused after step 3")',
                },
                error: {
                  type: 'string',
                  description: 'Optional error message if command processing failed',
                },
              },
              required: ['command_id'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'check_commands':
          return this.handleCheckCommands(args as { session_id: string });

        case 'ack_command':
          return this.handleAckCommand(
            args as { command_id: string; result?: string; error?: string }
          );

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  /**
   * Handle check_commands tool call
   */
  private async handleCheckCommands(args: { session_id: string }) {
    const { session_id } = args;

    if (!session_id) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'session_id is required',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    try {
      const url = `${this.backendUrl}/api/sessions/${encodeURIComponent(session_id)}/commands`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as CommandResponse;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                session_id,
                commands: data.commands.map((cmd) => ({
                  id: cmd.id,
                  type: cmd.type,
                  target: cmd.payload,
                })),
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
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Failed to check commands',
                message: error instanceof Error ? error.message : 'Unknown error',
                session_id,
                commands: [], // Return empty array on error (graceful degradation)
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  /**
   * Handle ack_command tool call
   */
  private async handleAckCommand(args: {
    command_id: string;
    result?: string;
    error?: string;
  }) {
    const { command_id, result, error } = args;

    if (!command_id) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'command_id is required',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    try {
      const url = `${this.backendUrl}/api/commands/${encodeURIComponent(command_id)}/ack`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ result, error }),
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as AckResponse;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                acknowledged: data.acknowledged,
                command_id,
                result,
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
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Failed to acknowledge command',
                message: error instanceof Error ? error.message : 'Unknown error',
                command_id,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  /**
   * Start the MCP server
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ActionFlows Dashboard MCP server running');
    console.error(`Backend URL: ${this.backendUrl}`);
  }
}

// Start server
const server = new ActionFlowsMCPServer();
server.start().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});
