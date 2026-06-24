import Anthropic from '@anthropic-ai/sdk'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''

let client: Anthropic | null = null

function getClient() {
  if (!API_KEY) return null
  if (!client) client = new Anthropic({ apiKey: API_KEY, dangerouslyAllowBrowser: true })
  return client
}

export const CLAUDE_MODELS = [
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8', badge: 'Most Capable' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', badge: 'Balanced' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', badge: 'Fast' },
]

export async function askClaude(prompt: string, context?: string, model = 'claude-opus-4-8'): Promise<string> {
  const c = getClient()
  if (!c) return 'No API key set. Add VITE_ANTHROPIC_API_KEY to your .env.local file.'

  const systemPrompt = context
    ? `You are an AI assistant for the Sandbox platform. ${context}\n\nProvide a concise, helpful response.`
    : 'You are an AI assistant for the Sandbox learning platform. Answer questions concisely and helpfully.'

  try {
    const message = await c.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = message.content[0]
    return block.type === 'text' ? block.text : 'Unexpected response format.'
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return `API error: ${msg}`
  }
}
