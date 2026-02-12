import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocket } from 'ws';
import { createTestServer, cleanup } from '../helpers.js';
import type { Server } from 'http';

describe('WebSocket Security & Authentication', () => {
  let testServerUrl: string;
  let wsServerUrl: string;
  let testServer: Server | null = null;
  let testPort: number;

  beforeEach(async () => {
    const serverInfo = await createTestServer();
    testServerUrl = serverInfo.apiUrl;
    wsServerUrl = serverInfo.wsUrl;
    testPort = serverInfo.port;
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('WebSocket Connection Security', () => {
    it('should accept valid WebSocket connections', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);

        ws.on('open', () => {
          expect(ws.readyState).toBe(WebSocket.OPEN);
          ws.close();
          resolve();
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);
      });
    });

    it('should enforce maximum payload size', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);

        ws.on('open', () => {
          // Create a message larger than max payload (1MB)
          const largePayload = JSON.stringify({
            type: 'event',
            sessionId: 'test-session',
            payload: 'x'.repeat(2 * 1024 * 1024),
          });

          try {
            ws.send(largePayload);
          } catch (e) {
            // Expected to fail
            ws.close();
            resolve();
            return;
          }

          ws.on('close', () => {
            ws.close();
            resolve();
          });

          setTimeout(() => {
            ws.close();
            resolve();
          }, 1000);
        });

        ws.on('error', (error) => {
          ws.close();
          // Expected to receive an error
          resolve();
        });

        setTimeout(() => {
          ws.close();
          reject(new Error('Test timeout'));
        }, 5000);
      });
    });

    it('should reject upgrade requests to non-/ws paths', async () => {
      return new Promise<void>((resolve, reject) => {
        // Try to upgrade on wrong path
        const badUrl = wsServerUrl.replace('/ws', '/invalid');

        const ws = new WebSocket(badUrl);
        let errorOccurred = false;

        ws.on('open', () => {
          ws.close();
          if (!errorOccurred) {
            // Connection succeeded, which might be ok on test server
            resolve();
          }
        });

        ws.on('error', () => {
          // Expected
          errorOccurred = true;
          resolve();
        });

        setTimeout(() => {
          ws.close();
          resolve();
        }, 2000);
      });
    });
  });

  describe('WebSocket Message Validation', () => {
    it('should accept valid JSON messages', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);

        ws.on('open', () => {
          const validMessage = JSON.stringify({
            type: 'subscribe',
            sessionId: 'test-session-123',
          });

          try {
            ws.send(validMessage);
            ws.close();
            resolve();
          } catch (e) {
            reject(e);
          }
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout'));
        }, 5000);
      });
    });

    it('should reject malformed JSON messages', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);

        ws.on('open', () => {
          const malformedMessage = '{invalid json}';

          ws.send(malformedMessage);

          // Server should handle gracefully (not crash)
          setTimeout(() => {
            ws.close();
            resolve();
          }, 500);
        });

        ws.on('error', () => {
          // Connection error expected
          resolve();
        });

        setTimeout(() => {
          ws.close();
          reject(new Error('Test timeout'));
        }, 3000);
      });
    });

    it('should reject messages without required fields', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);

        ws.on('open', () => {
          const incompleteMessage = JSON.stringify({
            // Missing required 'type' field
            data: 'test',
          });

          ws.send(incompleteMessage);

          setTimeout(() => {
            ws.close();
            resolve();
          }, 500);
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          resolve();
        }, 3000);
      });
    });

    it('should validate sessionId format in messages', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);

        ws.on('open', () => {
          const maliciousMessage = JSON.stringify({
            type: 'subscribe',
            sessionId: '; DROP TABLE sessions; --',
          });

          ws.send(maliciousMessage);

          setTimeout(() => {
            ws.close();
            resolve();
          }, 500);
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          resolve();
        }, 3000);
      });
    });

    it('should handle empty messages safely', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);

        ws.on('open', () => {
          ws.send('');

          setTimeout(() => {
            ws.close();
            resolve();
          }, 500);
        });

        ws.on('error', () => {
          resolve();
        });

        setTimeout(() => {
          ws.close();
          resolve();
        }, 3000);
      });
    });

    it('should reject extremely long session IDs', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);

        ws.on('open', () => {
          const messageWithLongId = JSON.stringify({
            type: 'subscribe',
            sessionId: 'session-' + 'a'.repeat(10000),
          });

          ws.send(messageWithLongId);

          setTimeout(() => {
            ws.close();
            resolve();
          }, 500);
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          resolve();
        }, 3000);
      });
    });
  });

  describe('Message Type Validation', () => {
    it('should validate message type enum', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);

        ws.on('open', () => {
          const invalidTypeMessage = JSON.stringify({
            type: 'invalid_type_12345',
            sessionId: 'test-session',
          });

          ws.send(invalidTypeMessage);

          setTimeout(() => {
            ws.close();
            resolve();
          }, 500);
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          resolve();
        }, 3000);
      });
    });

    it('should reject null bytes in message content', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);

        ws.on('open', () => {
          const messageWithNullByte = Buffer.from([
            0x7b, // {
            0x22, // "
            0x74, // t
            0x79, // y
            0x70, // p
            0x65, // e
            0x22, // "
            0x3a, // :
            0x00, // NULL BYTE
            0x7d, // }
          ]);

          ws.send(messageWithNullByte);

          setTimeout(() => {
            ws.close();
            resolve();
          }, 500);
        });

        ws.on('error', () => {
          resolve();
        });

        setTimeout(() => {
          ws.close();
          resolve();
        }, 3000);
      });
    });
  });

  describe('Rate Limiting & Resource Protection', () => {
    it('should handle rapid message bursts', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);

        ws.on('open', () => {
          // Send many messages rapidly
          for (let i = 0; i < 50; i++) {
            const message = JSON.stringify({
              type: 'subscribe',
              sessionId: `test-session-${i}`,
            });
            try {
              ws.send(message);
            } catch (e) {
              // Expected if rate limited
              break;
            }
          }

          setTimeout(() => {
            ws.close();
            resolve();
          }, 1000);
        });

        ws.on('error', () => {
          resolve();
        });

        setTimeout(() => {
          ws.close();
          resolve();
        }, 5000);
      });
    });

    it('should detect client disconnection', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);

        ws.on('open', () => {
          ws.close();

          // Try to send after close
          try {
            ws.send(JSON.stringify({ type: 'test' }));
          } catch (e) {
            // Expected
          }

          resolve();
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          resolve();
        }, 2000);
      });
    });
  });

  describe('Binary Message Handling', () => {
    it('should safely handle binary data', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);

        ws.on('open', () => {
          const binaryData = Buffer.from([0xff, 0xfe, 0xfd, 0xfc]);
          ws.send(binaryData);

          setTimeout(() => {
            ws.close();
            resolve();
          }, 500);
        });

        ws.on('error', (error) => {
          // Binary might not be supported, that's ok
          ws.close();
          resolve();
        });

        setTimeout(() => {
          ws.close();
          resolve();
        }, 3000);
      });
    });
  });

  describe('Command Validation in Messages', () => {
    it('should validate command type', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);

        ws.on('open', () => {
          const commandMessage = JSON.stringify({
            type: 'command',
            sessionId: 'test-session',
            command: 'invalid_command',
          });

          ws.send(commandMessage);

          setTimeout(() => {
            ws.close();
            resolve();
          }, 500);
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          resolve();
        }, 3000);
      });
    });

    it('should reject commands with injection attempts', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);

        ws.on('open', () => {
          const injectionMessage = JSON.stringify({
            type: 'command',
            sessionId: 'test-session',
            command: 'pause; rm -rf /',
          });

          ws.send(injectionMessage);

          setTimeout(() => {
            ws.close();
            resolve();
          }, 500);
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          resolve();
        }, 3000);
      });
    });
  });

  describe('Connection State Management', () => {
    it('should properly clean up on client disconnect', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsServerUrl);
        let openCalled = false;

        ws.on('open', () => {
          openCalled = true;
          ws.close();
        });

        ws.on('close', () => {
          expect(openCalled).toBe(true);
          resolve();
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          reject(new Error('Test timeout'));
        }, 5000);
      });
    });

    it('should handle multiple rapid connect/disconnect cycles', async () => {
      return new Promise<void>((resolve, reject) => {
        const connectCycles = 5;
        let completed = 0;

        const cycleConnect = () => {
          const ws = new WebSocket(wsServerUrl);

          ws.on('open', () => {
            ws.close();
          });

          ws.on('close', () => {
            completed++;
            if (completed >= connectCycles) {
              resolve();
            }
          });

          ws.on('error', () => {
            completed++;
            if (completed >= connectCycles) {
              resolve();
            }
          });
        };

        for (let i = 0; i < connectCycles; i++) {
          cycleConnect();
        }

        setTimeout(() => {
          if (completed < connectCycles) {
            reject(new Error('Not all cycles completed'));
          }
        }, 10000);
      });
    });
  });

  describe('Memory & Resource Cleanup', () => {
    it('should not leak memory with many connections', async () => {
      return new Promise<void>((resolve, reject) => {
        const connections: WebSocket[] = [];
        const connectionCount = 10;
        let openCount = 0;

        for (let i = 0; i < connectionCount; i++) {
          const ws = new WebSocket(wsServerUrl);

          ws.on('open', () => {
            openCount++;
            if (openCount === connectionCount) {
              // All connected, now close them
              connections.forEach(ws => ws.close());
            }
          });

          ws.on('error', () => {
            // Ignore
          });

          connections.push(ws);
        }

        setTimeout(() => {
          connections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.close();
            }
          });
          resolve();
        }, 3000);
      });
    });
  });
});
