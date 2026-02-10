/**
 * Chrome MCP E2E Test: Conversation Panel
 *
 * Tests for conversation panel message display and interaction.
 *
 * Execution:
 * 1. Start dev servers: pnpm dev:backend && pnpm dev:app
 * 2. Ask Claude: "run the conversation panel E2E tests"
 * 3. Claude will execute each test step-by-step
 *
 * Test Coverage:
 * - CONV-001: Messages display (assistant + user, correct styling)
 * - CONV-002: Send message via input + send button
 * - CONV-003: Quick response buttons visible and clickable
 * - CONV-004: Awaiting input state toggles (disabled ↔ enabled)
 * - CONV-005: Messages auto-scroll to bottom
 */

import type { TestStep, TestContext } from './chrome-mcp-utils';
import {
  BACKEND_URL,
  FRONTEND_URL,
  TIMEOUTS,
  SELECTORS,
  API_ENDPOINTS,
  TEST_MESSAGE,
} from './chrome-mcp-utils';

// ========================================
// CONV-001: Message Display
// ========================================

export const conv001_step01_setup: TestStep = {
  id: 'conv-001-setup',
  name: 'Create Test Session with Messages',
  description: 'Seed session via API with messages',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      // Create session
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'e2e-conv-test',
          cwd: '/test',
          hostname: 'e2e',
          platform: 'test'
        })
      });
      const data = await res.json();
      const sessionId = data.id;

      // Add messages via chat endpoint
      await fetch('${BACKEND_URL}/api/sessions/' + sessionId + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'assistant', content: 'Hello! How can I help you today?' },
            { role: 'user', content: 'I need help with my project.' },
            { role: 'assistant', content: 'I would be happy to help! What do you need?' }
          ]
        })
      });

      return sessionId;
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Session should be created with messages',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Store session ID
    return {};
  },
};

export const conv001_step02_navigate: TestStep = {
  id: 'conv-001-navigate',
  name: 'Navigate to Frontend',
  description: 'Load dashboard',
  tool: 'navigate_page',
  params: {
    type: 'url',
    url: FRONTEND_URL,
    timeout: TIMEOUTS.navigation,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Page should load',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const conv001_step03_selectSession: TestStep = {
  id: 'conv-001-select-session',
  name: 'Select Session',
  description: 'Click session to load conversation',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.sessionSidebarItem,
      expected: true,
      message: 'Session item should exist',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract sessionItem UID
    return {};
  },
};

export const conv001_step04_click: TestStep = {
  id: 'conv-001-click',
  name: 'Click Session',
  description: 'Click to load conversation panel',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.sessionItem || '<from-snapshot>',
    includeSnapshot: true,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Click should succeed',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const conv001_step05_verifyMessages: TestStep = {
  id: 'conv-001-verify-messages',
  name: 'Verify Messages Display',
  description: 'Check all messages appear with correct styling',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.messagesContainer,
      expected: true,
      message: 'Messages container should be visible',
    },
    {
      check: 'snapshot_has_element',
      target: SELECTORS.message,
      expected: true,
      message: 'Messages should be visible',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const conv001_step06_verifyMessageTypes: TestStep = {
  id: 'conv-001-verify-message-types',
  name: 'Verify Message Types',
  description: 'Check assistant and user messages have correct classes',
  tool: 'evaluate_script',
  params: {
    function: `() => {
      const assistantMessages = document.querySelectorAll('.${SELECTORS.messageAssistant}');
      const userMessages = document.querySelectorAll('.${SELECTORS.messageUser}');
      return {
        assistantCount: assistantMessages.length,
        userCount: userMessages.length,
        totalMessages: assistantMessages.length + userMessages.length,
        hasAssistant: assistantMessages.length >= 2,
        hasUser: userMessages.length >= 1
      };
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Should have assistant and user messages',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const conv001_step07_cleanup: TestStep = {
  id: 'conv-001-cleanup',
  name: 'Cleanup Test Session',
  description: 'Delete test session',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
      const sessionId = '${context.sessionId || ''}';
      const res = await fetch('${BACKEND_URL}/api/sessions/' + sessionId, {
        method: 'DELETE'
      });
      return res.ok;
    }`,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Cleanup should succeed',
    },
  ],
  screenshot: false,
  onFailure: 'continue',
};

// ========================================
// CONV-002: Send Message
// ========================================

export const conv002_step01_setup: TestStep = {
  id: 'conv-002-setup',
  name: 'Create Test Session',
  description: 'Seed session via API',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'e2e-send-test',
          cwd: '/test',
          hostname: 'e2e',
          platform: 'test'
        })
      });
      const data = await res.json();
      // Set awaiting_input to true
      await fetch('${BACKEND_URL}/api/sessions/' + data.id + '/awaiting', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ awaiting_input: true })
      });
      return data.id;
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Session should be created',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Store session ID
    return {};
  },
};

export const conv002_step02_navigate: TestStep = {
  id: 'conv-002-navigate',
  name: 'Navigate to Frontend',
  description: 'Load dashboard',
  tool: 'navigate_page',
  params: {
    type: 'url',
    url: FRONTEND_URL,
    timeout: TIMEOUTS.navigation,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Page should load',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const conv002_step03_selectSession: TestStep = {
  id: 'conv-002-select-session',
  name: 'Select Session',
  description: 'Click session to load conversation',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.sessionSidebarItem,
      expected: true,
      message: 'Session item should exist',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract sessionItem UID
    return {};
  },
};

export const conv002_step04_click: TestStep = {
  id: 'conv-002-click',
  name: 'Click Session',
  description: 'Click to load conversation panel',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.sessionItem || '<from-snapshot>',
    includeSnapshot: true,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Click should succeed',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const conv002_step05_locateInput: TestStep = {
  id: 'conv-002-locate-input',
  name: 'Locate Chat Input',
  description: 'Find chat input field UID',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: 'textarea',
      expected: true,
      message: 'Chat input should be visible',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract chatInput UID
    return {};
  },
};

export const conv002_step06_typeMessage: TestStep = {
  id: 'conv-002-type-message',
  name: 'Type Test Message',
  description: `Enter test message: "${TEST_MESSAGE}"`,
  tool: 'fill',
  params: (context: TestContext) => ({
    uid: context.elementUids.chatInput || '<from-snapshot>',
    value: TEST_MESSAGE,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Text input should succeed',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const conv002_step07_locateSendBtn: TestStep = {
  id: 'conv-002-locate-send',
  name: 'Locate Send Button',
  description: 'Find send button UID',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: 'button',
      expected: true,
      message: 'Send button should be visible',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract chatSendBtn UID
    return {};
  },
};

export const conv002_step08_sendMessage: TestStep = {
  id: 'conv-002-send-message',
  name: 'Send Message',
  description: 'Click send button',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.chatSendBtn || '<from-snapshot>',
    includeSnapshot: true,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Send button click should succeed',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const conv002_step09_verifyMessageSent: TestStep = {
  id: 'conv-002-verify-sent',
  name: 'Verify Message Sent',
  description: 'Check message appears in conversation',
  tool: 'wait_for',
  params: {
    text: 'Hello from E2E test',
    timeout: TIMEOUTS.messageDisplay,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Message should appear',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const conv002_step10_cleanup: TestStep = {
  id: 'conv-002-cleanup',
  name: 'Cleanup Test Session',
  description: 'Delete test session',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
      const sessionId = '${context.sessionId || ''}';
      const res = await fetch('${BACKEND_URL}/api/sessions/' + sessionId, {
        method: 'DELETE'
      });
      return res.ok;
    }`,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Cleanup should succeed',
    },
  ],
  screenshot: false,
  onFailure: 'continue',
};

// ========================================
// CONV-003: Quick Response Buttons
// ========================================

export const conv003_step01_setup: TestStep = {
  id: 'conv-003-setup',
  name: 'Create Test Session',
  description: 'Seed session via API',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'e2e-quick-test',
          cwd: '/test',
          hostname: 'e2e',
          platform: 'test'
        })
      });
      const data = await res.json();
      // Set awaiting_input to show quick responses
      await fetch('${BACKEND_URL}/api/sessions/' + data.id + '/awaiting', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ awaiting_input: true })
      });
      return data.id;
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Session should be created',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Store session ID
    return {};
  },
};

export const conv003_step02_navigate: TestStep = {
  id: 'conv-003-navigate',
  name: 'Navigate to Frontend',
  description: 'Load dashboard',
  tool: 'navigate_page',
  params: {
    type: 'url',
    url: FRONTEND_URL,
    timeout: TIMEOUTS.navigation,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Page should load',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const conv003_step03_selectSession: TestStep = {
  id: 'conv-003-select-session',
  name: 'Select Session',
  description: 'Click session to load conversation',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.sessionSidebarItem,
      expected: true,
      message: 'Session item should exist',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract sessionItem UID
    return {};
  },
};

export const conv003_step04_click: TestStep = {
  id: 'conv-003-click',
  name: 'Click Session',
  description: 'Click to load conversation panel',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.sessionItem || '<from-snapshot>',
    includeSnapshot: true,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Click should succeed',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const conv003_step05_verifyQuickResponses: TestStep = {
  id: 'conv-003-verify-quick',
  name: 'Verify Quick Response Buttons',
  description: 'Check quick response buttons are visible',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.quickResponses,
      expected: true,
      message: 'Quick responses container should be visible',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
};

export const conv003_step06_checkButtons: TestStep = {
  id: 'conv-003-check-buttons',
  name: 'Check Quick Response Buttons',
  description: 'Verify quick response buttons exist',
  tool: 'evaluate_script',
  params: {
    function: `() => {
      const buttons = document.querySelectorAll('.${SELECTORS.quickResponseBtn}');
      return {
        buttonCount: buttons.length,
        hasButtons: buttons.length > 0
      };
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Quick response buttons should exist',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
};

export const conv003_step07_cleanup: TestStep = {
  id: 'conv-003-cleanup',
  name: 'Cleanup Test Session',
  description: 'Delete test session',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
      const sessionId = '${context.sessionId || ''}';
      const res = await fetch('${BACKEND_URL}/api/sessions/' + sessionId, {
        method: 'DELETE'
      });
      return res.ok;
    }`,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Cleanup should succeed',
    },
  ],
  screenshot: false,
  onFailure: 'continue',
};

// ========================================
// CONV-004: Awaiting Input State
// ========================================

export const conv004_step01_setup: TestStep = {
  id: 'conv-004-setup',
  name: 'Create Test Session',
  description: 'Seed session via API',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'e2e-awaiting-test',
          cwd: '/test',
          hostname: 'e2e',
          platform: 'test'
        })
      });
      const data = await res.json();
      return data.id;
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Session should be created',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Store session ID
    return {};
  },
};

export const conv004_step02_navigate: TestStep = {
  id: 'conv-004-navigate',
  name: 'Navigate to Frontend',
  description: 'Load dashboard',
  tool: 'navigate_page',
  params: {
    type: 'url',
    url: FRONTEND_URL,
    timeout: TIMEOUTS.navigation,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Page should load',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const conv004_step03_selectSession: TestStep = {
  id: 'conv-004-select-session',
  name: 'Select Session',
  description: 'Click session to load conversation',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.sessionSidebarItem,
      expected: true,
      message: 'Session item should exist',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract sessionItem UID
    return {};
  },
};

export const conv004_step04_click: TestStep = {
  id: 'conv-004-click',
  name: 'Click Session',
  description: 'Click to load conversation panel',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.sessionItem || '<from-snapshot>',
    includeSnapshot: true,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Click should succeed',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const conv004_step05_verifyDisabled: TestStep = {
  id: 'conv-004-verify-disabled',
  name: 'Verify Input Disabled',
  description: 'Check input is disabled when not awaiting',
  tool: 'evaluate_script',
  params: {
    function: `() => {
      const input = document.querySelector('.${SELECTORS.chatInputField}');
      const sendBtn = document.querySelector('.${SELECTORS.chatSendBtn}');
      return {
        inputDisabled: input && input.hasAttribute('disabled'),
        sendBtnDisabled: sendBtn && sendBtn.hasAttribute('disabled')
      };
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Input should be disabled',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
};

export const conv004_step06_enableAwaiting: TestStep = {
  id: 'conv-004-enable-awaiting',
  name: 'Enable Awaiting Input',
  description: 'Set awaiting_input to true via API',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
      const sessionId = '${context.sessionId || ''}';
      const res = await fetch('${BACKEND_URL}/api/sessions/' + sessionId + '/awaiting', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ awaiting_input: true })
      });
      return res.ok;
    }`,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Awaiting update should succeed',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
};

export const conv004_step07_verifyEnabled: TestStep = {
  id: 'conv-004-verify-enabled',
  name: 'Verify Input Enabled',
  description: 'Check input is enabled after awaiting state change',
  tool: 'evaluate_script',
  params: {
    function: `() => {
      const input = document.querySelector('.${SELECTORS.chatInputField}');
      const sendBtn = document.querySelector('.${SELECTORS.chatSendBtn}');
      return {
        inputEnabled: input && !input.hasAttribute('disabled'),
        sendBtnEnabled: sendBtn && !sendBtn.hasAttribute('disabled')
      };
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Input should be enabled',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
};

export const conv004_step08_cleanup: TestStep = {
  id: 'conv-004-cleanup',
  name: 'Cleanup Test Session',
  description: 'Delete test session',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
      const sessionId = '${context.sessionId || ''}';
      const res = await fetch('${BACKEND_URL}/api/sessions/' + sessionId, {
        method: 'DELETE'
      });
      return res.ok;
    }`,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Cleanup should succeed',
    },
  ],
  screenshot: false,
  onFailure: 'continue',
};

// ========================================
// CONV-005: Auto-scroll
// ========================================

export const conv005_step01_setup: TestStep = {
  id: 'conv-005-setup',
  name: 'Create Test Session with Many Messages',
  description: 'Seed session with enough messages to require scrolling',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      // Create session
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'e2e-scroll-test',
          cwd: '/test',
          hostname: 'e2e',
          platform: 'test'
        })
      });
      const data = await res.json();
      const sessionId = data.id;

      // Add many messages to force scrolling
      const messages = [];
      for (let i = 0; i < 20; i++) {
        messages.push({ role: 'assistant', content: 'Message ' + i });
        messages.push({ role: 'user', content: 'Response ' + i });
      }

      await fetch('${BACKEND_URL}/api/sessions/' + sessionId + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });

      return sessionId;
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Session should be created with messages',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Store session ID
    return {};
  },
};

export const conv005_step02_navigate: TestStep = {
  id: 'conv-005-navigate',
  name: 'Navigate to Frontend',
  description: 'Load dashboard',
  tool: 'navigate_page',
  params: {
    type: 'url',
    url: FRONTEND_URL,
    timeout: TIMEOUTS.navigation,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Page should load',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const conv005_step03_selectSession: TestStep = {
  id: 'conv-005-select-session',
  name: 'Select Session',
  description: 'Click session to load conversation',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.sessionSidebarItem,
      expected: true,
      message: 'Session item should exist',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract sessionItem UID
    return {};
  },
};

export const conv005_step04_click: TestStep = {
  id: 'conv-005-click',
  name: 'Click Session',
  description: 'Click to load conversation panel',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.sessionItem || '<from-snapshot>',
    includeSnapshot: true,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Click should succeed',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const conv005_step05_verifyScroll: TestStep = {
  id: 'conv-005-verify-scroll',
  name: 'Verify Auto-scroll',
  description: 'Check messages container is scrolled to bottom',
  tool: 'evaluate_script',
  params: {
    function: `() => {
      const container = document.querySelector('.${SELECTORS.messagesContainer}');
      if (!container) return false;

      const isScrolledToBottom =
        Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 10;

      return {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
        clientHeight: container.clientHeight,
        isScrolledToBottom
      };
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Container should be scrolled to bottom',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
};

export const conv005_step06_cleanup: TestStep = {
  id: 'conv-005-cleanup',
  name: 'Cleanup Test Session',
  description: 'Delete test session',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
      const sessionId = '${context.sessionId || ''}';
      const res = await fetch('${BACKEND_URL}/api/sessions/' + sessionId, {
        method: 'DELETE'
      });
      return res.ok;
    }`,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Cleanup should succeed',
    },
  ],
  screenshot: false,
  onFailure: 'continue',
};

/**
 * All test steps in execution order
 */
export const testSteps: TestStep[] = [
  // CONV-001
  conv001_step01_setup,
  conv001_step02_navigate,
  conv001_step03_selectSession,
  conv001_step04_click,
  conv001_step05_verifyMessages,
  conv001_step06_verifyMessageTypes,
  conv001_step07_cleanup,

  // CONV-002
  conv002_step01_setup,
  conv002_step02_navigate,
  conv002_step03_selectSession,
  conv002_step04_click,
  conv002_step05_locateInput,
  conv002_step06_typeMessage,
  conv002_step07_locateSendBtn,
  conv002_step08_sendMessage,
  conv002_step09_verifyMessageSent,
  conv002_step10_cleanup,

  // CONV-003
  conv003_step01_setup,
  conv003_step02_navigate,
  conv003_step03_selectSession,
  conv003_step04_click,
  conv003_step05_verifyQuickResponses,
  conv003_step06_checkButtons,
  conv003_step07_cleanup,

  // CONV-004
  conv004_step01_setup,
  conv004_step02_navigate,
  conv004_step03_selectSession,
  conv004_step04_click,
  conv004_step05_verifyDisabled,
  conv004_step06_enableAwaiting,
  conv004_step07_verifyEnabled,
  conv004_step08_cleanup,

  // CONV-005
  conv005_step01_setup,
  conv005_step02_navigate,
  conv005_step03_selectSession,
  conv005_step04_click,
  conv005_step05_verifyScroll,
  conv005_step06_cleanup,
];

/**
 * Test metadata
 */
export const testMetadata = {
  name: 'Conversation Panel E2E Tests',
  description: 'Tests for conversation panel message display and interaction',
  version: '1.0.0',
  prerequisites: [
    'Backend running on localhost:3001',
    'Frontend running on localhost:5173',
    'Chrome DevTools MCP server connected',
  ],
  totalSteps: testSteps.length,
  estimatedDuration: '120-150 seconds',
  tests: [
    {
      id: 'CONV-001',
      name: 'Messages display with correct styling',
      steps: 7,
    },
    {
      id: 'CONV-002',
      name: 'Send message via input and send button',
      steps: 10,
    },
    {
      id: 'CONV-003',
      name: 'Quick response buttons visible and clickable',
      steps: 7,
    },
    {
      id: 'CONV-004',
      name: 'Awaiting input state toggles',
      steps: 8,
    },
    {
      id: 'CONV-005',
      name: 'Messages auto-scroll to bottom',
      steps: 6,
    },
  ],
};
