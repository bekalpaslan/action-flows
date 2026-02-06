# ActionFlows Dashboard - Testing Documentation Index

**Phase:** Phase 2 - Real Claude Session Integration
**Status:** Testing framework complete and ready for use
**Created:** 2026-02-06

---

## Quick Navigation

### For Getting Started
- **Start here:** [E2E_TEST_GUIDE.md](E2E_TEST_GUIDE.md) — Comprehensive testing guide (413 lines)
- **For tests:** [test/README.md](test/README.md) — Quick reference for test files (220 lines)
- **Summary:** [TEST_FILES_SUMMARY.md](TEST_FILES_SUMMARY.md) — Overview of all created files

### For Running Tests
```bash
# Quick start - opens 3 terminals
Terminal 1: pnpm -F @afw/backend dev      # Start backend on :3001
Terminal 2: pnpm -F @afw/app dev          # Start app on :5173
Terminal 3: pnpm test:e2e                 # Run automated tests

# Then open browser to http://localhost:5173
```

### For Manual Testing
- **Test events:** [test/manual-test-events.json](test/manual-test-events.json) — 8 sample events, copy/paste ready
- **Test script:** [test/curl-commands.sh](test/curl-commands.sh) — Automated 9-event injection (executable)

---

## Files at a Glance

| File | Purpose | Lines | Link |
|------|---------|-------|------|
| **E2E_TEST_GUIDE.md** | Main comprehensive testing guide | 413 | [View](E2E_TEST_GUIDE.md) |
| **TEST_FILES_SUMMARY.md** | Overview of all created files | 280 | [View](TEST_FILES_SUMMARY.md) |
| **test/README.md** | Quick reference for test directory | 220 | [View](test/README.md) |
| **test/curl-commands.sh** | Automated test script (executable) | 234 | [View](test/curl-commands.sh) |
| **test/manual-test-events.json** | Sample events for manual testing | 173 | [View](test/manual-test-events.json) |
| **package.json** | Updated with test convenience scripts | Updated | [View](package.json) |

**Total:** 1,320+ lines of documentation and test code

---

## Testing Workflow

### Phase 1: Setup (5 minutes)
1. Read [E2E_TEST_GUIDE.md](E2E_TEST_GUIDE.md) Prerequisites section
2. Install dependencies: `pnpm install`
3. Build shared package: `pnpm -F @afw/shared build`

### Phase 2: Start Services (2 minutes)
4. Terminal 1: `pnpm -F @afw/backend dev` (wait for port 3001)
5. Terminal 2: `pnpm -F @afw/app dev` (wait for port 5173)
6. Open browser to http://localhost:5173

### Phase 3: Run Tests (5 minutes)
7. Terminal 3: `pnpm test:e2e`
8. Watch Dashboard for real-time updates
9. Verify 3-node chain appears and completes

### Phase 4: Manual Testing (optional)
10. See [test/README.md](test/README.md) for additional scenarios
11. Try custom events using [test/manual-test-events.json](test/manual-test-events.json)

---

## What Gets Tested

### Automated Test Scenario
The `curl-commands.sh` script sends 9 events representing a complete chain:

```
Event Flow:
Session Started
    └─ Chain Compiled (3 steps)
        ├─ Step 1: Spawned → Completed
        ├─ Step 2: Spawned → Completed
        ├─ Step 3: Spawned → Completed
        └─ Chain Completed
```

### What to Verify
- [ ] Backend receives events on `/events` endpoint
- [ ] WebSocket broadcasts to connected clients
- [ ] Frontend DAG renders nodes as events arrive
- [ ] Status colors transition correctly (gray → yellow → green)
- [ ] Inspector panel shows step details
- [ ] All 9 events process without errors

---

## Expected Test Results

### Success Criteria
✓ Backend starts on port 3001
✓ Frontend starts on port 5173
✓ WebSocket connection established
✓ Events received and broadcast
✓ DAG renders 3-node chain
✓ Node colors update in real-time
✓ Inspector shows step metadata
✓ No console errors
✓ Total execution time: ~10-15 seconds

### Dashboard at Each Stage

**Before Tests:**
```
Empty canvas
"No active chain" message
```

**During Event 1 (SessionStarted):**
```
Session initialized
Preparing for chain compilation
```

**During Event 2 (ChainCompiled):**
```
3 nodes appear in DAG
Nodes colored gray (pending)
Chain structure visible
```

**During Events 3-8 (Steps Spawned/Completed):**
```
Nodes animate to yellow (in-progress)
Completed nodes turn green
Inspector updates on click
Durations display correctly
```

**After Event 9 (ChainCompleted):**
```
All nodes green (complete)
Final summary displayed
Chain metrics shown
```

---

## Convenience Scripts

Added to `package.json` for easy testing:

```bash
# Run E2E tests automatically
pnpm test:e2e

# View E2E testing guide
pnpm test:e2e:docs

# Start backend only (for testing)
pnpm dev:backend

# Start app only (for testing)
pnpm dev:app

# Start all services (parallel)
pnpm dev

# Run all tests (project-wide)
pnpm test

# Build all packages
pnpm build
```

---

## Documentation Structure

```
Project Root/
│
├── E2E_TEST_GUIDE.md              # START HERE
│   └─ Comprehensive guide with all test scenarios
│
├── TEST_FILES_SUMMARY.md          # OVERVIEW
│   └─ Summary of all created files
│
├── TESTING_INDEX.md               # THIS FILE
│   └─ Quick navigation and workflow
│
├── test/
│   ├── README.md                  # Quick reference
│   ├── curl-commands.sh           # Automated tests
│   └── manual-test-events.json    # Sample events
│
└── package.json                   # Updated scripts
```

---

## Troubleshooting

### Quick Fixes
- **WebSocket not connecting?** → Check backend is running on port 3001
- **CORS errors?** → Restart backend with `pnpm -F @afw/backend dev`
- **Events not appearing?** → Reload Dashboard (Ctrl+R or Cmd+R)
- **Script permission error?** → Run `chmod +x test/curl-commands.sh`

For detailed troubleshooting, see [E2E_TEST_GUIDE.md Troubleshooting section](E2E_TEST_GUIDE.md#troubleshooting)

---

## Architecture at a Glance

```
Claude Session (Future Phase 3)
         ↓
    Backend (Express + WS)
    :3001
         ↓
    Frontend (React + Vite)
    :5173 ← View in browser
         ↓
    Dashboard DAG Visualization
```

**Data Flow:**
1. Event → POST `/events`
2. Backend processes → validate → store (Redis optional)
3. Backend broadcasts → WebSocket
4. Frontend receives → update state
5. React re-renders → DAG updates
6. User sees → real-time visualization

---

## Phase 2 Validation Checklist

Use this to confirm Phase 2 is complete:

- [ ] All 5 files created successfully
- [ ] E2E_TEST_GUIDE.md is comprehensive (413 lines)
- [ ] Test script is executable and runs without errors
- [ ] Sample events JSON is valid and complete
- [ ] Package.json has all 4 new scripts
- [ ] Backend starts successfully on :3001
- [ ] Frontend starts successfully on :5173
- [ ] WebSocket connection works
- [ ] Manual event injection via curl works
- [ ] Dashboard visualizes events in real-time
- [ ] No console errors during testing
- [ ] All 9 events in automated test process correctly
- [ ] DAG renders correctly with proper styling
- [ ] Inspector panel functions as expected

---

## Next Steps

### Immediate (Phase 2 Completion)
1. ✅ All testing files created
2. ✅ Documentation complete
3. ✅ Automated test script ready
4. Next: Run tests and validate Phase 2

### Soon (Phase 3 Preparation)
- Design Claude Code hook integration
- Plan session authentication/tokens
- Design event schema versioning
- Expand test suite for integration tests

### Later (Phase 3 Implementation)
- Implement Claude Code hook
- Add real session support
- Integrate with Claude codebase
- Deploy to production

---

## Key Files Reference

**For Developers:**
- [E2E_TEST_GUIDE.md](E2E_TEST_GUIDE.md) — Complete technical guide
- [test/README.md](test/README.md) — Practical how-to
- [test/curl-commands.sh](test/curl-commands.sh) — Ready-to-run automation
- [test/manual-test-events.json](test/manual-test-events.json) — Sample payloads

**For Project Management:**
- [TEST_FILES_SUMMARY.md](TEST_FILES_SUMMARY.md) — What was created
- [TESTING_INDEX.md](TESTING_INDEX.md) — Navigation (this file)

**For Configuration:**
- [package.json](package.json) — Scripts and dependencies

---

## Support & Questions

### Debugging Tools
- Browser DevTools → Console (frontend logs)
- Browser DevTools → Network → WS (WebSocket activity)
- Terminal output (backend logs)
- See Troubleshooting section in E2E_TEST_GUIDE.md

### Common Commands
```bash
# Check if port is in use
lsof -i :3001        # Check backend port (macOS/Linux)
netstat -ano | findstr :3001  # Check backend port (Windows)

# Make script executable
chmod +x test/curl-commands.sh

# Test curl connection
curl http://localhost:3001/health

# Test WebSocket
wscat -c ws://localhost:3001
```

---

## Summary

**What:** Complete E2E testing framework for ActionFlows Dashboard Phase 2

**Where:**
- Main guide: `/E2E_TEST_GUIDE.md`
- Tests: `/test/` directory
- Summary: `/TEST_FILES_SUMMARY.md`

**How:**
1. Read E2E_TEST_GUIDE.md
2. Run `pnpm test:e2e`
3. Watch Dashboard at localhost:5173

**Status:** ✅ All files created and ready to use

---

**Last Updated:** 2026-02-06
**Files Created:** 5 (+ 1 guide index file)
**Total Lines:** 1,320+
**Ready for Testing:** Yes
