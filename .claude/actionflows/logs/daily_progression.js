#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inventory = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'log_inventory.json'), 'utf-8')
);

// Group by day
const days = {};

for (const session of inventory) {
  const date = new Date(session.modifiedTime);
  const dayKey = date.toISOString().split('T')[0];

  if (!days[dayKey]) {
    days[dayKey] = {
      sessions: [],
      totalSessions: 0,
      totalMessages: 0,
      totalUserMessages: 0,
      totalAssistantMessages: 0,
      totalSize: 0,
      largestSession: null
    };
  }

  const day = days[dayKey];
  day.sessions.push(session);
  day.totalSessions++;
  day.totalMessages += session.totalMessages;
  day.totalUserMessages += session.userMessages;
  day.totalAssistantMessages += session.assistantMessages;
  day.totalSize += session.fileSize;

  if (!day.largestSession || session.totalMessages > day.largestSession.totalMessages) {
    day.largestSession = session;
  }
}

// Print day-by-day breakdown
console.log('\n=== DAY-BY-DAY PROGRESSION ===\n');

const dayKeys = Object.keys(days).sort();

for (const dayKey of dayKeys) {
  const day = days[dayKey];
  const sizeMB = (day.totalSize / (1024 * 1024)).toFixed(2);

  console.log(`📅 ${dayKey}`);
  console.log(`   Sessions: ${day.totalSessions}`);
  console.log(`   Messages: ${day.totalMessages} (User: ${day.totalUserMessages}, Assistant: ${day.totalAssistantMessages})`);
  console.log(`   Data: ${sizeMB} MB`);
  console.log(`   Avg msgs/session: ${Math.round(day.totalMessages / day.totalSessions)}`);

  if (day.largestSession) {
    console.log(`   🔥 Largest: ${day.largestSession.totalMessages} msgs (${day.largestSession.fileSizeMB} MB)`);
    const firstMsg = day.largestSession.firstUserMessage;
    if (firstMsg && firstMsg.length > 0 && !firstMsg.includes('<local-command-caveat>')) {
      console.log(`      "${firstMsg.substring(0, 80)}..."`);
    }
  }
  console.log('');
}

// Create ASCII visualization
console.log('\n=== ACTIVITY VISUALIZATION ===\n');
console.log('Sessions per day:');

const maxSessions = Math.max(...Object.values(days).map(d => d.totalSessions));

for (const dayKey of dayKeys) {
  const day = days[dayKey];
  const barLength = Math.round((day.totalSessions / maxSessions) * 50);
  const bar = '█'.repeat(barLength);
  const dateShort = dayKey.substring(5); // Remove year
  console.log(`${dateShort}  ${bar} ${day.totalSessions}`);
}

console.log('\nMessages per day:');

const maxMessages = Math.max(...Object.values(days).map(d => d.totalMessages));

for (const dayKey of dayKeys) {
  const day = days[dayKey];
  const barLength = Math.round((day.totalMessages / maxMessages) * 50);
  const bar = '█'.repeat(barLength);
  const dateShort = dayKey.substring(5);
  console.log(`${dateShort}  ${bar} ${day.totalMessages}`);
}

console.log('\nData volume per day (MB):');

const maxSize = Math.max(...Object.values(days).map(d => d.totalSize));

for (const dayKey of dayKeys) {
  const day = days[dayKey];
  const barLength = Math.round((day.totalSize / maxSize) * 50);
  const bar = '█'.repeat(barLength);
  const dateShort = dayKey.substring(5);
  const sizeMB = (day.totalSize / (1024 * 1024)).toFixed(1);
  console.log(`${dateShort}  ${bar} ${sizeMB} MB`);
}

// Cumulative growth
console.log('\n=== CUMULATIVE GROWTH ===\n');

let cumulativeSessions = 0;
let cumulativeMessages = 0;
let cumulativeSize = 0;

for (const dayKey of dayKeys) {
  const day = days[dayKey];
  cumulativeSessions += day.totalSessions;
  cumulativeMessages += day.totalMessages;
  cumulativeSize += day.totalSize;

  const sizeMB = (cumulativeSize / (1024 * 1024)).toFixed(2);
  console.log(`${dayKey}: ${cumulativeSessions} sessions, ${cumulativeMessages} messages, ${sizeMB} MB`);
}

// Save daily data
const dailyReport = {
  byDay: days,
  summary: {
    totalDays: dayKeys.length,
    totalSessions: cumulativeSessions,
    totalMessages: cumulativeMessages,
    totalSizeMB: (cumulativeSize / (1024 * 1024)).toFixed(2),
    peakDay: dayKeys.reduce((peak, key) =>
      days[key].totalSessions > days[peak].totalSessions ? key : peak
    ),
    mostProductiveDay: dayKeys.reduce((peak, key) =>
      days[key].totalMessages > days[peak].totalMessages ? key : peak
    )
  }
};

fs.writeFileSync(
  path.join(__dirname, 'daily_progression.json'),
  JSON.stringify(dailyReport, null, 2)
);

console.log('\n✅ Daily progression saved to daily_progression.json');
