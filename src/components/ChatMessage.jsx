import { Sparkles, User } from 'lucide-react'
import { Markdown } from '../lib/markdown'

export function ChatMessage({ role, content, timestamp }) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      )}

      <div className="max-w-[85%] space-y-1.5">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-md bg-primary text-primary-foreground'
              : 'rounded-tl-md bg-card text-foreground shadow-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <Markdown text={content} />
          )}
        </div>
        {timestamp && (
          <p className={`px-1 text-[11px] text-muted-foreground ${isUser ? 'text-right' : ''}`}>
            {new Date(timestamp * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>

      {isUser && (
        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary">
          <User className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      )}
    </div>
  )
}
