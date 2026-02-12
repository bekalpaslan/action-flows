# utils/

- bundleAnalyzer.ts — exports: BundleMetrics, WebVitalsMetrics, default, formatMetrics, getCurrentBundleMetrics, initPerformanceMonitoring, logBundleMetrics
- buttonContextDetector.ts — exports: ContextDetectionResult, detectAllContexts, detectContext
- chainTypeDetection.ts — exports: ChainMetadata, ChainType, detectChainType, extractChangeId, getChainBadge, getChainTypeClass, inferTypeFromActions
- commandRegistry.ts — exports: Command, CommandCategory, CommandRegistry, commandRegistry
- contextPatternMatcher.ts — exports: PatternMatcher, detectPromptType, extractQuickResponses, generateQuickActionsFromContext
- performance.ts — exports: WebVitalsMetrics, getMemoryUsage, reportWebVitals, useFPSCounter, useRenderTiming
- sessionLifecycle.ts — exports: LifecycleStateChange, LifecycleTransition, SessionLifecycleStateMachine, StateChangeCallback, getLifecycleBadgeConfig
- streamJsonParser.ts — exports: EnrichedStepData, ParsedStreamBlock, detectTaskSpawns, extractMetadata, mapToolUseToSteps, parseStreamJson
- swimlaneLayout.ts — exports: EdgeDefinition, NodePosition, SwimlaneAssignment, assignSwimlanes, calculateNodePositions, calculateSwimlaneEdges, getSwimlaneNames, groupStepsByChain
- toolbarOrdering.ts — exports: ToolbarStats, calculateToolbarStats, createSlot, getSuggestedButtons, getVisibleSlots, removeSlot, reorderSlots, sortToolbarSlots, trackButtonUsage, updatePinnedStatus
