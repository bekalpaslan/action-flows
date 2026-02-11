#!/usr/bin/env python3
"""
Analyze all conversation logs to build a comprehensive picture of the project journey.
"""

import json
import os
from datetime import datetime
from collections import defaultdict
from pathlib import Path

LOG_DIR = Path("C:/Users/alpas/.claude/projects/D--ActionFlowsDashboard")

def parse_timestamp(ts_str):
    """Parse ISO timestamp string."""
    return datetime.fromisoformat(ts_str.replace('Z', '+00:00'))

def analyze_session(filepath):
    """Analyze a single session file."""
    session_data = {
        'filepath': filepath,
        'session_id': filepath.stem,
        'messages': [],
        'user_messages': [],
        'assistant_messages': [],
        'models_used': set(),
        'first_timestamp': None,
        'last_timestamp': None,
        'file_size': filepath.stat().st_size,
        'line_count': 0,
        'first_user_messages': []  # Store first 3 user messages
    }

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                session_data['line_count'] = line_num
                try:
                    entry = json.loads(line.strip())

                    # Track timestamps
                    if 'timestamp' in entry:
                        ts = parse_timestamp(entry['timestamp'])
                        if session_data['first_timestamp'] is None:
                            session_data['first_timestamp'] = ts
                        session_data['last_timestamp'] = ts

                    # Collect user messages
                    if entry.get('type') == 'user':
                        msg = entry.get('message', {})
                        content = msg.get('content', '')
                        # Handle list or string content
                        if isinstance(content, list):
                            content_str = ' '.join(str(item.get('text', item)) if isinstance(item, dict) else str(item) for item in content)
                        else:
                            content_str = str(content)

                        session_data['user_messages'].append({
                            'content': content_str[:500],  # First 500 chars
                            'timestamp': entry.get('timestamp'),
                            'full_length': len(content_str)
                        })
                        if len(session_data['first_user_messages']) < 3:
                            session_data['first_user_messages'].append(content_str[:1000])

                    # Collect assistant messages and models
                    elif entry.get('type') == 'assistant':
                        msg = entry.get('message', {})
                        model = msg.get('model', 'unknown')
                        session_data['models_used'].add(model)
                        session_data['assistant_messages'].append({
                            'model': model,
                            'timestamp': entry.get('timestamp')
                        })

                except json.JSONDecodeError:
                    continue
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

    return session_data

def categorize_session(session_data):
    """Categorize session based on first user messages."""
    # Handle both string and list content
    msgs = []
    for msg in session_data['first_user_messages']:
        if isinstance(msg, str):
            msgs.append(msg)
        elif isinstance(msg, list):
            msgs.append(' '.join(str(item) for item in msg))
        else:
            msgs.append(str(msg))
    first_msgs = ' '.join(msgs).lower()

    # Define category patterns
    categories = []

    if any(word in first_msgs for word in ['alias', 'command', 'setup', 'install', 'configure']):
        categories.append('setup')
    if any(word in first_msgs for word in ['orchestrator', 'framework', 'agent', 'flow', 'action']):
        categories.append('framework-development')
    if any(word in first_msgs for word in ['implement', 'build', 'create', 'add feature']):
        categories.append('feature-implementation')
    if any(word in first_msgs for word in ['fix', 'bug', 'error', 'issue', 'broken']):
        categories.append('debugging')
    if any(word in first_msgs for word in ['refactor', 'reorganize', 'clean', 'improve']):
        categories.append('refactoring')
    if any(word in first_msgs for word in ['test', 'verify', 'check']):
        categories.append('testing')
    if any(word in first_msgs for word in ['design', 'token', 'color', 'spacing', 'css']):
        categories.append('design-system')
    if any(word in first_msgs for word in ['doc', 'documentation', 'readme', 'learning']):
        categories.append('documentation')
    if any(word in first_msgs for word in ['analyze', 'audit', 'review', 'examine']):
        categories.append('analysis')
    if any(word in first_msgs for word in ['plan', 'roadmap', 'next', 'what should']):
        categories.append('planning')

    # Check for breakthrough moments
    emotional_markers = []
    if any(word in first_msgs for word in ['amazing', 'perfect', 'excellent', 'great', 'beautiful']):
        emotional_markers.append('positive')
    if any(word in first_msgs for word in ['frustrated', 'stuck', 'confused', 'problem']):
        emotional_markers.append('challenging')
    if any(word in first_msgs for word in ['aha', 'i see', 'understand now', 'got it']):
        emotional_markers.append('breakthrough')

    return categories if categories else ['general'], emotional_markers

def main():
    print("Analyzing conversation logs...\n")

    # Find all .jsonl files
    jsonl_files = sorted(LOG_DIR.glob("*.jsonl"), key=lambda p: p.stat().st_mtime)

    print(f"Found {len(jsonl_files)} session files\n")

    all_sessions = []
    category_stats = defaultdict(int)
    model_stats = defaultdict(int)
    daily_activity = defaultdict(int)

    # Analyze each session
    for i, filepath in enumerate(jsonl_files, 1):
        if i % 10 == 0:
            print(f"Processing session {i}/{len(jsonl_files)}...")

        session = analyze_session(filepath)
        categories, emotions = categorize_session(session)
        session['categories'] = categories
        session['emotions'] = emotions

        all_sessions.append(session)

        # Update stats
        for cat in categories:
            category_stats[cat] += 1
        for model in session['models_used']:
            model_stats[model] += 1
        if session['first_timestamp']:
            day = session['first_timestamp'].date()
            daily_activity[day] += 1

    # Generate report
    print("\n" + "="*80)
    print("ACTIONFLOWS DASHBOARD - CONVERSATION LOG ANALYSIS")
    print("="*80)

    # Overview
    total_size = sum(s['file_size'] for s in all_sessions)
    total_messages = sum(len(s['user_messages']) + len(s['assistant_messages']) for s in all_sessions)
    total_user_msgs = sum(len(s['user_messages']) for s in all_sessions)

    print(f"\n## OVERVIEW")
    print(f"Total Sessions: {len(all_sessions)}")
    print(f"Total Size: {total_size / 1024 / 1024:.1f} MB")
    print(f"Total Messages: {total_messages:,}")
    print(f"  - User Messages: {total_user_msgs:,}")
    print(f"  - Assistant Messages: {total_messages - total_user_msgs:,}")

    # Date range
    valid_sessions = [s for s in all_sessions if s['first_timestamp']]
    if valid_sessions:
        earliest = min(s['first_timestamp'] for s in valid_sessions)
        latest = max(s['last_timestamp'] for s in valid_sessions if s['last_timestamp'])
        print(f"\nDate Range: {earliest.date()} to {latest.date()}")
        print(f"Duration: {(latest - earliest).days} days")

    # Model distribution
    print(f"\n## MODELS USED")
    for model, count in sorted(model_stats.items(), key=lambda x: x[1], reverse=True):
        print(f"  {model}: {count} sessions")

    # Category distribution
    print(f"\n## SESSION CATEGORIES")
    for cat, count in sorted(category_stats.items(), key=lambda x: x[1], reverse=True):
        print(f"  {cat}: {count} sessions")

    # Daily activity
    print(f"\n## MOST ACTIVE DAYS (Top 10)")
    for day, count in sorted(daily_activity.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {day}: {count} sessions")

    # Session details with themes
    print(f"\n## SESSION INVENTORY (Chronological)")
    print(f"\n{'#':<4} {'Date':<12} {'Size':<8} {'Msgs':<5} {'Category':<30} {'First Message Preview'}")
    print("-" * 140)

    for i, session in enumerate(all_sessions, 1):
        date_str = session['first_timestamp'].strftime('%Y-%m-%d') if session['first_timestamp'] else 'unknown'
        size_str = f"{session['file_size'] / 1024:.0f}KB"
        msg_count = len(session['user_messages'])
        cats = ', '.join(session['categories'][:2])

        first_msg = ''
        if session['first_user_messages']:
            first_msg = session['first_user_messages'][0][:80].replace('\n', ' ')

        print(f"{i:<4} {date_str:<12} {size_str:<8} {msg_count:<5} {cats:<30} {first_msg}")

    # Key milestones
    print(f"\n## POTENTIAL MILESTONES")

    # Largest sessions (likely major work)
    print(f"\nLargest Sessions (Top 5):")
    for session in sorted(all_sessions, key=lambda s: s['file_size'], reverse=True)[:5]:
        date_str = session['first_timestamp'].strftime('%Y-%m-%d') if session['first_timestamp'] else 'unknown'
        size_mb = session['file_size'] / 1024 / 1024
        preview = session['first_user_messages'][0][:100] if session['first_user_messages'] else 'N/A'
        print(f"  {date_str} - {size_mb:.1f}MB - {preview.replace(chr(10), ' ')}")

    # Sessions with emotional markers
    print(f"\nEmotional Markers:")
    for session in all_sessions:
        if session['emotions']:
            date_str = session['first_timestamp'].strftime('%Y-%m-%d') if session['first_timestamp'] else 'unknown'
            preview = session['first_user_messages'][0][:100] if session['first_user_messages'] else 'N/A'
            print(f"  {date_str} [{', '.join(session['emotions'])}] - {preview.replace(chr(10), ' ')}")

    # Save detailed report
    output_path = Path("D:/ActionFlowsDashboard/.claude/actionflows/logs/conversation-log-analysis.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        # Convert sets to lists for JSON serialization
        for session in all_sessions:
            session['models_used'] = list(session['models_used'])
            session['filepath'] = str(session['filepath'])  # Convert Path to string
            if session['first_timestamp']:
                session['first_timestamp'] = session['first_timestamp'].isoformat()
            if session['last_timestamp']:
                session['last_timestamp'] = session['last_timestamp'].isoformat()

        json.dump({
            'overview': {
                'total_sessions': len(all_sessions),
                'total_size_mb': total_size / 1024 / 1024,
                'total_messages': total_messages,
                'total_user_messages': total_user_msgs
            },
            'sessions': all_sessions,
            'category_stats': dict(category_stats),
            'model_stats': dict(model_stats),
            'daily_activity': {str(k): v for k, v in daily_activity.items()}
        }, f, indent=2)

    print(f"\n\nDetailed analysis saved to: {output_path}")
    print("\nAnalysis complete!")

if __name__ == '__main__':
    main()
