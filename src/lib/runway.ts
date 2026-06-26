const API_KEY = import.meta.env.VITE_RUNWAY_API_KEY || ''
const BASE_URL = 'https://api.runwayml.com/v1'
const VERSION = '2024-11-06'

export function hasRunwayKey(): boolean {
  return !!API_KEY
}

function headers() {
  return {
    'Authorization': `Bearer ${API_KEY}`,
    'X-Runway-Version': VERSION,
    'Content-Type': 'application/json',
  }
}

async function request(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Runway ${res.status}: ${text}`)
  }
  return res.json()
}

async function getTask(taskId: string) {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'X-Runway-Version': VERSION,
    },
  })
  if (!res.ok) throw new Error(`Runway task fetch ${res.status}`)
  return res.json()
}

export async function pollTask(taskId: string, onProgress?: (pct: number) => void): Promise<string> {
  const MAX_ATTEMPTS = 120
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    const task = await getTask(taskId)
    if (task.status === 'SUCCEEDED') {
      const output = task.output?.[0]
      if (!output) throw new Error('No output from Runway task')
      return output
    }
    if (task.status === 'FAILED') {
      throw new Error(task.failure || 'Runway task failed')
    }
    if (onProgress && task.progress != null) {
      onProgress(Math.round(task.progress * 100))
    }
  }
  throw new Error('Runway task timed out')
}

export async function textToImage(prompt: string): Promise<string> {
  const data = await request('/text_to_image', {
    promptText: prompt,
    model: 'gen4_image',
    ratio: '1280:720',
  })
  return pollTask(data.id)
}

export async function imageToVideo(imageUrl: string, prompt = ''): Promise<string> {
  const data = await request('/image_to_video', {
    model: 'gen4_turbo',
    promptImage: imageUrl,
    promptText: prompt || undefined,
    ratio: '1280:720',
    duration: 5,
  })
  return pollTask(data.id)
}
