import { Markdown } from '../lib/markdown'
import { CopyButton } from '../lib/copy-button'

// Close an unterminated ``` fence so partial streaming text still renders formatted
function closeOpenFence(s) {
  return (s.match(/```/g)?.length || 0) % 2 === 1 ? s + '\n```' : s
}

export function ChatMessage({ role, content, timestamp, streaming }) {
  const isUser = role === 'user'
  const time = timestamp
    ? new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`min-w-0 space-y-1.5 ${isUser ? 'max-w-[90%]' : 'w-full'}`}>
        <div
          className={`text-[15px] leading-relaxed ${
            isUser
              ? 'rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-primary-foreground sm:px-5'
              : 'font-serif text-foreground'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : streaming && !content ? (
            <div className="flex items-center gap-1 px-1 py-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-typing-dot"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          ) : (
            <Markdown text={streaming ? closeOpenFence(content) : content} />
          )}
        </div>

        {!streaming && (time || !isUser) && (
          <div className={`flex items-center gap-1 px-1 ${isUser ? 'justify-end' : ''}`}>
            {time && <p className="text-[11px] text-muted-foreground">{time}</p>}
            {!isUser && <CopyButton text={content} />}
          </div>
        )}
      </div>
    </div>
  )
}
