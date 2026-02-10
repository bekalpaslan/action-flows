/**
 * Chrome MCP Respect Check Helpers
 *
 * This module exports the RESPECT_CHECK_SCRIPT - a self-contained JavaScript
 * function that runs in-browser via Chrome MCP's evaluate_script tool.
 *
 * Purpose: Verify every UI component stays within its spatial boundaries.
 * No overflows, no viewport escapes, no parent containment violations.
 *
 * The script returns a structured RespectCheckResult (see chrome-mcp-utils.ts).
 */

export const RESPECT_CHECK_SCRIPT = `(() => {
  const componentsToCheck = [
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
    { selector: '.top-bar-tabs', type: 'topbar' }
  ];

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const violations = [];
  const clean = [];
  let totalChecked = 0;
  let totalElementsFound = 0;
  const summary = { high: 0, medium: 0, low: 0 };

  componentsToCheck.forEach(({ selector, type, expected, knownOverflowVisible }) => {
    const elements = document.querySelectorAll(selector);
    totalElementsFound += elements.length;

    elements.forEach((el) => {
      totalChecked++;
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
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
      }

      // Check parent containment for panel/content-area/widget types
      if ((type === 'panel' || type === 'content-area' || type === 'widget') && parentRect && !knownOverflowVisible) {
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
    clean
  };
})();`;
