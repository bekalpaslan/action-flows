#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inventory = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'log_inventory.json'), 'utf-8')
);

// Theme categorization based on first user message patterns
const themes = {
  bootstrap: [],
  framework: [],
  ideation: [],
  testing: [],
  ui: [],
  harmony: [],
  design: [],
  agent: [],
  general: [],
  automation: []
};

const milestones = [];

for (const session of inventory) {
  const msg = (session.firstUserMessage || '').toLowerCase();

  // Categorize by content
  if (msg.includes('bootstrap') || msg.includes('injection prompt')) {
    themes.bootstrap.push(session);
  } else if (msg.includes('blueprint') || msg.includes('framework')) {
    themes.framework.push(session);
  } else if (msg.includes('ideation') || msg.includes('roadmap') || msg.includes('competitor')) {
    themes.ideation.push(session);
  } else if (msg.includes('test') || msg.includes('e2e') || msg.includes('ui test')) {
    themes.testing.push(session);
  } else if (msg.includes('ui/ux') || msg.includes('design') || msg.includes('figma') || msg.includes('animation')) {
    themes.ui.push(session);
  } else if (msg.includes('harmony') || msg.includes('contract')) {
    themes.harmony.push(session);
  } else if (msg.includes('agent') || msg.includes('role')) {
    themes.agent.push(session);
  } else if (msg.includes('auto-build') || msg.includes('automation')) {
    themes.automation.push(session);
  } else {
    themes.general.push(session);
  }

  // Identify major sessions (by message count or size)
  if (session.totalMessages > 500 || session.fileSize > 10 * 1024 * 1024) {
    milestones.push({
      date: session.modifiedTime,
      fileName: session.fileName,
      messages: session.totalMessages,
      sizeMB: session.fileSizeMB,
      firstMessage: session.firstUserMessage?.substring(0, 150)
    });
  }
}

console.log('\n=== THEME BREAKDOWN ===\n');

const themeOrder = [
  'bootstrap',
  'framework',
  'ideation',
  'agent',
  'testing',
  'ui',
  'harmony',
  'automation',
  'general'
];

for (const theme of themeOrder) {
  const sessions = themes[theme];
  if (sessions.length > 0) {
    console.log(`${theme.toUpperCase()}: ${sessions.length} sessions`);
    console.log(`  Total messages: ${sessions.reduce((sum, s) => sum + s.totalMessages, 0)}`);
    console.log(`  Total size: ${(sessions.reduce((sum, s) => sum + s.fileSize, 0) / (1024 * 1024)).toFixed(2)} MB`);
    console.log('');
  }
}

console.log('\n=== MAJOR MILESTONES (>500 messages or >10MB) ===\n');

milestones.sort((a, b) => new Date(a.date) - new Date(b.date));

for (const m of milestones) {
  const date = new Date(m.date).toISOString().split('T')[0];
  console.log(`${date} - ${m.messages} msgs, ${m.sizeMB}MB`);
  console.log(`  First: ${m.firstMessage || 'N/A'}`);
  console.log('');
}

// Weekly breakdown
console.log('\n=== WEEKLY ACTIVITY ===\n');

const weeks = {};
for (const session of inventory) {
  const date = new Date(session.modifiedTime);
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  const weekKey = weekStart.toISOString().split('T')[0];

  if (!weeks[weekKey]) {
    weeks[weekKey] = {
      sessions: 0,
      messages: 0,
      userMessages: 0,
      assistantMessages: 0
    };
  }

  weeks[weekKey].sessions++;
  weeks[weekKey].messages += session.totalMessages;
  weeks[weekKey].userMessages += session.userMessages;
  weeks[weekKey].assistantMessages += session.assistantMessages;
}

const weekKeys = Object.keys(weeks).sort();
for (const week of weekKeys) {
  const w = weeks[week];
  console.log(`Week of ${week}:`);
  console.log(`  ${w.sessions} sessions, ${w.messages} messages`);
  console.log(`  User: ${w.userMessages}, Assistant: ${w.assistantMessages}`);
  console.log('');
}

// Save detailed theme data
const themeReport = {
  themes,
  milestones,
  weeks
};

fs.writeFileSync(
  path.join(__dirname, 'theme_analysis.json'),
  JSON.stringify(themeReport, null, 2)
);

console.log('\nTheme analysis saved to theme_analysis.json');
