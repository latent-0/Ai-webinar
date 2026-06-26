const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || ''

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (!API_KEY) return 'No ElevenLabs API key set. Add VITE_ELEVENLABS_API_KEY to your .env.local file.'

  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')
  formData.append('model_id', 'scribe_v1')

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`ElevenLabs error ${response.status}: ${err}`)
  }

  const data = await response.json()
  return (data.text as string) || ''
}
