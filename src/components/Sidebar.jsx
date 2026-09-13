import { Plus, MessageSquare, Trash2, User, Zap } from 'lucide-react'
import { Button } from './ui/button'

export function Sidebar({ conversations, currentId, onSelect, onNew, onDelete, onClear, open, onClose }) {
  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-background transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-14 flex-shrink-0 items-center gap-2.5 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary shadow-sm">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight text-foreground">KeyzAI</span>
        </div>

        {/* New Chat */}
        <div className="p-3">
          <Button onClick={onNew} variant="secondary" className="w-full justify-start gap-2 font-medium">
            <Plus className="w-4 h-4" />
            New chat
          </Button>
        </div>

        {/* Recents */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">Recents</p>
          {conversations.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <MessageSquare className="mx-auto h-6 w-6 text-muted-foreground/40" />
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                No conversations yet.
                <br />
                Start a new chat!
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-1 rounded-md pr-1 text-sm transition-colors ${
                    currentId === conv.id
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground/80 hover:bg-accent/50'
                  }`}
                >
                  <button
                    onClick={() => onSelect(conv.id)}
                    className="flex-1 truncate px-3 py-2 text-left font-medium"
                    title={conv.title}
                  >
                    {conv.title}
                  </button>
                  <button
                    onClick={() => onDelete(conv.id)}
                    className="rounded-sm p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">Guest</p>
              <p className="text-xs text-muted-foreground">Free plan</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onClear}
              aria-label="Clear all conversations"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}
