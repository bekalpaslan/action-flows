/**
 * Lifecycle hooks helper
 * Re-exports lifecycleManager for use in storage layer
 * Avoids circular dependency issues
 */

export { lifecycleManager } from '../services/lifecycleManager.js';
