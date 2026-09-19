import React from 'react'
import { TriangleAlert } from 'lucide-react'

import { Button } from './ui/button'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted">
            <TriangleAlert className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Terjadi kesalahan</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Ada error tak terduga. Biasanya cukup muat ulang halaman.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Muat ulang</Button>
        </div>
      )
    }
    return this.props.children
  }
}
