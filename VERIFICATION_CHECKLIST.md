# Phase 9 Fixes - Verification Checklist

## Pre-Deployment Checks

### Build & Type Safety
- [ ] Run TypeScript compiler: `cd packages/app && pnpm run build`
  - Expected: No type errors
  - Tests: C2 fix (TypeScript type safety)

- [ ] Check for ESLint warnings: `cd packages/app && pnpm run lint` (if configured)
  - Expected: No hook dependency warnings
  - Tests: C1 fix (React hooks violations)

### Backend Tests
- [ ] Start backend: `cd packages/backend && pnpm run dev`
- [ ] Test file write with normal content (<10MB)
  ```bash
  curl -X POST "http://localhost:3001/api/files/{sessionId}/write?path=test.txt" \
    -H "Content-Type: application/json" \
    -d '{"content":"Hello World"}'
  ```
  - Expected: 200 OK with success response
  - Tests: C5 fix (size limit validation passes for small files)

- [ ] Test file write with large content (>10MB)
  ```bash
  # Generate 11MB of data
  node -e "console.log('x'.repeat(11*1024*1024))" > large.txt
  curl -X POST "http://localhost:3001/api/files/{sessionId}/write?path=test-large.txt" \
    -H "Content-Type: application/json" \
    -d "{\"content\":\"$(cat large.txt)\"}"
  ```
  - Expected: 413 Payload Too Large error
  - Tests: C5 fix (DoS protection)

### Frontend Tests

#### C1: React Hooks Violations
- [ ] Open app with `initialFiles` prop containing 3+ files
- [ ] Verify all files open correctly
- [ ] Check browser console for React warnings
- Expected: No "Cannot update during render" or "missing dependency" warnings

#### C3: Race Condition in Save
- [ ] Open a file in the editor
- [ ] Type rapidly for 5 seconds (simulate fast editing)
- [ ] Immediately press Ctrl+S
- [ ] Check file contents on disk
- Expected: File contains the most recent typed content (no lost edits)

#### C4: Monaco Web Workers
- [ ] Open a TypeScript file (.ts)
  - [ ] Verify syntax highlighting works
  - [ ] Type `const x: number = "string"` - verify red squiggle error
  - [ ] Type `console.` - verify IntelliSense dropdown appears

- [ ] Open a JavaScript file (.js)
  - [ ] Verify syntax highlighting works
  - [ ] Type `Math.` - verify IntelliSense dropdown appears

- [ ] Open a JSON file (.json)
  - [ ] Type invalid JSON (missing comma)
  - [ ] Verify red squiggle error appears

- [ ] Open a CSS file (.css)
  - [ ] Verify syntax highlighting works
  - [ ] Type property name - verify IntelliSense suggestions

- [ ] Check browser console
- Expected: No errors about "Failed to load worker" or "Worker not found"

#### H1: Tab Scroll State
- [ ] Open 15+ files (more than can fit in tab bar)
- [ ] Verify scroll arrows appear (< and >)
- [ ] Close tabs randomly until only 5 remain
- [ ] After each close, verify active tab is visible
- Expected: Active tab always scrolls into view automatically

#### H2: Duplicate Language Map
- [ ] Open React DevTools
- [ ] Navigate to Profiler tab
- [ ] Start recording
- [ ] Switch between files 10 times
- [ ] Stop recording
- [ ] Check CodeEditor component re-renders
- Expected: Minimal re-renders (no unnecessary renders from object recreation)

#### H3: Dependency Version
- [ ] Check installed version:
  ```bash
  cd packages/app
  cat node_modules/@monaco-editor/react/package.json | grep version
  ```
- Expected: Shows 4.7.0 (or 4.6.0 if manual install not done yet)
- Note: 4.6.0 is acceptable, 4.7.0 is just latest

## Performance Verification

### Before/After Metrics
Use browser DevTools Performance tab:

1. **Measure: File switch time**
   - Open 5 files
   - Record performance
   - Switch between files 10 times
   - Expected: <50ms per switch

2. **Measure: Save operation time**
   - Edit a file
   - Record performance
   - Save file (Ctrl+S)
   - Expected: <100ms to complete

3. **Measure: IntelliSense response**
   - Open .ts file
   - Type `console.`
   - Measure time until dropdown appears
   - Expected: <200ms

## Security Verification

### C5: DoS Protection
- [ ] Attempt to write 5MB file - should succeed
- [ ] Attempt to write 15MB file - should fail with 413
- [ ] Verify error message is clear and informative
- [ ] Check server doesn't crash or hang

## User Acceptance Testing

### Workflow Test: Full Editing Session
1. [ ] Launch app
2. [ ] Open 10 files from file explorer
3. [ ] Edit 3 different files
4. [ ] Switch between files multiple times
5. [ ] Save all edited files (Ctrl+S on each)
6. [ ] Close some files
7. [ ] Open new files
8. [ ] Use IntelliSense in TypeScript files
9. [ ] Use Find (Ctrl+F) feature
10. [ ] Use Go to Line (Ctrl+G) feature

Expected: Smooth experience with no errors, crashes, or unexpected behavior

## Regression Testing

### Features That Should Still Work
- [ ] File explorer tree navigation
- [ ] Double-click to open files
- [ ] Unsaved changes indicator (dot on tab)
- [ ] Confirm dialog on close with unsaved changes
- [ ] Middle-click to close tabs
- [ ] Tab scrolling arrows
- [ ] Syntax highlighting for all supported languages
- [ ] Editor themes (vs-dark)
- [ ] Minimap
- [ ] Line numbers
- [ ] Word wrap
- [ ] Find/Replace (Ctrl+F, Ctrl+H)
- [ ] Go to Line (Ctrl+G)

## Sign-Off

### Code Review
- [ ] All files reviewed by second developer
- [ ] No obvious bugs or issues found
- [ ] Code follows project style guidelines

### Testing Sign-Off
- [ ] All critical tests pass
- [ ] All high priority tests pass
- [ ] No regressions detected
- [ ] Performance metrics acceptable

### Deployment Approval
- [ ] Product owner approval
- [ ] Technical lead approval
- [ ] Ready for production deployment

---

**Notes:**
- All checkboxes must be checked before production deployment
- Any failures must be documented and addressed
- If issues are found, return to development phase
