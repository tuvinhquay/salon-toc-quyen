import type { AssistantIntent } from './assistant-local'

export type AssistantRoute = 'chat' | 'local' | 'hybrid'

const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd')
const advisoryPattern = /(tu van|giai thich|de xuat|nen lam gi|lam sao|chien luoc|ke hoach|vi sao|phan tich|cai thien|tang doanh thu|giam chi phi|toi uu|co nen|dinh huong|khuyen nghi)/i

/** Route is decided locally; Gemini never decides which salon data or permissions it may access. */
export function classifyAssistantRoute(question: string, intent: AssistantIntent): AssistantRoute {
  if (intent === 'guide') return 'local'
  const advisory = advisoryPattern.test(normalize(question))
  if (intent === 'general') return advisory ? 'hybrid' : 'chat'
  return advisory ? 'hybrid' : 'local'
}
