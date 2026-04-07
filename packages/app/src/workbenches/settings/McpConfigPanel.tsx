/**
 * McpConfigPanel — Read-only display of registered MCP servers and their capabilities.
 *
 * CUSTOM-07: lightweight v1. Fetches from GET /api/mcp/servers and displays
 * server names, tool counts, and connection status. Shows a graceful informational
 * fallback when the endpoint is unavailable (not a red error state).
 */

import { useState, useEffect } from 'react';
import { Server } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface McpServer {
  name: string;
  toolCount: number;
  status: string;
}

export function McpConfigPanel() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchServers() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/mcp/servers');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) {
          setServers(data.servers ?? []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('unavailable');
          setLoading(false);
        }
      }
    }

    fetchServers();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-heading font-semibold">MCP Servers</h2>
        <p className="text-caption text-text-dim">
          Registered Model Context Protocol servers and their capabilities.
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-8 text-center text-text-dim" role="status">
          Loading MCP server information...
        </div>
      )}

      {/* Error / unavailable fallback — informational, not red */}
      {!loading && error && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Server className="h-8 w-8 text-text-muted" />
          <p className="text-body font-semibold">MCP server information unavailable</p>
          <p className="text-caption text-text-dim max-w-md">
            Could not reach the MCP server endpoint. Ensure the backend is running and the MCP
            server package is configured. This panel will populate automatically when MCP servers are available.
          </p>
        </div>
      )}

      {/* Empty state — successful fetch but no servers */}
      {!loading && !error && servers.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Server className="h-8 w-8 text-text-muted" />
          <p className="text-body font-semibold">No MCP servers configured</p>
          <p className="text-caption text-text-dim max-w-md">
            Add servers via claude.json or the MCP server package.
          </p>
        </div>
      )}

      {/* Server cards */}
      {!loading && !error && servers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servers.map((server) => (
            <Card key={server.name}>
              <CardHeader>
                <CardTitle>{server.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="info" size="sm">
                    {server.toolCount} {server.toolCount === 1 ? 'tool' : 'tools'}
                  </Badge>
                  <Badge
                    variant={server.status === 'connected' ? 'success' : 'default'}
                    size="sm"
                  >
                    {server.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
