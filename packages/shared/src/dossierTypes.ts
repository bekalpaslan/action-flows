/**
 * Intel Dossier Types
 * Types for the Intel workbench dossier system
 * Supports persistent intelligence monitoring and widget-based layout
 */

// ============================================================================
// Branded Types
// ============================================================================

/** Branded type for dossier IDs (pattern: dossier-{timestamp}-{random}) */
export type DossierId = string & { readonly __brand: 'DossierId' };

/** Branded type for suggestion IDs */
export type SuggestionId = string & { readonly __brand: 'SuggestionId' };

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new DossierId with timestamp and random suffix
 */
export function createDossierId(): DossierId {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `dossier-${timestamp}-${random}` as DossierId;
}

/**
 * Create a new SuggestionId with timestamp and random suffix
 */
export function createSuggestionId(): SuggestionId {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `suggestion-${timestamp}-${random}` as SuggestionId;
}

// ============================================================================
// Widget Types
// ============================================================================

/** Known widget types for Intel dossier layouts */
export type WidgetType =
  | 'StatCard'
  | 'FileTree'
  | 'InsightCard'
  | 'AlertPanel'
  | 'CodeHealthMeter'
  | 'SnippetPreview';

/** Layout types for dossier widget organization */
export type LayoutType = 'grid-2col' | 'grid-3col' | 'stack';

/** Widget descriptor — describes a single widget in the layout */
export interface WidgetDescriptor {
  /** Widget type (known types or custom future types) */
  type: WidgetType | string;
  /** Grid column span (1-3) */
  span: number;
  /** Widget-specific data payload */
  data: Record<string, unknown>;
}

/** Layout descriptor — describes the overall dossier layout */
export interface LayoutDescriptor {
  /** Layout strategy */
  layout: LayoutType;
  /** Ordered list of widgets in the layout */
  widgets: WidgetDescriptor[];
}

// ============================================================================
// Dossier Types
// ============================================================================

/** Dossier analysis status */
export type DossierStatus = 'idle' | 'analyzing' | 'error';

/** Historical snapshot of a dossier's layout */
export interface DossierHistoryEntry {
  /** When this snapshot was created */
  timestamp: string;
  /** The layout at that point in time */
  layoutDescriptor: LayoutDescriptor;
  /** Files that changed since last snapshot (if applicable) */
  changedFiles?: string[];
}

/** Intel Dossier — persistent intelligence monitoring configuration */
export interface IntelDossier {
  /** Unique dossier identifier */
  id: DossierId;
  /** Display name for this dossier */
  name: string;
  /** Target files/patterns to monitor */
  targets: string[];
  /** Context/description for what this dossier monitors */
  context: string;
  /** When this dossier was created */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Number of times analysis has been run */
  analysisCount: number;
  /** Current analysis status */
  status: DossierStatus;
  /** Current widget layout (null if never analyzed) */
  layoutDescriptor: LayoutDescriptor | null;
  /** Historical snapshots of layout changes */
  history: DossierHistoryEntry[];
  /** Error message if status is 'error' */
  error: string | null;
}

// ============================================================================
// Suggestion Types
// ============================================================================

/** Suggestion entry — tracks widget suggestions from Claude */
export interface SuggestionEntry {
  /** Unique suggestion identifier */
  id: SuggestionId;
  /** Suggestion type */
  type: 'widget_suggestion';
  /** Which dossier requested this widget */
  requestedBy: DossierId;
  /** What widget type was needed */
  needed: string;
  /** Why this widget was requested */
  reason: string;
  /** Fallback content when widget doesn't exist */
  fallback: {
    /** Fallback format type */
    type: 'raw' | 'markdown';
    /** Fallback content */
    content: string;
  };
  /** How many times this widget has been requested */
  frequency: number;
  /** When this suggestion was first created */
  timestamp: string;
}
