import type { AssistantIntent } from './assistant-local'

export type AssistantRoute = 'chat' | 'local' | 'hybrid'

const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
const advisoryPattern = /(tu van|giai thich|de xuat|nen lam gi|lam sao|chien luoc|ke hoach|vi sao|phan tich|cai thien|tang doanh thu|giam chi phi|toi uu|co nen|dinh huong|khuyen nghi)/i

/** Route is decided locally; Gemini never decides which salon data or permissions it may access. */
export function classifyAssistantRoute(question: string, intent: AssistantIntent): AssistantRoute {
  if (intent === 'guide') return 'local'
  const advisory = advisoryPattern.test(normalize(question))
  if (intent === 'general') return advisory ? 'hybrid' : 'chat'
  return advisory ? 'hybrid' : 'local'
}

/** Remove obvious contact identifiers without opening any salon database tables. */
export function sanitizeQuestionForGemini(question: string): string {
  return question
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi, '[email đã ẩn]')
    .replace(/(?:[+]?[0-9]{1,3})?(?:[ .-]*[0-9]){9,11}/g, '[số điện thoại đã ẩn]')
    .slice(0, 4000)
}
