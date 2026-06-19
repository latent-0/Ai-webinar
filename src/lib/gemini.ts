import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

let genAI: GoogleGenerativeAI | null = null

function getClient() {
  if (!API_KEY) return null
  if (!genAI) genAI = new GoogleGenerativeAI(API_KEY)
  return genAI
}

export async function askGemini(prompt: string, context?: string): Promise<string> {
  const client = getClient()
  if (!client) {
    return 'Please add your VITE_GEMINI_API_KEY to enable AI features.'
  }

  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const fullPrompt = context
    ? `You are an AI assistant for the Sandbox platform. Context: ${context}\n\nUser question: ${prompt}\n\nProvide a concise, helpful response.`
    : `You are an AI assistant for the Sandbox learning platform. Answer this question concisely and helpfully: ${prompt}`

  const result = await model.generateContent(fullPrompt)
  return result.response.text()
}

export async function generateWebinarSummary(questions: string[]): Promise<string> {
  const client = getClient()
  if (!client) return 'AI features require a Gemini API key.'

  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const prompt = `Summarize these webinar questions into key themes and insights:\n${questions.join('\n')}`
  const result = await model.generateContent(prompt)
  return result.response.text()
}

export async function generateLearningPath(topic: string): Promise<string> {
  const client = getClient()
  if (!client) return 'AI features require a Gemini API key.'

  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const prompt = `Create a concise 5-step learning path for: "${topic}". Format as numbered steps with brief descriptions. Be practical and actionable.`
  const result = await model.generateContent(prompt)
  return result.response.text()
}
