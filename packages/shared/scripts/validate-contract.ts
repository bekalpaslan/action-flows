#!/usr/bin/env tsx
/**
 * Contract Drift Validation Script
 *
 * Validates 4-layer alignment for all contract formats:
 * 1. CONTRACT.md specification
 * 2. TypeScript type definitions
 * 3. Zod schemas
 * 4. Parser implementations
 *
 * Usage:
 *   pnpm run contract:validate
 *   pnpm run contract:validate --json
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Types
// ============================================================================

type Severity = 'CRITICAL' | 'MEDIUM' | 'LOW';

interface DriftIssue {
  formatId: string;
  layer: 'spec' | 'type' | 'schema' | 'parser';
  severity: Severity;
  message: string;
  fieldName?: string;
}

interface FormatValidation {
  formatId: string;
  formatName: string;
  priority: string;
  layers: {
    spec: boolean;
    type: boolean;
    schema: boolean;
    parser: boolean;
  };
  issues: DriftIssue[];
  completeness: number; // 0-100%
}

interface ValidationReport {
  timestamp: string;
  totalFormats: number;
  aligned: number;
  driftDetected: number;
  criticalIssues: number;
  formats: FormatValidation[];
}

// ============================================================================
// Configuration
// ============================================================================

const FORMAT_MAPPING = {
  // Category 1: Chain Management
  '1.1': {
    name: 'ChainCompilationParsed',
    type: 'src/contract/types/chainFormats.ts',
    schema: 'ChainCompilationSchema',
    parser: 'parseChainCompilation',
    parserFile: 'src/contract/parsers/chainParser.ts',
  },
  '1.2': {
    name: 'ChainExecutionStartParsed',
    type: 'src/contract/types/chainFormats.ts',
    schema: 'ChainExecutionStartSchema',
    parser: 'parseExecutionStart',
    parserFile: 'src/contract/parsers/chainParser.ts',
  },
  '1.3': {
    name: 'ChainStatusUpdateParsed',
    type: 'src/contract/types/chainFormats.ts',
    schema: 'ChainStatusUpdateSchema',
    parser: 'parseChainStatusUpdate',
    parserFile: 'src/contract/parsers/chainParser.ts',
  },
  '1.4': {
    name: 'ExecutionCompleteParsed',
    type: 'src/contract/types/chainFormats.ts',
    schema: 'ExecutionCompleteSchema',
    parser: 'parseExecutionComplete',
    parserFile: 'src/contract/parsers/chainParser.ts',
  },
  // Category 2: Step Lifecycle
  '2.1': {
    name: 'StepCompletionParsed',
    type: 'src/contract/types/stepFormats.ts',
    schema: 'StepCompletionSchema',
    parser: 'parseStepCompletion',
    parserFile: 'src/contract/parsers/stepParser.ts',
  },
  '2.2': {
    name: 'DualOutputParsed',
    type: 'src/contract/types/stepFormats.ts',
    schema: 'DualOutputSchema',
    parser: 'parseDualOutput',
    parserFile: 'src/contract/parsers/stepParser.ts',
  },
  '2.3': {
    name: 'SecondOpinionSkipParsed',
    type: 'src/contract/types/stepFormats.ts',
    schema: 'SecondOpinionSkipSchema',
    parser: 'parseSecondOpinionSkip',
    parserFile: 'src/contract/parsers/stepParser.ts',
  },
  // Category 3: Human Interaction
  '3.1': {
    name: 'HumanGateParsed',
    type: 'src/contract/types/humanFormats.ts',
    schema: 'HumanGateSchema',
    parser: 'parseHumanGate',
    parserFile: 'src/contract/parsers/humanParser.ts',
  },
  '3.2': {
    name: 'LearningSurfaceParsed',
    type: 'src/contract/types/humanFormats.ts',
    schema: 'LearningSurfaceSchema',
    parser: 'parseLearningSurface',
    parserFile: 'src/contract/parsers/humanParser.ts',
  },
  '3.3': {
    name: 'SessionStartProtocolParsed',
    type: 'src/contract/types/humanFormats.ts',
    schema: 'SessionStartProtocolSchema',
    parser: 'parseSessionStartProtocol',
    parserFile: 'src/contract/parsers/humanParser.ts',
  },
  // Category 4: Registry & Metadata
  '4.1': {
    name: 'RegistryUpdateParsed',
    type: 'src/contract/types/registryFormats.ts',
    schema: 'RegistryUpdateSchema',
    parser: 'parseRegistryUpdate',
    parserFile: 'src/contract/parsers/registryParser.ts',
  },
  '4.2': {
    name: 'IndexEntryParsed',
    type: 'src/contract/types/registryFormats.ts',
    schema: 'IndexEntrySchema',
    parser: 'parseIndexEntry',
    parserFile: 'src/contract/parsers/registryParser.ts',
  },
  '4.3': {
    name: 'LearningEntryParsed',
    type: 'src/contract/types/registryFormats.ts',
    schema: 'LearningEntrySchema',
    parser: 'parseLearningEntry',
    parserFile: 'src/contract/parsers/registryParser.ts',
  },
  // Category 5: Action Outputs
  '5.1': {
    name: 'ReviewReportParsed',
    type: 'src/contract/types/actionFormats.ts',
    schema: 'ReviewReportSchema',
    parser: 'parseReviewReport',
    parserFile: 'src/contract/parsers/actionParser.ts',
  },
  '5.2': {
    name: 'AnalysisReportParsed',
    type: 'src/contract/types/actionFormats.ts',
    schema: 'AnalysisReportSchema',
    parser: 'parseAnalysisReport',
    parserFile: 'src/contract/parsers/actionParser.ts',
  },
  '5.3': {
    name: 'BrainstormTranscriptParsed',
    type: 'src/contract/types/actionFormats.ts',
    schema: 'BrainstormTranscriptSchema',
    parser: 'parseBrainstormTranscript',
    parserFile: 'src/contract/parsers/actionParser.ts',
  },
  // Category 6: Error & Status
  '6.1': {
    name: 'ErrorAnnouncementParsed',
    type: 'src/contract/types/statusFormats.ts',
    schema: 'ErrorAnnouncementSchema',
    parser: 'parseErrorAnnouncement',
    parserFile: 'src/contract/parsers/statusParser.ts',
  },
  '6.2': {
    name: 'ContextRoutingParsed',
    type: 'src/contract/types/statusFormats.ts',
    schema: 'ContextRoutingSchema',
    parser: 'parseContextRouting',
    parserFile: 'src/contract/parsers/statusParser.ts',
  },
} as const;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Extract TypeScript interface fields from type definition file
 */
function extractTypeFields(typeFile: string, interfaceName: string): string[] {
  const content = readFileSync(typeFile, 'utf-8');

  // Find the interface declaration start
  const interfaceStart = content.indexOf(`export interface ${interfaceName}`);
  if (interfaceStart === -1) {
    return [];
  }

  // Find the opening brace
  const openBraceIndex = content.indexOf('{', interfaceStart);
  if (openBraceIndex === -1) {
    return [];
  }

  // Match braces to find the closing brace
  let braceCount = 1;
  let i = openBraceIndex + 1;
  while (i < content.length && braceCount > 0) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') braceCount--;
    i++;
  }

  if (braceCount !== 0) {
    return [];
  }

  const body = content.slice(openBraceIndex + 1, i - 1);

  // Extract field names (handles JSDoc comments)
  // Pattern: optional JSDoc, then fieldName:
  const fieldPattern = /(?:\/\*\*[\s\S]*?\*\/\s*)?(\w+):/g;
  const fields: string[] = [];
  let fieldMatch;

  while ((fieldMatch = fieldPattern.exec(body)) !== null) {
    const fieldName = fieldMatch[1];
    if (fieldName && fieldName !== 'raw' && fieldName !== 'contractVersion') {
      fields.push(fieldName);
    }
  }

  return [...new Set(fields)]; // Deduplicate
}

/**
 * Extract Zod schema fields from schemas.ts
 */
function extractSchemaFields(schemaName: string): string[] {
  const schemaFile = join(__dirname, '../src/contract/validation/schemas.ts');
  const content = readFileSync(schemaFile, 'utf-8');

  // Find the schema definition
  const schemaPattern = new RegExp(
    `export const ${schemaName}\\s*=\\s*BaseParsedSchema\\.extend\\(\\{([^}]+)\\}\\)`,
    's'
  );
  const match = content.match(schemaPattern);

  if (!match) {
    return [];
  }

  const body = match[1];
  const fieldPattern = /^\s*(\w+):/gm;
  const fields: string[] = [];
  let fieldMatch;

  while ((fieldMatch = fieldPattern.exec(body)) !== null) {
    fields.push(fieldMatch[1]);
  }

  return fields;
}

/**
 * Extract fields being parsed in parser function
 */
function extractParserFields(parserFile: string, parserFunction: string): string[] {
  const content = readFileSync(parserFile, 'utf-8');

  // Find the parser function
  const functionPattern = new RegExp(
    `export function ${parserFunction}[^{]*\\{([\\s\\S]*?)\\n\\}\\n`,
    'm'
  );
  const match = content.match(functionPattern);

  if (!match) {
    return [];
  }

  const body = match[1];

  // Find the "const parsed" or return object construction
  // Most parsers use: const parsed: TypeName = { ... }
  const parsedObjectPattern = /const parsed[^=]*=\s*\{([^}]+)\}/s;
  const parsedMatch = body.match(parsedObjectPattern);

  if (!parsedMatch) {
    return [];
  }

  const objectBody = parsedMatch[1];

  // Extract field names from object literal
  // Pattern: fieldName: value, (may span multiple lines)
  const fieldPattern = /^\s*(\w+):/gm;
  const fields: string[] = [];
  let fieldMatch;

  while ((fieldMatch = fieldPattern.exec(objectBody)) !== null) {
    const fieldName = fieldMatch[1];
    if (fieldName && fieldName !== 'raw' && fieldName !== 'contractVersion') {
      fields.push(fieldName);
    }
  }

  return [...new Set(fields)]; // Deduplicate
}

/**
 * Validate a single format across all 4 layers
 */
function validateFormat(formatId: string): FormatValidation {
  const mapping = FORMAT_MAPPING[formatId as keyof typeof FORMAT_MAPPING];
  if (!mapping) {
    return {
      formatId,
      formatName: 'Unknown',
      priority: 'P?',
      layers: { spec: false, type: false, schema: false, parser: false },
      issues: [{
        formatId,
        layer: 'spec',
        severity: 'CRITICAL',
        message: 'Format not found in mapping configuration',
      }],
      completeness: 0,
    };
  }

  const issues: DriftIssue[] = [];
  const layers = { spec: true, type: false, schema: false, parser: false };

  // Extract CONTRACT.md spec (we assume it exists if in mapping)
  const contractFile = join(__dirname, '../../../.claude/actionflows/CONTRACT.md');
  const contractContent = readFileSync(contractFile, 'utf-8');
  const formatPattern = new RegExp(`#### Format ${formatId}:([^#]+)`, 's');
  const formatMatch = contractContent.match(formatPattern);

  if (!formatMatch) {
    issues.push({
      formatId,
      layer: 'spec',
      severity: 'CRITICAL',
      message: `Format ${formatId} not documented in CONTRACT.md`,
    });
    layers.spec = false;
  }

  // Extract fields from TypeScript type
  const typeFile = join(__dirname, '..', mapping.type);
  let typeFields: string[] = [];
  try {
    typeFields = extractTypeFields(typeFile, mapping.name);
    layers.type = typeFields.length > 0;
  } catch (err) {
    issues.push({
      formatId,
      layer: 'type',
      severity: 'CRITICAL',
      message: `Failed to read TypeScript type: ${err}`,
    });
  }

  // Extract fields from Zod schema
  let schemaFields: string[] = [];
  try {
    schemaFields = extractSchemaFields(mapping.schema);
    layers.schema = schemaFields.length > 0;
  } catch (err) {
    issues.push({
      formatId,
      layer: 'schema',
      severity: 'CRITICAL',
      message: `Failed to read Zod schema: ${err}`,
    });
  }

  // Extract fields from parser
  const parserFile = join(__dirname, '..', mapping.parserFile);
  let parserFields: string[] = [];
  try {
    parserFields = extractParserFields(parserFile, mapping.parser);
    layers.parser = parserFields.length > 0;
  } catch (err) {
    issues.push({
      formatId,
      layer: 'parser',
      severity: 'CRITICAL',
      message: `Failed to read parser implementation: ${err}`,
    });
  }

  // Compare fields across layers
  if (layers.type && layers.schema) {
    // Type vs Schema
    const typeOnly = typeFields.filter(f => !schemaFields.includes(f));
    const schemaOnly = schemaFields.filter(f => !typeFields.includes(f));

    typeOnly.forEach(field => {
      issues.push({
        formatId,
        layer: 'schema',
        severity: 'CRITICAL',
        message: `Field "${field}" exists in TypeScript type but missing in Zod schema`,
        fieldName: field,
      });
    });

    schemaOnly.forEach(field => {
      issues.push({
        formatId,
        layer: 'type',
        severity: 'MEDIUM',
        message: `Field "${field}" exists in Zod schema but missing in TypeScript type`,
        fieldName: field,
      });
    });
  }

  if (layers.type && layers.parser) {
    // Type vs Parser
    const typeOnly = typeFields.filter(f => !parserFields.includes(f));

    typeOnly.forEach(field => {
      issues.push({
        formatId,
        layer: 'parser',
        severity: 'CRITICAL',
        message: `Field "${field}" exists in TypeScript type but not extracted by parser`,
        fieldName: field,
      });
    });
  }

  // Calculate completeness
  const layerCount = Object.values(layers).filter(Boolean).length;
  const completeness = (layerCount / 4) * 100;

  return {
    formatId,
    formatName: mapping.name,
    priority: formatMatch?.[0].match(/\(P(\d)\)/)?.[1] || '?',
    layers,
    issues,
    completeness,
  };
}

/**
 * Run full validation across all formats
 */
function runValidation(): ValidationReport {
  const formatIds = Object.keys(FORMAT_MAPPING);
  const formats = formatIds.map(validateFormat);

  const aligned = formats.filter(f => f.issues.length === 0).length;
  const criticalIssues = formats.reduce(
    (sum, f) => sum + f.issues.filter(i => i.severity === 'CRITICAL').length,
    0
  );

  return {
    timestamp: new Date().toISOString(),
    totalFormats: formats.length,
    aligned,
    driftDetected: formats.length - aligned,
    criticalIssues,
    formats,
  };
}

// ============================================================================
// Output Formatting
// ============================================================================

function printReport(report: ValidationReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('Contract Drift Validation Report');
  console.log('='.repeat(80));
  console.log();
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Total Formats: ${report.totalFormats}`);
  console.log(`Aligned: ${report.aligned}`);
  console.log(`Drift Detected: ${report.driftDetected}`);
  console.log(`Critical Issues: ${report.criticalIssues}`);
  console.log();

  // Sort by completeness (ascending) to show problems first
  const sortedFormats = [...report.formats].sort((a, b) => a.completeness - b.completeness);

  for (const format of sortedFormats) {
    const status = format.issues.length === 0 ? '✅ ALIGNED' : '⚠️ DRIFT';
    const layerStatus = [
      format.layers.spec ? '✓' : '✗',
      format.layers.type ? '✓' : '✗',
      format.layers.schema ? '✓' : '✗',
      format.layers.parser ? '✓' : '✗',
    ].join('');

    console.log(`Format ${format.formatId} (${format.formatName}): ${status} [${layerStatus}] ${format.completeness.toFixed(0)}%`);

    if (format.issues.length > 0) {
      format.issues.forEach(issue => {
        const severityIcon = {
          CRITICAL: '🔴',
          MEDIUM: '🟡',
          LOW: '🟢',
        }[issue.severity];
        console.log(`  ${severityIcon} [${issue.layer}] ${issue.message}`);
      });
      console.log();
    }
  }

  console.log('='.repeat(80));

  if (report.criticalIssues === 0) {
    console.log('✅ No drift detected. All formats are aligned.');
  } else {
    console.log(`❌ ${report.criticalIssues} critical issue(s) detected.`);
  }

  console.log('='.repeat(80));
  console.log();
}

function printJsonReport(report: ValidationReport): void {
  console.log(JSON.stringify(report, null, 2));
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');

  try {
    const report = runValidation();

    if (jsonOutput) {
      printJsonReport(report);
    } else {
      printReport(report);
    }

    // Exit with error code if critical issues found
    if (report.criticalIssues > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Validation script error:', err);
    process.exit(2);
  }
}

main();
