import type { WSMessage } from '@/types'

const WS_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000') + '/voice/ws'

type MessageHandler = (msg: WSMessage) => void
type StatusHandler = (connected: boolean) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private messageHandlers: Set<MessageHandler> = new Set()
  private statusHandlers: Set<StatusHandler> = new Set()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 2000
  private maxReconnectDelay = 30000
  private shouldReconnect = true

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return

    try {
      this.ws = new WebSocket(WS_URL)

      this.ws.onopen = () => {
        console.log('🔌 OMEGA WebSocket connected')
        this.reconnectDelay = 2000
        this.notifyStatus(true)
      }

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data)
          this.messageHandlers.forEach((h) => h(msg))
        } catch (e) {
          console.warn('WS parse error:', e)
        }
      }

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected')
        this.notifyStatus(false)
        if (this.shouldReconnect) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = (err) => {
        console.warn('WebSocket error:', err)
      }
    } catch (e) {
      console.error('WS connect error:', e)
      if (this.shouldReconnect) this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay)
      this.connect()
    }, this.reconnectDelay)
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler)
    return () => this.statusHandlers.delete(handler)
  }

  private notifyStatus(connected: boolean) {
    this.statusHandlers.forEach((h) => h(connected))
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const wsService = new WebSocketService()
