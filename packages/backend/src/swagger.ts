/**
 * Swagger/OpenAPI Configuration
 * Automatically generates API documentation from JSDoc comments
 */

import swaggerJsdoc, { type Options } from 'swagger-jsdoc';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

/**
 * Swagger JSDoc options
 * Defines the OpenAPI 3.0 specification
 */
const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ActionFlows Dashboard API',
      version: packageJson.version || '0.0.1',
      description: `
# ActionFlows Dashboard API

A living universe for human-orchestrator-agent collaboration.

## Overview

This API provides endpoints for managing orchestration sessions, chains, events,
and the living universe visualization. It supports both REST API calls and
WebSocket connections for real-time updates.

## Authentication

API authentication can be enabled via the \`AFW_API_KEY\` environment variable:
- REST endpoints: Include API key in \`Authorization: Bearer {key}\` header
- WebSocket: Include API key in URL query parameter \`?apiKey={key}\`

## Base URL

- **Development**: http://localhost:3001
- **Production**: Configurable via PORT environment variable

## WebSocket

Real-time event streaming is available at:
- **Endpoint**: ws://localhost:3001/ws
- **Protocol**: JSON-based event broadcasting

## Rate Limiting

- General endpoints: 100 requests per 15 minutes per IP
- Write operations: 20 requests per minute per IP
- Session creation: 10 sessions per hour per IP
      `.trim(),
      contact: {
        name: 'ActionFlows Dashboard',
        url: 'https://github.com/yourusername/actionflows-dashboard',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'sessions',
        description: 'Session management - CRUD operations for orchestration sessions',
      },
      {
        name: 'events',
        description: 'Event streaming - Store and retrieve workspace events',
      },
      {
        name: 'universe',
        description: 'Universe state - Living universe graph and region discovery',
      },
      {
        name: 'harmony',
        description: 'Harmony detection - Contract compliance and format validation',
      },
      {
        name: 'registry',
        description: 'Registry operations - Action registry and flow definitions',
      },
      {
        name: 'discovery',
        description: 'Discovery service - Region unlocking and progression tracking',
      },
      {
        name: 'health',
        description: 'Health checks - Server status and monitoring',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Optional API key authentication (set via AFW_API_KEY env var)',
        },
      },
      schemas: {
        Session: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique session identifier (branded SessionId)',
              example: 'session-1709123456789-abc123',
            },
            cwd: {
              type: 'string',
              description: 'Current working directory for the session',
              example: '/home/user/project',
            },
            hostname: {
              type: 'string',
              description: 'Hostname of the machine running the session',
              example: 'laptop-dev',
            },
            platform: {
              type: 'string',
              description: 'Operating system platform',
              example: 'linux',
            },
            user: {
              type: 'string',
              description: 'User identifier (branded UserId)',
              example: 'user-123',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed', 'failed'],
              description: 'Current session status',
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
              description: 'ISO 8601 timestamp when session started',
            },
            endedAt: {
              type: 'string',
              format: 'date-time',
              description: 'ISO 8601 timestamp when session ended (if completed)',
            },
            chains: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of chain IDs in this session',
            },
          },
        },
        WorkspaceEvent: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Event type discriminator',
              example: 'chain:started',
            },
            sessionId: {
              type: 'string',
              description: 'Session identifier for this event',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'ISO 8601 timestamp when event occurred',
            },
          },
        },
        HarmonyMetrics: {
          type: 'object',
          properties: {
            totalChecks: {
              type: 'integer',
              description: 'Total number of harmony checks performed',
            },
            validCount: {
              type: 'integer',
              description: 'Number of checks that passed validation',
            },
            degradedCount: {
              type: 'integer',
              description: 'Number of checks with degraded parsing',
            },
            violationCount: {
              type: 'integer',
              description: 'Number of checks that failed validation',
            },
            harmonyPercentage: {
              type: 'number',
              format: 'float',
              description: 'Percentage of checks in harmony (0-100)',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            message: {
              type: 'string',
              description: 'Detailed error description',
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  // Paths to route files for JSDoc comment scanning
  apis: [
    join(__dirname, 'routes/*.ts'),
    join(__dirname, 'routes/*.js'),
  ],
};

/**
 * Generate Swagger specification
 */
export const swaggerSpec = swaggerJsdoc(options);

/**
 * Export OpenAPI spec as JSON string
 */
export const swaggerSpecJSON = JSON.stringify(swaggerSpec, null, 2);
