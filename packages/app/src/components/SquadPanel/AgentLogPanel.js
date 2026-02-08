"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentLogPanel = AgentLogPanel;
var jsx_runtime_1 = require("react/jsx-runtime");
/**
 * AgentLogPanel Component
 *
 * Expandable log display that unfolds inline beneath an agent card.
 * Renders color-coded log bubbles with auto-scroll to bottom on new entries.
 *
 * Features:
 * - Inline expand/collapse animation (slide down from agent card)
 * - Max height with auto-scroll for many logs
 * - Auto-scroll to bottom on new log entries
 * - Chat bubble style - agent "speaks" their logs
 * - Border color matches agent's glow color
 */
var react_1 = require("react");
var LogBubble_1 = require("./LogBubble");
require("./AgentLogPanel.css");
function AgentLogPanel(_a) {
    var agent = _a.agent, isExpanded = _a.isExpanded, _b = _a.maxHeight, maxHeight = _b === void 0 ? 400 : _b, _c = _a.className, className = _c === void 0 ? '' : _c;
    var scrollContainerRef = (0, react_1.useRef)(null);
    // Auto-scroll to bottom when new logs arrive or panel expands
    (0, react_1.useEffect)(function () {
        if (isExpanded && scrollContainerRef.current) {
            // Use setTimeout to ensure DOM has updated before scrolling
            var timer_1 = setTimeout(function () {
                var _a;
                (_a = scrollContainerRef.current) === null || _a === void 0 ? void 0 : _a.scrollTo({
                    top: scrollContainerRef.current.scrollHeight,
                    behavior: 'smooth',
                });
            }, 0);
            return function () { return clearTimeout(timer_1); };
        }
    }, [isExpanded, agent.logs]);
    if (!isExpanded) {
        return null;
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "agent-log-panel log-panel-expanded log-panel-border-".concat(agent.role, " ").concat(className), style: { maxHeight: "".concat(maxHeight, "px") }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "log-panel-header", children: [(0, jsx_runtime_1.jsxs)("span", { className: "log-panel-agent-name", children: [agent.name, " Logs"] }), (0, jsx_runtime_1.jsx)("span", { className: "log-panel-count", children: agent.logs.length })] }), (0, jsx_runtime_1.jsx)("div", { className: "log-panel-scroll-container", ref: scrollContainerRef, children: agent.logs.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "log-panel-empty", children: (0, jsx_runtime_1.jsx)("p", { children: "No logs yet. Waiting for output..." }) })) : ((0, jsx_runtime_1.jsx)("div", { className: "log-bubbles-list", children: agent.logs.map(function (log) { return ((0, jsx_runtime_1.jsx)(LogBubble_1.LogBubble, { log: log }, log.id)); }) })) })] }));
}
