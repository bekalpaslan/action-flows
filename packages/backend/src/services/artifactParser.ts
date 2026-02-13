import type { ArtifactType, ArtifactMarkerAttrs } from '@afw/shared';
import { ARTIFACT_START_MARKER, ARTIFACT_END_MARKER } from '@afw/shared';

/**
 * Parsed artifact from agent output
 */
export interface ParsedArtifact {
  type: ArtifactType;
  id?: string;
  title?: string;
  content: string;
}

/**
 * Artifact parser service
 *
 * Extracts artifacts from agent output using HTML comment markers.
 * Thread 4: Live Canvas — Phase 2 backend implementation
 *
 * Marker format:
 * <!-- ARTIFACT_START type=html id=dashboard-1 title="Coverage Dashboard" -->
 * <div class="dashboard">...</div>
 * <!-- ARTIFACT_END -->
 */
class ArtifactParser {
  /**
   * Parse agent output text for artifact markers, returns extracted artifacts
   */
  parse(agentOutput: string): ParsedArtifact[] {
    const artifacts: ParsedArtifact[] = [];
    const regex = new RegExp(
      `${this.escapeRegex(ARTIFACT_START_MARKER)}([^>]*)-->([\\s\\S]*?)${this.escapeRegex(ARTIFACT_END_MARKER)}`,
      'g'
    );

    let match;
    while ((match = regex.exec(agentOutput)) !== null) {
      const markerAttrs = this.parseMarkerAttrs(ARTIFACT_START_MARKER + match[1] + '-->');
      const content = match[2].trim();

      artifacts.push({
        type: markerAttrs.type,
        id: markerAttrs.id,
        title: markerAttrs.title,
        content,
      });
    }

    return artifacts;
  }

  /**
   * Parse a single artifact start marker for attributes
   */
  parseMarkerAttrs(marker: string): ArtifactMarkerAttrs {
    // Extract content between ARTIFACT_START and -->
    const content = marker
      .replace(ARTIFACT_START_MARKER, '')
      .replace('-->', '')
      .trim();

    // Parse key=value pairs (handle quoted values)
    const attrs: Record<string, string> = {};
    const attrRegex = /(\w+)=(?:"([^"]*)"|(\S+))/g;

    let match;
    while ((match = attrRegex.exec(content)) !== null) {
      const key = match[1];
      const value = match[2] || match[3]; // Quoted or unquoted value
      attrs[key] = value;
    }

    // Type is required, default to 'html' if missing
    const type = (attrs.type as ArtifactType) || 'html';

    return {
      type,
      id: attrs.id,
      title: attrs.title,
    };
  }

  /**
   * Strip artifact markers from text, leaving just the prose
   */
  stripArtifacts(agentOutput: string): string {
    const regex = new RegExp(
      `${this.escapeRegex(ARTIFACT_START_MARKER)}[^>]*-->[\\s\\S]*?${this.escapeRegex(ARTIFACT_END_MARKER)}`,
      'g'
    );
    return agentOutput.replace(regex, '').trim();
  }

  /**
   * Check if text contains any artifact markers
   */
  hasArtifacts(text: string): boolean {
    return text.includes(ARTIFACT_START_MARKER) && text.includes(ARTIFACT_END_MARKER);
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export const artifactParser = new ArtifactParser();
