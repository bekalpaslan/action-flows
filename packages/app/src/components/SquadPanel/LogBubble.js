"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogBubble = LogBubble;
var jsx_runtime_1 = require("react/jsx-runtime");
require("./LogBubble.css");
/**
 * Get icon character for log type (for colorblind accessibility)
 */
function getLogTypeIcon(type) {
    var iconMap = {
        info: 'ℹ️',
        success: '✓',
        error: '✕',
        thinking: '◆',
        warning: '⚠',
    };
    return iconMap[type] || '•';
}
/**
 * Format timestamp to readable format
 * Shows time if within last 24h, date otherwise
 */
function formatTimestamp(timestamp) {
    var date = new Date(timestamp);
    var now = new Date();
    var diffMs = now.getTime() - date.getTime();
    var diffMins = Math.floor(diffMs / 60000);
    // Less than a minute ago
    if (diffMins < 1) {
        return 'just now';
    }
    // Less than an hour ago
    if (diffMins < 60) {
        return "".concat(diffMins, "m ago");
    }
    // Less than 24 hours ago
    if (diffMins < 1440) {
        var diffHours = Math.floor(diffMins / 60);
        return "".concat(diffHours, "h ago");
    }
    // Use short date format
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function LogBubble(_a) {
    var log = _a.log, _b = _a.className, className = _b === void 0 ? '' : _b;
    var icon = getLogTypeIcon(log.type);
    var timestamp = formatTimestamp(log.timestamp);
    return ((0, jsx_runtime_1.jsx)("div", { className: "log-bubble log-bubble-".concat(log.type, " ").concat(className), children: (0, jsx_runtime_1.jsxs)("div", { className: "log-bubble-content", children: [(0, jsx_runtime_1.jsxs)("div", { className: "log-bubble-header", children: [(0, jsx_runtime_1.jsx)("span", { className: "log-bubble-icon", title: log.type, children: icon }), (0, jsx_runtime_1.jsx)("span", { className: "log-bubble-message", children: log.message })] }), (0, jsx_runtime_1.jsx)("div", { className: "log-bubble-timestamp", children: timestamp })] }) }));
}
