/**
 * useRespectCheck Hook
 * Executes boundary checks on all UI components via RESPECT_CHECK_SCRIPT
 */

import { useState, useCallback } from 'react';
import type { RespectCheckResult } from '@afw/shared';

/**
 * RESPECT_CHECK_SCRIPT - Self-contained spatial boundary check
 * Runs in-browser to verify components stay within their bounds
 */
const RESPECT_CHECK_SCRIPT = `(() => {
  const componentsToCheck = [
    // ============================================================
    // ORIGINAL 24 SELECTORS (preserved exactly)
    // ============================================================
    { selector: '.workbench-layout', type: 'layout-shell', expected: { width: 'viewport', height: 'viewport' } },
    { selector: '.top-bar', type: 'topbar', expected: { height: 52 } },
    { selector: '.session-sidebar', type: 'sidebar', expected: { width: 240 } },
    { selector: '.workbench-body', type: 'layout-shell' },
    { selector: '.workbench-main', type: 'layout-shell' },
    { selector: '.workbench-content', type: 'layout-shell' },
    { selector: '.session-panel-layout', type: 'panel' },
    { selector: '.session-panel-layout__left', type: 'panel', expected: { minWidth: 280, maxWidthPercent: 50 } },
    { selector: '.session-panel-layout__right', type: 'panel' },
    { selector: '.chat-panel', type: 'panel', expected: { minWidth: 280 } },
    { selector: '.chat-panel__messages', type: 'content-area' },
    { selector: '.chat-panel__info-bar', type: 'content-area' },
    { selector: '.chat-panel__input-field', type: 'input', expected: { minHeight: 36, maxHeight: 120 } },
    { selector: '.chat-panel__send-btn', type: 'input', expected: { width: 36, height: 36 } },
    { selector: '.chat-bubble', type: 'widget', expected: { maxWidthPercent: 85 } },
    { selector: '.right-visualization-area', type: 'visualization' },
    { selector: '.flow-visualization', type: 'visualization' },
    { selector: '.chain-dag-container', type: 'visualization' },
    { selector: '.squad-panel', type: 'widget' },
    { selector: '.workbench-bottom', type: 'layout-shell', knownOverflowVisible: true },
    { selector: '.left-panel-stack', type: 'panel' },
    { selector: '.command-palette-modal', type: 'modal', expected: { maxWidth: 600, maxHeight: 500 } },
    { selector: '.sidebar-content', type: 'content-area' },
    { selector: '.top-bar-tabs', type: 'topbar' },

    // ============================================================
    // HIGH PRIORITY ADDITIONS (9 selectors)
    // ============================================================
    { selector: '.app-sidebar', type: 'sidebar', expected: { width: 240, minWidthCollapsed: 64, height: 'viewport' } },
    { selector: '.squad-panel-orchestrator .agent-character-card', type: 'card', expected: { width: 200 } },
    { selector: '.squad-panel-side .agent-character-card', type: 'card', expected: { width: 140 } },
    { selector: '.command-palette-backdrop', type: 'fixed-overlay', expected: { width: 'viewport', height: 'viewport' } },
    { selector: '.monaco-editor-container', type: 'editor', expected: { widthPercent: 100, heightPercent: 100 } },
    { selector: '.work-workbench', type: 'workbench-variant', expected: { heightPercent: 100 } },
    { selector: '.review-workbench', type: 'workbench-variant', expected: { heightPercent: 100 } },
    { selector: '.harmony-workbench', type: 'workbench-variant', expected: { heightPercent: 100 } },
    { selector: '.registry-browser__tree', type: 'tree-view' },

    // ============================================================
    // MEDIUM PRIORITY ADDITIONS (20 selectors)
    // ============================================================
    { selector: '.app-sidebar__header', type: 'layout-shell', expected: { height: 60 } },
    { selector: '.app-sidebar__nav-section', type: 'content-area' },
    { selector: '.app-sidebar__footer', type: 'layout-shell', expected: { minHeight: 60 } },
    { selector: '.sidebar-header', type: 'layout-shell', expected: { height: 60 } },
    { selector: '.sidebar-footer', type: 'layout-shell', expected: { minHeight: 48 } },
    { selector: '.session-list', type: 'content-area' },
    { selector: '.agent-log-panel', type: 'inspector', expected: { maxWidth: 400 } },
    { selector: '.command-palette-results', type: 'content-area', expected: { maxHeight: 400 } },
    { selector: '.react-flow__controls', type: 'toolbar' },
    { selector: '.react-flow__minimap', type: 'widget' },
    { selector: '.editor-tabs-container', type: 'toolbar' },
    { selector: '.diff-view', type: 'editor' },
    { selector: '.change-preview', type: 'panel' },
    { selector: '.change-preview__header', type: 'layout-shell', expected: { height: 48 } },
    { selector: '.harmony-panel', type: 'inspector' },
    { selector: '.harmony-violations-list', type: 'content-area', expected: { maxHeight: 300 } },
    { selector: '.step-inspector', type: 'inspector' },
    { selector: '.step-inspector__logs', type: 'content-area', expected: { maxHeight: 400 } },
    { selector: '.telemetry-viewer', type: 'inspector' },
    { selector: '.telemetry-charts', type: 'data-grid' },

    // ============================================================
    // LOW PRIORITY ADDITIONS (16 selectors)
    // ============================================================
    { selector: '.discuss-button', type: 'fixed-overlay', expected: { zIndex: 100 } },
    { selector: '.discuss-dialog', type: 'dialog', expected: { maxWidth: 500, maxHeight: 400 } },
    { selector: '.toast', type: 'fixed-overlay', expected: { zIndex: 10000 } },
    { selector: '.persistent-toolbar', type: 'toolbar', expected: { height: 48 } },
    { selector: '.quick-action-bar', type: 'toolbar', expected: { height: 56 } },
    { selector: '.dossier-list', type: 'content-area' },
    { selector: '.dossier-view', type: 'inspector' },
    { selector: '.dossier-creation-dialog', type: 'dialog', expected: { maxWidth: 600, maxHeight: 500 } },
    { selector: '.explore-workbench', type: 'workbench-variant', expected: { heightPercent: 100 } },
    { selector: '.pm-workbench', type: 'workbench-variant', expected: { heightPercent: 100 } },
    { selector: '.maintenance-workbench', type: 'workbench-variant', expected: { heightPercent: 100 } },
    { selector: '.archive-workbench', type: 'workbench-variant', expected: { heightPercent: 100 } },
    { selector: '.canvas-workbench', type: 'workbench-variant', expected: { heightPercent: 100 } },
    { selector: '.intel-workbench', type: 'workbench-variant', expected: { heightPercent: 100 } },
    { selector: '.settings-workbench', type: 'workbench-variant', expected: { heightPercent: 100 } },
    { selector: '.respect-workbench', type: 'workbench-variant', expected: { heightPercent: 100 } }
  ];

  const TOTAL_KNOWN_COMPONENTS = 130;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const violations = [];
  const clean = [];
  let totalChecked = 0;
  let totalElementsFound = 0;
  let foundSelectors = 0;
  const summary = { high: 0, medium: 0, low: 0 };

  componentsToCheck.forEach(({ selector, type, expected, knownOverflowVisible }) => {
    const elements = Array.from(document.querySelectorAll(selector));
    if (elements.length > 0) foundSelectors++;
    totalElementsFound += elements.length;

    elements.forEach((el) => {
      totalChecked++;
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      if (!computed) return;
      const parent = el.parentElement;
      const parentRect = parent ? parent.getBoundingClientRect() : null;

      const metrics = {
        width: rect.width,
        height: rect.height,
        scrollWidth: el.scrollWidth,
        scrollHeight: el.scrollHeight,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight
      };

      const elementViolations = [];

      // Skip overflow checks if knownOverflowVisible is true
      if (!knownOverflowVisible) {
        // Check horizontal overflow (only if overflow-x is not auto/scroll)
        const overflowX = computed.overflowX;
        if (overflowX !== 'auto' && overflowX !== 'scroll' && el.scrollWidth > el.clientWidth + 1) {
          elementViolations.push({
            type: 'horizontal_overflow',
            severity: 'medium',
            message: \`Horizontal overflow detected: scrollWidth (\${el.scrollWidth}px) > clientWidth (\${el.clientWidth}px)\`,
            expected: \`scrollWidth <= clientWidth\`,
            actual: \`scrollWidth: \${el.scrollWidth}px, clientWidth: \${el.clientWidth}px\`
          });
          summary.medium++;
        }

        // Check vertical overflow (only if overflow-y is not auto/scroll)
        const overflowY = computed.overflowY;
        if (overflowY !== 'auto' && overflowY !== 'scroll' && el.scrollHeight > el.clientHeight + 1) {
          elementViolations.push({
            type: 'vertical_overflow',
            severity: 'low',
            message: \`Vertical overflow detected: scrollHeight (\${el.scrollHeight}px) > clientHeight (\${el.clientHeight}px)\`,
            expected: \`scrollHeight <= clientHeight\`,
            actual: \`scrollHeight: \${el.scrollHeight}px, clientHeight: \${el.clientHeight}px\`
          });
          summary.low++;
        }
      }

      // Check viewport containment for layout-shell and topbar types
      if ((type === 'layout-shell' || type === 'topbar') && !knownOverflowVisible) {
        if (rect.right > vw + 1 || rect.bottom > vh + 1 || rect.left < -1 || rect.top < -1) {
          elementViolations.push({
            type: 'viewport_escape',
            severity: 'high',
            message: \`Element escapes viewport bounds\`,
            expected: \`rect within viewport (0, 0, \${vw}, \${vh})\`,
            actual: \`rect: (\${rect.left.toFixed(1)}, \${rect.top.toFixed(1)}, \${rect.right.toFixed(1)}, \${rect.bottom.toFixed(1)})\`
          });
          summary.high++;
        }
      }

      // Check fixed dimension constraints
      if (expected) {
        if (expected.width === 'viewport' && Math.abs(rect.width - vw) > 1) {
          elementViolations.push({
            type: 'fixed_dim_mismatch',
            severity: 'high',
            message: \`Width should match viewport\`,
            expected: \`\${vw}px\`,
            actual: \`\${rect.width.toFixed(1)}px\`
          });
          summary.high++;
        }

        if (expected.height === 'viewport' && Math.abs(rect.height - vh) > 1) {
          elementViolations.push({
            type: 'fixed_dim_mismatch',
            severity: 'high',
            message: \`Height should match viewport\`,
            expected: \`\${vh}px\`,
            actual: \`\${rect.height.toFixed(1)}px\`
          });
          summary.high++;
        }

        if (typeof expected.width === 'number' && Math.abs(rect.width - expected.width) > 1) {
          elementViolations.push({
            type: 'fixed_dim_mismatch',
            severity: 'high',
            message: \`Width mismatch\`,
            expected: \`\${expected.width}px\`,
            actual: \`\${rect.width.toFixed(1)}px\`
          });
          summary.high++;
        }

        if (typeof expected.height === 'number' && Math.abs(rect.height - expected.height) > 1) {
          elementViolations.push({
            type: 'fixed_dim_mismatch',
            severity: 'high',
            message: \`Height mismatch\`,
            expected: \`\${expected.height}px\`,
            actual: \`\${rect.height.toFixed(1)}px\`
          });
          summary.high++;
        }

        // Min/max width constraints
        if (expected.minWidth && rect.width < expected.minWidth - 1) {
          elementViolations.push({
            type: 'min_constraint',
            severity: 'medium',
            message: \`Width below minimum\`,
            expected: \`>= \${expected.minWidth}px\`,
            actual: \`\${rect.width.toFixed(1)}px\`
          });
          summary.medium++;
        }

        if (expected.maxWidth && rect.width > expected.maxWidth + 1) {
          elementViolations.push({
            type: 'max_constraint',
            severity: 'medium',
            message: \`Width exceeds maximum\`,
            expected: \`<= \${expected.maxWidth}px\`,
            actual: \`\${rect.width.toFixed(1)}px\`
          });
          summary.medium++;
        }

        // Min/max height constraints
        if (expected.minHeight && rect.height < expected.minHeight - 1) {
          elementViolations.push({
            type: 'min_constraint',
            severity: 'medium',
            message: \`Height below minimum\`,
            expected: \`>= \${expected.minHeight}px\`,
            actual: \`\${rect.height.toFixed(1)}px\`
          });
          summary.medium++;
        }

        if (expected.maxHeight && rect.height > expected.maxHeight + 1) {
          elementViolations.push({
            type: 'max_constraint',
            severity: 'medium',
            message: \`Height exceeds maximum\`,
            expected: \`<= \${expected.maxHeight}px\`,
            actual: \`\${rect.height.toFixed(1)}px\`
          });
          summary.medium++;
        }

        // Percent-based max width constraint (for chat bubbles)
        if (expected.maxWidthPercent && parentRect) {
          const maxAllowedWidth = (parentRect.width * expected.maxWidthPercent) / 100;
          if (rect.width > maxAllowedWidth + 1) {
            elementViolations.push({
              type: 'max_constraint',
              severity: 'medium',
              message: \`Width exceeds \${expected.maxWidthPercent}% of parent\`,
              expected: \`<= \${maxAllowedWidth.toFixed(1)}px (\${expected.maxWidthPercent}% of parent)\`,
              actual: \`\${rect.width.toFixed(1)}px\`
            });
            summary.medium++;
          }
        }

        // Percent-based max width for panel types
        if (expected.maxWidthPercent && type === 'panel' && parentRect) {
          const maxAllowedWidth = (parentRect.width * expected.maxWidthPercent) / 100;
          if (rect.width > maxAllowedWidth + 1) {
            elementViolations.push({
              type: 'max_constraint',
              severity: 'medium',
              message: \`Panel width exceeds \${expected.maxWidthPercent}% of parent\`,
              expected: \`<= \${maxAllowedWidth.toFixed(1)}px (\${expected.maxWidthPercent}% of parent)\`,
              actual: \`\${rect.width.toFixed(1)}px\`
            });
            summary.medium++;
          }
        }

        // Percent-based height check (for editors and workbench-variants)
        if (expected.heightPercent && parentRect) {
          const expectedHeight = (parentRect.height * expected.heightPercent) / 100;
          if (rect.height < expectedHeight * 0.8) {
            elementViolations.push({
              type: 'min_constraint',
              severity: 'medium',
              message: \`Height below \${expected.heightPercent}% of parent (threshold: 80%)\`,
              expected: \`>= \${(expectedHeight * 0.8).toFixed(1)}px (\${expected.heightPercent}% of parent)\`,
              actual: \`\${rect.height.toFixed(1)}px\`
            });
            summary.medium++;
          }
        }

        // Percent-based width check (for editors)
        if (expected.widthPercent && parentRect) {
          const expectedWidth = (parentRect.width * expected.widthPercent) / 100;
          if (rect.width < expectedWidth * 0.8) {
            elementViolations.push({
              type: 'min_constraint',
              severity: 'medium',
              message: \`Width below \${expected.widthPercent}% of parent (threshold: 80%)\`,
              expected: \`>= \${(expectedWidth * 0.8).toFixed(1)}px (\${expected.widthPercent}% of parent)\`,
              actual: \`\${rect.width.toFixed(1)}px\`
            });
            summary.medium++;
          }
        }

        // z-index validation (for fixed-overlay, badge types)
        if (expected.zIndex !== undefined) {
          const actualZIndex = parseInt(computed.zIndex, 10);
          if (!isNaN(actualZIndex) && actualZIndex !== expected.zIndex) {
            elementViolations.push({
              type: 'z_index_mismatch',
              severity: 'medium',
              message: \`z-index does not match expected value\`,
              expected: \`z-index: \${expected.zIndex}\`,
              actual: \`z-index: \${actualZIndex}\`
            });
            summary.medium++;
          }
        }

        // Aspect ratio validation (for card types)
        if (expected.aspectRatio) {
          const actualRatio = rect.width / rect.height;
          if (Math.abs(actualRatio - expected.aspectRatio) > 0.1) {
            elementViolations.push({
              type: 'aspect_ratio_mismatch',
              severity: 'low',
              message: \`Aspect ratio mismatch\`,
              expected: \`ratio: \${expected.aspectRatio.toFixed(2)}\`,
              actual: \`ratio: \${actualRatio.toFixed(2)}\`
            });
            summary.low++;
          }
        }
      }

      // Fixed position escape check (for fixed-overlay, toolbar types)
      if ((type === 'fixed-overlay' || type === 'toolbar') && computed.position === 'fixed') {
        if (rect.right > vw + 1 || rect.bottom > vh + 1 || rect.left < -1 || rect.top < -1) {
          elementViolations.push({
            type: 'fixed_position_escape',
            severity: 'high',
            message: \`position:fixed element extends outside viewport\`,
            expected: \`rect within viewport (0, 0, \${vw}, \${vh})\`,
            actual: \`rect: (\${rect.left.toFixed(1)}, \${rect.top.toFixed(1)}, \${rect.right.toFixed(1)}, \${rect.bottom.toFixed(1)})\`
          });
          summary.high++;
        }
      }

      // Check parent containment for panel/content-area/widget/tree-view/inspector/editor types
      if ((type === 'panel' || type === 'content-area' || type === 'widget' || type === 'tree-view' || type === 'inspector' || type === 'editor' || type === 'data-grid') && parentRect && !knownOverflowVisible) {
        if (rect.right > parentRect.right + 1 || rect.bottom > parentRect.bottom + 1) {
          elementViolations.push({
            type: 'parent_escape',
            severity: 'medium',
            message: \`Element exceeds parent bounds\`,
            expected: \`rect within parent (\${parentRect.left.toFixed(1)}, \${parentRect.top.toFixed(1)}, \${parentRect.right.toFixed(1)}, \${parentRect.bottom.toFixed(1)})\`,
            actual: \`rect: (\${rect.left.toFixed(1)}, \${rect.top.toFixed(1)}, \${rect.right.toFixed(1)}, \${rect.bottom.toFixed(1)})\`
          });
          summary.medium++;
        }
      }

      // Record result
      if (elementViolations.length > 0) {
        violations.push({
          selector,
          type,
          violations: elementViolations,
          metrics
        });
      } else {
        clean.push({
          selector,
          type,
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    });
  });

  return {
    timestamp: new Date().toISOString(),
    viewportWidth: vw,
    viewportHeight: vh,
    totalChecked,
    totalElementsFound,
    totalViolations: summary.high + summary.medium + summary.low,
    violations,
    summary,
    clean,
    coverage: {
      totalKnownComponents: TOTAL_KNOWN_COMPONENTS,
      checkedSelectors: componentsToCheck.length,
      foundSelectors: foundSelectors,
      coveragePercent: Math.round((foundSelectors / TOTAL_KNOWN_COMPONENTS) * 100 * 10) / 10
    }
  };
})();`;

export interface UseRespectCheckResult {
  /** Check result data */
  result: RespectCheckResult | null;
  /** Whether a check is currently running */
  isRunning: boolean;
  /** Error message if check failed */
  error: string | null;
  /** Execute the respect check */
  runCheck: () => void;
  /** Timestamp of last successful check */
  lastCheckedAt: number | null;
}

/**
 * Custom hook for running spatial boundary checks on UI components
 */
export function useRespectCheck(): UseRespectCheckResult {
  const [result, setResult] = useState<RespectCheckResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);

  const runCheck = useCallback(() => {
    setIsRunning(true);
    setError(null);

    try {
      // Execute the script in the current browser context
      const checkFunction = new Function('return ' + RESPECT_CHECK_SCRIPT);
      const checkResult = checkFunction() as RespectCheckResult;

      setResult(checkResult);
      setLastCheckedAt(Date.now());
      setError(null);
    } catch (err) {
      console.error('Respect check failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  }, []);

  return {
    result,
    isRunning,
    error,
    runCheck,
    lastCheckedAt,
  };
}
