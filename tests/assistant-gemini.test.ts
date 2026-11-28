import { afterEach, describe, expect, it, vi } from 'vitest'
import { getGeminiConfigurationStatus, getGeminiErrorDetails, testGeminiConnection } from '../src/app/assistant-gemini'

afterEach(() => vi.unstubAllGlobals())

describe('Gemini Developer API local proxy', () => {
  it('sends a request through the Termux server proxy without Firebase AI Logic', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ text: 'Xin chào' }) })
    vi.stubGlobal('fetch', fetchMock)
    await testGeminiConnection()
    expect(fetchMock).toHaveBeenCalledWith('/__local-api/gemini', expect.objectContaining({ method: 'POST' }))
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(requestBody.prompt).toContain('Xin chào')
    expect(requestBody.maxOutputTokens).toBeGreaterThanOrEqual(1024)
  })
  it('uses a server-only .env.local key configuration', () => {
    const status = getGeminiConfigurationStatus()
    expect(status.provider).toContain('Gemini Developer API')
    expect(status.keyStorage).toContain('.env.local')
    expect(status.keyStorage).not.toContain('VITE_')
    expect(status.model).toBe('gemini-3.5-flash-lite')
    expect(typeof status.expectedProject).toBe('boolean')
    expect(typeof status.firebaseProjectId).toBe('string')
  })
  it('redacts key-like values from errors', () => {
    const detail = getGeminiErrorDetails(new Error('request failed token=very-secret-value&retry=1'))
    expect(detail).not.toContain('very-secret-value')
    expect(detail).toContain('token=[REDACTED]')
  })
  it('preserves timeout codes', () => {
    expect(getGeminiErrorDetails(new Error('GEMINI_TIMEOUT'))).toContain('GEMINI_TIMEOUT')
  })
})
