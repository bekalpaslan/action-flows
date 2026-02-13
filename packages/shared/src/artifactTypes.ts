// Artifact types for Phase 0 — Live Canvas (Thread 4)

/** Identifies an agent-generated artifact */
export type ArtifactId = string & { readonly __brand: 'ArtifactId' };

/** Convert string to ArtifactId */
export function toArtifactId(value: string): ArtifactId {
  return value as ArtifactId;
}

/** Supported artifact render types */
export type ArtifactType = 'html' | 'markdown' | 'svg' | 'mermaid' | 'react';

/** Artifact lifecycle status */
export type ArtifactStatus = 'active' | 'archived' | 'error';

/** An agent-generated visual artifact */
export interface Artifact {
  id: ArtifactId;
  sessionId: string;
  chainId: string;
  type: ArtifactType;
  content: string;
  data?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Full artifact with metadata */
export interface StoredArtifact extends Artifact {
  status: ArtifactStatus;
  stepNumber?: number;
  title?: string;
  renderCount: number;
  lastRenderedAt?: string;
}

/** Markers used in agent output to delimit artifacts */
export const ARTIFACT_START_MARKER = '<!-- ARTIFACT_START';
export const ARTIFACT_END_MARKER = '<!-- ARTIFACT_END -->';

/** Parsed artifact marker attributes */
export interface ArtifactMarkerAttrs {
  type: ArtifactType;
  id?: string;
  title?: string;
}

/** WebSocket messages for artifact updates */
export interface ArtifactCreatedMessage {
  type: 'artifact:created';
  artifact: StoredArtifact;
}

export interface ArtifactUpdatedMessage {
  type: 'artifact:updated';
  artifactId: ArtifactId;
  data: Record<string, unknown>;
}

export interface ArtifactArchivedMessage {
  type: 'artifact:archived';
  artifactId: ArtifactId;
}

export type ArtifactMessage =
  | ArtifactCreatedMessage
  | ArtifactUpdatedMessage
  | ArtifactArchivedMessage;
