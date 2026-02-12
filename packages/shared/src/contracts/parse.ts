/**
 * Component Behavioral Contract Markdown Parser
 *
 * Parses *.contract.md files and returns structured ComponentBehavioralContract objects.
 * Handles markdown tables, lists, code blocks, and key-value pairs.
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import type {
  ComponentBehavioralContract,
  Identity,
  RenderLocation,
  RenderCondition,
  Lifecycle,
  LifecycleEffect,
  PropsContract,
  PropField,
  CallbackProp,
  StateOwnership,
  StateField,
  ContextField,
  DerivedField,
  Interactions,
  ParentInteraction,
  ChildInteraction,
  SiblingInteraction,
  ContextInteraction,
  SideEffects,
  APICall,
  WebSocketEvent,
  Timer,
  LocalStorageOp,
  DOMManipulation,
  ElectronIPC,
  TestHooks,
  VisualLandmark,
  HealthChecks,
  HealthCheck,
  PerformanceCheck,
  Dependencies,
  Metadata,
  InteractionMechanism,
  ContextRole,
  TimerType,
  StorageOperation,
  ElectronIPCDirection,
  HealthCheckType,
} from './schema.js';

// ============================================================================
// Parser Utilities
// ============================================================================

/**
 * Split markdown by heading level 2 (##)
 */
function splitBySections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = markdown.split('\n');
  let currentSection = 'metadata';
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection && currentContent.length > 0) {
        sections.set(currentSection, currentContent.join('\n'));
      }
      currentSection = line.replace(/^## /, '').trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  if (currentSection && currentContent.length > 0) {
    sections.set(currentSection, currentContent.join('\n'));
  }

  return sections;
}

/**
 * Extract key-value pairs from text (e.g., **File:** `path`)
 */
function extractKeyValues(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = text.split('\n');

  for (const line of lines) {
    const match = line.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
    if (match && match[1] && match[2]) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove backticks if present
      value = value.replace(/^`(.+)`$/, '$1');
      result[key] = value;
    }
  }

  return result;
}

/**
 * Parse markdown table into array of objects
 * Table format:
 * | Header1 | Header2 |
 * |---------|---------|
 * | value1  | value2  |
 */
function parseTable(tableText: string): Record<string, string>[] {
  const lines = tableText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.startsWith('|'));

  if (lines.length < 3) return [];

  // Parse header
  const header = lines[0]
    ?.split('|')
    .map(cell => cell.trim())
    .filter(cell => cell.length > 0) ?? [];

  // Parse rows (skip divider at line 1)
  const rows: Record<string, string>[] = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const cells = line
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);

    if (cells.length === header.length) {
      const row: Record<string, string> = {};
      for (let j = 0; j < header.length; j++) {
        const headerKey = header[j];
        const cellValue = cells[j];
        if (headerKey && cellValue) {
          row[headerKey] = cellValue;
        }
      }
      // Skip rows that are entirely N/A
      if (!Object.values(row).every(v => v === 'N/A')) {
        rows.push(row);
      }
    }
  }

  return rows;
}

/**
 * Parse list items (lines starting with - or *)
 */
function parseListItems(text: string): string[] {
  const items: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const match = line.match(/^[\s]*[-*]\s+(.+)$/);
    if (match && match[1]) {
      items.push(match[1].trim());
    }
  }

  return items;
}

/**
 * Extract code block content
 */
function extractCodeBlock(text: string, language: string = ''): string {
  const fence = '```';
  let inBlock = false;
  let blockLanguage = '';
  let content: string[] = [];

  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith(fence)) {
      if (!inBlock) {
        inBlock = true;
        blockLanguage = line.replace(fence, '').trim();
        if (language && !blockLanguage.includes(language)) {
          continue; // Skip blocks with different language
        }
      } else {
        // End of block
        if (!language || blockLanguage.includes(language)) {
          return content.join('\n');
        }
        inBlock = false;
        content = [];
      }
    } else if (inBlock && (!language || blockLanguage.includes(language))) {
      content.push(line);
    }
  }

  return content.join('\n');
}

// ============================================================================
// Section-Specific Parsers
// ============================================================================

function parseIdentity(text: string, fileContent: string): Identity {
  const keyValues = extractKeyValues(fileContent);

  // Extract from list items
  const items = parseListItems(text);
  const componentName = items
    .find(item => item.startsWith('Component Name:'))
    ?.replace(/Component Name:\s*/, '')
    .trim() || keyValues['Component Name'] || 'Unknown';

  const introduced = items
    .find(item => item.startsWith('Introduced:'))
    ?.replace(/Introduced:\s*/, '')
    .trim() || '2026-01-01';

  const description = items
    .find(item => item.startsWith('Description:'))
    ?.replace(/Description:\s*/, '')
    .trim() || '';

  const validTypes = ['page', 'feature', 'widget', 'utility'] as const;
  const rawType = keyValues['Type'];
  const type: typeof validTypes[number] = validTypes.includes(rawType as any)
    ? (rawType as typeof validTypes[number])
    : 'widget';

  return {
    componentName: componentName.replace(/\([^)]*\)/, '').trim(), // Remove parentheticals
    filePath: keyValues['File']?.replace(/^packages\/app\/src\//, '') || '',
    parentGroup: keyValues['Parent Group'] || '',
    type,
    introduced,
    description,
  };
}

function parseRenderLocation(text: string): RenderLocation {
  const keyValues = extractKeyValues(text);

  // Parse mounts under (list items)
  const mountItems = text.match(/\*\*Mounts Under:\*\*[\s\S]*?(?=\n\n|\n\*\*)/)?.[0] || '';
  const mountsUnder = parseListItems(mountItems);

  // Parse render conditions (numbered list)
  const condItems = text.match(/\*\*Render Conditions:\*\*[\s\S]*?(?=\n\n|\n\*\*)/)?.[0] || '';
  const conditionLines = condItems.split('\n').filter(l => /^\d+\./.test(l.trim()));

  const conditions: RenderCondition[] = conditionLines.map(line => {
    // Format: 1. {Condition description} (`{code expression}`)
    const match = line.match(/^\d+\.\s+(.+?)\s*\(\`([^`]+)\`\)/);
    if (match && match[1] && match[2]) {
      return {
        type: 'prop',
        description: match[1].trim(),
        code: match[2].trim(),
      };
    }
    return { type: 'prop', description: line.trim(), code: '' };
  });

  const validPositions = ['relative', 'absolute', 'fixed', 'sticky'] as const;
  const rawPosition = keyValues['Positioning']?.toLowerCase() ?? '';
  const position: typeof validPositions[number] | null = rawPosition && validPositions.includes(rawPosition as any)
    ? (rawPosition as typeof validPositions[number])
    : null;

  return {
    mountsUnder,
    conditions,
    position,
    zIndex: keyValues['Z-Index'] === 'N/A' ? undefined : parseInt(keyValues['Z-Index'] ?? '') || undefined,
  };
}

function parseLifecycle(text: string): Lifecycle {
  // Mount triggers
  const mountText = text.match(/\*\*Mount Triggers:\*\*[\s\S]*?(?=\n\n|\n\*\*)/)?.[0] || '';
  const mountTriggers = parseListItems(mountText);

  // Key effects
  const effectsText = text.match(/\*\*Key Effects:\*\*[\s\S]*?(?=\n\n|\n\*\*)/)?.[0] || '';
  const keyEffects = parseKeyEffects(effectsText);

  // Cleanup actions
  const cleanupText = text.match(/\*\*Cleanup Actions:\*\*[\s\S]*?(?=\n\n|\n\*\*)/)?.[0] || '';
  const cleanup = parseListItems(cleanupText);

  // Unmount triggers
  const unmountText = text.match(/\*\*Unmount Triggers:\*\*[\s\S]*?(?=\n\n|\n\*\*)/)?.[0] || '';
  const unmountTriggers = parseListItems(unmountText);

  return {
    mountTriggers,
    keyEffects,
    cleanup,
    unmountTriggers,
  };
}

function parseKeyEffects(text: string): LifecycleEffect[] {
  const effects: LifecycleEffect[] = [];
  const effectBlocks = text.split(/^\d+\.\s+/m).filter(block => block.trim());

  for (const block of effectBlocks) {
    // Extract dependencies from backticks
    const depsMatch = block.match(/\*\*Dependencies:\*\*\s*`([^`]+)`/);
    const dependencies = depsMatch
      ? (depsMatch[1] ?? '')
          .replace(/[\[\]]/g, '')
          .split(',')
          .map(d => d.trim())
      : [];

    // Extract side effects
    const sideEffectText = block.match(/\*\*Side Effects:\*\*\s*(.+?)(?=\n\*\*|$)/)?.[1] || '';
    const sideEffects = sideEffectText.trim() ? [sideEffectText.trim()] : [];

    // Extract cleanup
    const cleanupMatch = block.match(/\*\*Cleanup:\*\*\s*(.+?)(?=\n\*\*|$)/);
    const cleanup = cleanupMatch ? cleanupMatch[1]?.trim() : undefined;

    // Extract condition
    const conditionMatch = block.match(/\*\*Condition:\*\*\s*(.+?)(?=\n\*\*|$)/);
    const runCondition = conditionMatch ? conditionMatch[1]?.trim() : undefined;

    effects.push({
      dependencies,
      sideEffects,
      cleanup: cleanup === 'None' || cleanup === 'none' ? undefined : cleanup,
      runCondition,
    });
  }

  return effects;
}

function parsePropsContract(text: string): PropsContract {
  // Parse inputs table
  const inputsText = text.match(/###?\s*Inputs[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const inputsTable = parseTable(inputsText);
  const inputs: PropField[] = inputsTable.map(row => ({
    name: row['Prop'] || '',
    type: row['Type'] || '',
    required: (row['Required'] || '').includes('✅'),
    defaultValue: row['Default'] !== 'N/A' ? row['Default'] : undefined,
    description: row['Description'] || '',
  }));

  // Parse callbacks up table
  const callbacksUpText = text.match(/###?\s*Callbacks Up[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const callbacksUpTable = parseTable(callbacksUpText);
  const callbacksUp: CallbackProp[] = callbacksUpTable.map(row => ({
    name: row['Callback'] || '',
    signature: row['Signature'] || '',
    description: row['Description'] || '',
    emittedBy: row['Emitted By'] || undefined,
  }));

  // Parse callbacks down table
  const callbacksDownText = text.match(/###?\s*Callbacks Down[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const callbacksDownTable = parseTable(callbacksDownText);
  const callbacksDown: CallbackProp[] = callbacksDownTable.map(row => ({
    name: row['Callback'] || '',
    signature: row['Signature'] || '',
    description: row['Description'] || '',
    passedTo: row['Passed To'] || undefined,
  }));

  return { inputs, callbacksUp, callbacksDown };
}

function parseStateOwnership(text: string): StateOwnership {
  // Local state table
  const localStateText = text.match(/###?\s*Local State[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const localStateTable = parseTable(localStateText);
  const localState: StateField[] = localStateTable.map(row => ({
    name: row['State'] || '',
    type: row['Type'] || '',
    initialValue: row['Initial'] || '',
    updatedBy: (row['Updated By'] || '').split(',').map(s => s.trim()),
  }));

  // Context consumption table
  const contextText = text.match(/###?\s*Context Consumption[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const contextTable = parseTable(contextText);
  const contextConsumption: ContextField[] = contextTable.map(row => ({
    contextName: row['Context'] || '',
    valuesConsumed: (row['Values Used'] || '').split(',').map(s => s.trim()),
  }));

  // Derived state table
  const derivedText = text.match(/###?\s*Derived State[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const derivedTable = parseTable(derivedText);
  const derivedState: DerivedField[] = derivedTable.map(row => ({
    name: row['Name'] || '',
    type: row['Type'] || '',
    dependencies: (row['Dependencies'] || '')
      .replace(/[\[\]`]/g, '')
      .split(',')
      .map(s => s.trim()),
    computation: row['Computation'] || '',
  }));

  // Custom hooks (list items)
  const hooksText = text.match(/###?\s*Custom Hooks[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const customHooks = parseListItems(hooksText)
    .map(item => item.replace(/\s*—.*/, '').replace(/`/g, '').trim())
    .filter(item => item.length > 0);

  return {
    localState,
    contextConsumption,
    derivedState,
    customHooks,
  };
}

function parseInteractions(text: string): Interactions {
  // Parent communication
  const parentText = text.match(/###?\s*Parent Communication[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const rawParentMechanism = extractKeyValue(parentText, 'Mechanism') || 'prop-callback';
  const validParentMechanisms: InteractionMechanism[] = ['prop-callback', 'context', 'event', 'ref', 'parent-mediated'];
  const parentMechanism: InteractionMechanism = validParentMechanisms.includes(rawParentMechanism as InteractionMechanism)
    ? (rawParentMechanism as InteractionMechanism)
    : 'prop-callback';
  const parentDescription = extractKeyValue(parentText, 'Description') || '';
  const parentExample = extractKeyValue(parentText, 'Example') || undefined;
  const parentCommunication: ParentInteraction[] =
    parentDescription || parentMechanism
      ? [
          {
            mechanism: parentMechanism,
            description: parentDescription,
            example: parentExample,
          },
        ]
      : [];

  // Child communication (could be multiple)
  const childText = text.match(/###?\s*Child Communication[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const childBlocks = childText.split(/\n- \*\*Child:\*\*/).filter(b => b.trim());
  const validChildMechanisms: Array<'props' | 'context' | 'ref'> = ['props', 'context', 'ref'];
  const childCommunication: ChildInteraction[] = childBlocks.map(block => {
    const childComponent = (block.match(/\*\*Child:\*\*\s*(.+?)(?=\n|$)/)?.[1] || '').trim();
    const rawMechanism = block.match(/\*\*Mechanism:\*\*\s*(.+?)(?=\n|$)/)?.[1] || 'props';
    const mechanism: 'props' | 'context' | 'ref' = validChildMechanisms.includes(rawMechanism as any)
      ? (rawMechanism as 'props' | 'context' | 'ref')
      : 'props';
    const dataFlow = (block.match(/\*\*Data Flow:\*\*\s*(.+?)(?=\n|$)/)?.[1] || '').trim();
    return { childComponent, mechanism, dataFlow };
  });

  // Sibling communication
  const siblingText = text.match(/###?\s*Sibling Communication[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const siblingBlocks = siblingText.split(/\n- \*\*Sibling:\*\*/).filter(b => b.trim());
  const validSiblingMechanisms: InteractionMechanism[] = ['prop-callback', 'context', 'event', 'ref', 'parent-mediated'];
  const siblingCommunication: SiblingInteraction[] = siblingBlocks.map(block => {
    const sibling = (block.match(/\*\*Sibling:\*\*\s*(.+?)(?=\n|$)/)?.[1] || '').trim();
    const rawMechanism = block.match(/\*\*Mechanism:\*\*\s*(.+?)(?=\n|$)/)?.[1] || 'context';
    const mechanism: InteractionMechanism = validSiblingMechanisms.includes(rawMechanism as InteractionMechanism)
      ? (rawMechanism as InteractionMechanism)
      : 'context';
    const description = (block.match(/\*\*Description:\*\*\s*(.+?)(?=\n|$)/)?.[1] || '').trim();
    return { sibling, mechanism, description };
  });

  // Context interaction
  const contextText = text.match(/###?\s*Context Interaction[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const contextName = extractKeyValue(contextText, 'Context') || '';
  const rawRole = extractKeyValue(contextText, 'Role') || 'consumer';
  const validRoles: ContextRole[] = ['consumer', 'provider'];
  const role: ContextRole = validRoles.includes(rawRole as ContextRole)
    ? (rawRole as ContextRole)
    : 'consumer';
  const operationsText = contextText.match(/\*\*Operations:\*\*\s*(.+?)(?=\n|$)/)?.[1] || '';
  const operations = operationsText ? [operationsText.trim()] : [];
  const contextCommunication: ContextInteraction[] =
    contextName || operations.length > 0
      ? [
          {
            contextName,
            role,
            operations,
          },
        ]
      : [];

  return {
    parentCommunication,
    childCommunication,
    siblingCommunication,
    contextCommunication,
  };
}

function parseSideEffects(text: string): SideEffects {
  // API calls table
  const apiText = text.match(/###?\s*API Calls[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const apiTable = parseTable(apiText);
  const apiCalls: APICall[] = apiTable.map(row => ({
    endpoint: row['Endpoint'] || '',
    method: row['Method'] || '',
    trigger: row['Trigger'] || '',
    response: row['Response Handling'] || '',
  }));

  // WebSocket events table
  const wsText = text.match(/###?\s*WebSocket Events[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const wsTable = parseTable(wsText);
  const webSocketEvents: WebSocketEvent[] = wsTable.map(row => ({
    eventType: row['Event Type'] || '',
    trigger: row['Trigger'] || '',
    handler: row['Handler'] || '',
  }));

  // Timers table
  const timerText = text.match(/###?\s*Timers[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const timerTable = parseTable(timerText);
  const validTimerTypes: TimerType[] = ['timeout', 'interval'];
  const timers: Timer[] = timerTable.map(row => {
    const rawType = row['Type'] || 'timeout';
    const type: TimerType = validTimerTypes.includes(rawType as TimerType)
      ? (rawType as TimerType)
      : 'timeout';
    return {
      type,
      duration: parseInt(row['Duration'] || '0') || 0,
      purpose: row['Purpose'] || '',
      cleanup: (row['Cleanup'] || '').includes('✅'),
    };
  });

  // LocalStorage operations table
  const storageText = text.match(/###?\s*LocalStorage Operations[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const storageTable = parseTable(storageText);
  const validStorageOps: StorageOperation[] = ['read', 'write'];
  const localStorage: LocalStorageOp[] = storageTable.map(row => {
    const rawOperation = row['Operation'] || 'read';
    const operation: StorageOperation = validStorageOps.includes(rawOperation as StorageOperation)
      ? (rawOperation as StorageOperation)
      : 'read';
    return {
      key: row['Key'] || '',
      operation,
      trigger: row['Trigger'] || '',
      value: row['Value'],
    };
  });

  // DOM manipulation table
  const domText = text.match(/###?\s*DOM Manipulation[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const domTable = parseTable(domText);
  const domManipulation: DOMManipulation[] = domTable.map(row => ({
    target: row['Target'] || '',
    operation: row['Operation'] || '',
    trigger: row['Trigger'] || '',
  }));

  // Electron IPC table
  const electronText = text.match(/###?\s*Electron IPC[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const electronTable = parseTable(electronText);
  const validDirections: ElectronIPCDirection[] = ['send', 'receive'];
  const electronIPC: ElectronIPC[] = electronTable.map(row => {
    const rawDirection = row['Direction'] || 'send';
    const direction: ElectronIPCDirection = validDirections.includes(rawDirection as ElectronIPCDirection)
      ? (rawDirection as ElectronIPCDirection)
      : 'send';
    return {
      channel: row['Channel'] || '',
      direction,
      purpose: row['Purpose'] || '',
    };
  });

  return {
    apiCalls,
    webSocketEvents,
    timers,
    localStorage,
    domManipulation,
    electronIPC: electronIPC.length > 0 ? electronIPC : undefined,
  };
}

function parseTestHooks(text: string): TestHooks {
  // CSS selectors (list items)
  const cssText = text.match(/\*\*CSS Selectors:\*\*[\s\S]*?(?=\n\*\*)/)?.[0] || '';
  const cssSelectors = parseListItems(cssText);

  // Data test IDs (list items)
  const dataText = text.match(/\*\*Data Test IDs:\*\*[\s\S]*?(?=\n\*\*)/)?.[0] || '';
  const dataTestIds = parseListItems(dataText).filter(id => !id.includes('N/A') && !id.includes('use'));

  // ARIA labels (list items)
  const ariaText = text.match(/\*\*ARIA Labels:\*\*[\s\S]*?(?=\n\*\*)/)?.[0] || '';
  const ariaLabels = parseListItems(ariaText).filter(label => !label.includes('N/A') && !label.includes('None'));

  // Visual landmarks (numbered list)
  const landmarkText = text.match(/\*\*Visual Landmarks:\*\*[\s\S]*?(?=\n\*\*|----|$)/)?.[0] || '';
  const landmarkLines = landmarkText.split('\n').filter(l => /^\d+\./.test(l.trim()));
  const visualLandmarks: VisualLandmark[] = landmarkLines.map(line => {
    // Format: 1. {Description} (`.{css-class}`) — {unique feature}
    const match = line.match(/^\d+\.\s+(.+?)\s*\(\`\.([^`]+)\`\)\s*—\s*(.+)$/);
    if (match) {
      return {
        description: (match[1] ?? '').trim(),
        cssClass: (match[2] ?? '').trim(),
        uniqueFeature: (match[3] ?? '').trim(),
      };
    }
    return { description: line.trim(), cssClass: '', uniqueFeature: '' };
  });

  return {
    cssSelectors,
    dataTestIds: dataTestIds.length > 0 ? dataTestIds : undefined,
    ariaLabels: ariaLabels.length > 0 ? ariaLabels : undefined,
    visualLandmarks,
  };
}

function parseHealthChecks(text: string): HealthChecks {
  // Critical checks
  const criticalText = text.match(/###?\s*Critical Checks[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const critical = parseHealthCheckBlocks(criticalText);

  // Warning checks
  const warningText = text.match(/###?\s*Warning Checks[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const warning = parseHealthCheckBlocks(warningText);

  // Performance benchmarks table
  const perfText = text.match(/###?\s*Performance Benchmarks[\s\S]*?(?=\n###|$)/)?.[0] || '';
  const perfTable = parseTable(perfText);
  const validMetrics: Array<'render-time' | 'bundle-size' | 'memory' | 'interaction-delay'> = ['render-time', 'bundle-size', 'memory', 'interaction-delay'];
  const performance: PerformanceCheck[] = perfTable.map(row => {
    const rawMetric = row['Metric'] || 'render-time';
    const metric: 'render-time' | 'bundle-size' | 'memory' | 'interaction-delay' = validMetrics.includes(rawMetric as any)
      ? (rawMetric as 'render-time' | 'bundle-size' | 'memory' | 'interaction-delay')
      : 'render-time';
    return {
      metric,
      threshold: parseInt(row['Threshold'] || '0') || 0,
      unit: row['Unit'] || 'ms',
      description: row['Description'] || '',
    };
  });

  return { critical, warning, performance };
}

function parseHealthCheckBlocks(text: string): HealthCheck[] {
  const checks: HealthCheck[] = [];
  const blocks = text.split(/#### HC-/).filter(b => b.trim());

  for (const block of blocks) {
    const idMatch = block.match(/^([^:]+):\s*(.+?)(?=\n-|\n\*\*|$)/);
    if (!idMatch) continue;

    const id = `HC-${(idMatch[1] ?? '').trim()}`;
    const title = (idMatch[2] ?? '').trim();

    const rawType = extractKeyValue(block, 'Type') || 'render';
    const validHealthCheckTypes: HealthCheckType[] = [
      'render', 'connection', 'context-registration', 'timeout', 'data-fetch',
      'interaction', 'boundary', 'data-integration', 'behavior', 'visual-feedback',
      'integration', 'accessibility'
    ];
    const type: HealthCheckType = validHealthCheckTypes.includes(rawType as HealthCheckType)
      ? (rawType as HealthCheckType)
      : 'render';
    const target = extractKeyValue(block, 'Target') || '';
    const condition = extractKeyValue(block, 'Condition') || '';
    const failureMode = extractKeyValue(block, 'Failure Mode') || '';
    const automationScript = extractCodeBlock(block, 'javascript');

    checks.push({
      id,
      type,
      target,
      condition,
      failureMode,
      automationScript: automationScript.trim() || undefined,
    });
  }

  return checks;
}

function parseDependencies(text: string): Dependencies {
  // Contexts (list items)
  const contextsText = text.match(/\*\*Required Contexts:\*\*[\s\S]*?(?=\n\*\*|$)/)?.[0] || '';
  const contexts = parseListItems(contextsText);

  // Hooks (list items)
  const hooksText = text.match(/\*\*Required Hooks:\*\*[\s\S]*?(?=\n\*\*|$)/)?.[0] || '';
  const hooks = parseListItems(hooksText).map(h => h.replace(/`/g, '').trim());

  // Child components (list items)
  const childrenText = text.match(/\*\*Child Components:\*\*[\s\S]*?(?=\n\*\*|$)/)?.[0] || '';
  const childComponents = parseListItems(childrenText);

  // Required props (list items)
  const propsText = text.match(/\*\*Required Props:\*\*[\s\S]*?(?=\n\*\*|$)/)?.[0] || '';
  const requiredProps = parseListItems(propsText).map(p => p.replace(/`/g, '').trim());

  return {
    contexts,
    hooks,
    childComponents,
    requiredProps,
  };
}

function parseMetadata(text: string, keyValues: Record<string, string>): Metadata {
  const lastReviewed = keyValues['Last Reviewed'] || '2026-01-01';
  const contractVersion = keyValues['Contract Version'] || '1.0.0';

  // Extract from bottom of document
  const authored = text.match(/\*\*Contract Authored:\*\*\s*([^\n]+)/)?.[1]?.trim() || '2026-01-01';
  const updated = text.match(/\*\*Last Updated:\*\*\s*([^\n]+)/)?.[1]?.trim() || '2026-01-01';
  const notes = text.match(/^## Notes[\s\S]*?(?=\n##|$)/m)?.[0]?.replace(/^## Notes\s*/, '') || undefined;

  return {
    lastReviewed,
    contractVersion,
    notes: notes?.trim() || undefined,
    authored,
    updated,
  };
}

/**
 * Extract single key-value pair from text
 */
function extractKeyValue(text: string, key: string): string {
  const match = text.match(new RegExp(`\\*\\*${key}:\\*\\*\\s*(.+?)(?=\\n|$)`));
  return match ? (match[1] ?? '').trim() : '';
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse a markdown contract string into a ComponentBehavioralContract object
 */
export function parseContract(markdown: string): ComponentBehavioralContract {
  const sections = splitBySections(markdown);
  const metadataText = markdown.split('---')[0] ?? '';
  const keyValues = extractKeyValues(metadataText);

  const identity = parseIdentity(sections.get('Identity') || '', metadataText ?? '');
  const renderLocation = parseRenderLocation(sections.get('Render Location') || '');
  const lifecycle = parseLifecycle(sections.get('Lifecycle') || '');
  const propsContract = parsePropsContract(sections.get('Props Contract') || '');
  const stateOwnership = parseStateOwnership(sections.get('State Ownership') || '');
  const interactions = parseInteractions(sections.get('Interactions') || '');
  const sideEffects = parseSideEffects(sections.get('Side Effects') || '');
  const testHooks = parseTestHooks(sections.get('Test Hooks') || '');
  const healthChecks = parseHealthChecks(sections.get('Health Checks') || '');
  const dependencies = parseDependencies(sections.get('Dependencies') || '');
  const metadata = parseMetadata(markdown, keyValues);

  return {
    identity,
    renderLocation,
    lifecycle,
    propsContract,
    stateOwnership,
    interactions,
    sideEffects,
    testHooks,
    healthChecks,
    dependencies,
    metadata,
  };
}

/**
 * Parse a contract from a file path
 */
export async function parseContractFile(filePath: string): Promise<ComponentBehavioralContract> {
  const markdown = await readFile(filePath, 'utf-8');
  return parseContract(markdown);
}

/**
 * Parse all contracts from a directory
 */
export async function parseAllContracts(
  contractsDir: string
): Promise<Map<string, ComponentBehavioralContract>> {
  const contracts = new Map<string, ComponentBehavioralContract>();

  async function walkDir(dir: string, prefix: string = '') {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await walkDir(fullPath, prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.name.endsWith('.contract.md')) {
        try {
          const key = prefix ? `${prefix}/${entry.name.replace('.contract.md', '')}` : entry.name.replace('.contract.md', '');
          const contract = await parseContractFile(fullPath);
          contracts.set(key, contract);
        } catch (error) {
          console.warn(`Failed to parse contract ${fullPath}:`, error);
        }
      }
    }
  }

  await walkDir(contractsDir);
  return contracts;
}
