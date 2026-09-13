/**
 * Cloudflare Worker - OpenAI API Relay
 * POST /api/chat - relay messages to OpenAI
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS })
    }

    // POST /api/chat
    if (request.method === 'POST' && new URL(request.url).pathname === '/api/chat') {
      try {
        const { message, model } = await request.json()

        // Validate input
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
          return response(false, 'Message required', 400, { error: 'Invalid message' }, CORS_HEADERS)
        }

        if (message.length > 2000) {
          return response(false, 'Message too long', 400, { error: 'Max 2000 chars' }, CORS_HEADERS)
        }

        const apiKey = env.OPENAI_API_KEY
        const apiUrl = env.OPENAI_API_URL || 'https://api.openai.com/v1'
        const modelName = model || env.OPENAI_MODEL || 'deepseek-v4.1-flash'

        if (!apiKey) {
          return response(false, 'API key not configured', 500, { error: 'Server error' }, CORS_HEADERS)
        }

        // Call OpenAI
        const openaiRes = await fetch(`${apiUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: message }],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        })

        if (!openaiRes.ok) {
          const error = await openaiRes.text()
          console.error('OpenAI error:', error)
          return response(false, 'OpenAI error', 500, { error: 'Service error' }, CORS_HEADERS)
        }

        const data = await openaiRes.json()
        const aiMessage = data.choices?.[0]?.message?.content || 'No response'
        const tokensUsed = data.usage?.total_tokens || 0

        return response(true, aiMessage, 200, {
          message: aiMessage,
          model: modelName,
          tokensUsed,
        }, CORS_HEADERS)
      } catch (error) {
        console.error('Error:', error)
        return response(false, 'Server error', 500, { error: error.message }, CORS_HEADERS)
      }
    }

    // 404
    return new Response('Not Found', { status: 404, headers: CORS_HEADERS })
  },
}

function response(success, msg, status, data, headers) {
  return new Response(JSON.stringify({ success, ...data }), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}
