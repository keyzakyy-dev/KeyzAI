import { Markdown } from '../lib/markdown'
import { CopyButton } from '../lib/copy-button'

export function ChatMessage({ role, content, timestamp, streaming }) {
  const isUser = role === 'user'
  const time = timestamp
    ? new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="min-w-0 max-w-[90%] space-y-1.5">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-md bg-primary text-primary-foreground'
              : 'rounded-tl-md bg-card text-foreground shadow-sm'
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
          ) : streaming ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <Markdown text={content} />
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
