# E2E Test: Contract Drift - New Field

## Scenario
Agent output contains field not documented in CONTRACT.md.

## Setup
- Review agent outputs report with 'RiskFactors' field
- Field is valid and useful but not in Format 5.1 spec

## Expected Detection
- Result: DEGRADED (unknown field)
- Violation: "Unknown field 'RiskFactors' in Format 5.1"
- Health score: 92/100

## Expected Presentation
- Recommendation: "Consider adding 'RiskFactors' to CONTRACT.md"
- Healing flow suggested: contract-drift-fix/

## Expected Healing (when triggered)
- Flow: contract-drift-fix/
- Action: Add 'RiskFactors' to Format 5.1 as optional field
- Update validation schema

## Verification
- CONTRACT.md updated
- Field now passes validation
- Health score: 100/100
