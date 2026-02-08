"use strict";
/**
 * SquadPanel Types
 * Character-driven agent visualization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTION_TO_AGENT_ROLE = exports.AGENT_ARCHETYPES = exports.AGENT_NAMES = exports.AGENT_COLORS = void 0;
exports.mapActionToRole = mapActionToRole;
exports.AGENT_COLORS = {
    orchestrator: { primary: '#E8E8E8', accent: '#FFD700', glow: '#FFFAF0' },
    explore: { primary: '#20B2AA', accent: '#00FFFF', glow: '#7FFFD4' },
    plan: { primary: '#6A0DAD', accent: '#EE82EE', glow: '#FF00FF' },
    bash: { primary: '#3C3C3C', accent: '#00FF00', glow: '#39FF14' },
    read: { primary: '#000080', accent: '#87CEEB', glow: '#FFFAFA' },
    write: { primary: '#FFFDD0', accent: '#1A1A1A', glow: '#FFBF00' },
    edit: { primary: '#708090', accent: '#FF6F61', glow: '#FFB6C1' },
    grep: { primary: '#228B22', accent: '#32CD32', glow: '#FFFF00' },
    glob: { primary: '#4B0082', accent: '#FFFAFA', glow: '#6495ED' },
};
exports.AGENT_NAMES = {
    orchestrator: 'Orchestrator',
    explore: 'Explore',
    plan: 'Plan',
    bash: 'Bash',
    read: 'Read',
    write: 'Write',
    edit: 'Edit',
    grep: 'Grep',
    glob: 'Glob',
};
exports.AGENT_ARCHETYPES = {
    orchestrator: 'Team Captain',
    explore: 'Curious Scout',
    plan: 'Chess Master',
    bash: 'Hands-on Mechanic',
    read: 'Gentle Archivist',
    write: 'Artistic Calligrapher',
    edit: 'Precise Surgeon',
    grep: 'Sharp-eyed Tracker',
    glob: 'Pattern Cartographer',
};
/**
 * Action to AgentRole mapping
 * Maps WebSocket event action fields to agent roles
 */
exports.ACTION_TO_AGENT_ROLE = {
    // Explore actions
    explore: 'explore',
    search: 'explore',
    discover: 'explore',
    find: 'explore',
    // Plan actions
    plan: 'plan',
    design: 'plan',
    architect: 'plan',
    analyze: 'plan',
    // Bash actions
    bash: 'bash',
    shell: 'bash',
    execute: 'bash',
    run: 'bash',
    // Read actions
    read: 'read',
    parse: 'read',
    fetch: 'read',
    load: 'read',
    // Write actions
    write: 'write',
    create: 'write',
    generate: 'write',
    output: 'write',
    // Edit actions
    edit: 'edit',
    modify: 'edit',
    update: 'edit',
    patch: 'edit',
    // Grep actions
    grep: 'grep',
    grep_search: 'grep',
    scan: 'grep',
    match: 'grep',
    // Glob actions
    glob: 'glob',
    pattern: 'glob',
    match_pattern: 'glob',
    list: 'glob',
};
/**
 * Helper to map action string to AgentRole
 * Falls back to 'orchestrator' for unknown actions
 */
function mapActionToRole(action) {
    if (!action) {
        return 'orchestrator';
    }
    var normalized = action.toLowerCase();
    // Direct match
    if (normalized in exports.ACTION_TO_AGENT_ROLE) {
        return exports.ACTION_TO_AGENT_ROLE[normalized];
    }
    // Partial matching for hyphenated actions
    for (var _i = 0, _a = Object.entries(exports.ACTION_TO_AGENT_ROLE); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], role = _b[1];
        if (normalized.includes(key) || key.includes(normalized)) {
            return role;
        }
    }
    // Fallback to orchestrator
    return 'orchestrator';
}
