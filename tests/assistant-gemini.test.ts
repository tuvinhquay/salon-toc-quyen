import { describe, expect, it } from 'vitest'
import { getGeminiErrorDetails } from '../src/app/assistant-gemini'

describe('Gemini error diagnostics', () => {
  it('redacts API keys and token query values from SDK errors', () => {
    const detail = getGeminiErrorDetails(new Error('request failed token=very-secret-value&retry=1'))
    expect(detail).not.toContain('very-secret-value')
    expect(detail).toContain('token=[REDACTED]')
  })
  it('preserves actionable timeout codes', () => {
    expect(getGeminiErrorDetails(new Error('GEMINI_TIMEOUT'))).toContain('GEMINI_TIMEOUT')
  })
})
