/**
 * Signature Verification Service
 * Verifies GPG signatures on FlowHub flow manifests
 */

import type { FlowManifest } from '@afw/shared';

// ============================================================================
// Types
// ============================================================================

export interface SignatureVerificationResult {
  /** Whether the signature was successfully verified */
  verified: boolean;
  /** GPG key ID if signature was verified */
  signerId?: string;
  /** Reason for verification failure */
  reason?: 'unsigned' | 'invalid-signature' | 'unknown-key' | 'verification-error' | 'not-implemented';
}

// ============================================================================
// SignatureVerifier Class
// ============================================================================

class SignatureVerifier {
  /**
   * Check if strict mode is enabled via environment variable
   * When strict mode is on, unsigned flows will be rejected
   */
  isStrictModeEnabled(): boolean {
    const strictMode = process.env.FLOWHUB_STRICT_MODE;
    return strictMode === 'true' || strictMode === '1';
  }

  /**
   * Verify GPG signature on a flow manifest
   *
   * @param manifest - Flow manifest to verify
   * @returns Verification result with status and optional signerId/reason
   */
  async verifyFlowSignature(manifest: FlowManifest): Promise<SignatureVerificationResult> {
    // 1. Check if manifest has a signature
    if (!manifest.signature) {
      console.warn(`[SignatureVerifier] Flow ${manifest.flowId} is unsigned`);
      return {
        verified: false,
        reason: 'unsigned',
      };
    }

    // 2. Phase 3 stub - GPG verification not yet implemented
    // TODO: Phase 3 stub - implement GPG verification in production
    // For production implementation, consider:
    // - Using openpgp.js for pure JS implementation
    // - Using node-gpg for native GPG integration
    // - Extracting manifest content (excluding signature field) for verification
    // - Parsing GPG signature format
    // - Verifying against trusted keyring
    console.warn('[SignatureVerifier] GPG verification not yet implemented - accepting unsigned flows');

    return {
      verified: false,
      reason: 'not-implemented',
    };
  }
}

// Export singleton instance
export const signatureVerifier = new SignatureVerifier();
