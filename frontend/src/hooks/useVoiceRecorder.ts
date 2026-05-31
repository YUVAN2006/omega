import { useRef, useCallback, useEffect } from 'react'
import { useOmegaStore } from '@/store'
import { voiceApi } from '@/services/api'
import { base64EncodeAudio, generateId } from '@/utils'
import type { CommandHistoryItem } from '@/types'

// Minimum recording duration in ms — prevents accidental tiny clips
const MIN_RECORD_MS = 800
// Maximum recording duration (auto-stop safety)
const MAX_RECORD_MS = 10000

export function useVoiceRecorder() {
  const {
    setVoiceStatus, setLastTranscription,
    setIsRecording, isRecording, addCommand,
  } = useOmegaStore()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const startTimeRef = useRef<number>(0)
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (isRecording) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: { ideal: 16000 },
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,   // boosts quiet microphones
        },
      })
      streamRef.current = stream
      chunksRef.current = []
      startTimeRef.current = Date.now()

      // Pick the best supported MIME type
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
      ].find((t) => MediaRecorder.isTypeSupported(t)) ?? ''

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const elapsed = Date.now() - startTimeRef.current
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null

        // Discard clips that are too short (accidental taps)
        if (elapsed < MIN_RECORD_MS || chunksRef.current.length === 0) {
          setIsRecording(false)
          setVoiceStatus('idle')
          return
        }

        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        await processAudio(blob)
      }

      // Collect data every 100ms for smooth chunks
      mediaRecorder.start(100)
      setIsRecording(true)
      setVoiceStatus('listening')

      // Auto-stop after MAX_RECORD_MS
      maxTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording()
        }
      }, MAX_RECORD_MS)

    } catch (err) {
      console.error('Microphone error:', err)
      setVoiceStatus('error')
      setTimeout(() => setVoiceStatus('idle'), 2000)
    }
  }, [isRecording, setIsRecording, setVoiceStatus])

  const stopRecording = useCallback(() => {
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current)
      maxTimerRef.current = null
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    setVoiceStatus('processing')
  }, [setIsRecording, setVoiceStatus])

  const processAudio = async (blob: Blob) => {
    try {
      setVoiceStatus('processing')
      const arrayBuffer = await blob.arrayBuffer()
      const base64 = base64EncodeAudio(arrayBuffer)
      const result = await voiceApi.sendAudioCommand(base64)

      if (result.transcribed_text) {
        setLastTranscription(result.transcribed_text)
      }

      const historyItem: CommandHistoryItem = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        raw_text: result.transcribed_text || '(unclear)',
        intent: result.intent?.intent || 'unknown',
        query: result.intent?.query,
        success: result.success,
        response_text: result.response_text,
      }
      addCommand(historyItem)

      setVoiceStatus(result.success ? 'responding' : 'error')
      setTimeout(() => setVoiceStatus('idle'), 2500)
    } catch (err) {
      console.error('Voice processing error:', err)
      setVoiceStatus('error')
      setTimeout(() => setVoiceStatus('idle'), 2000)
    }
  }

  const sendTextCommand = useCallback(async (text: string) => {
    if (!text.trim()) return
    setVoiceStatus('processing')
    try {
      const result = await voiceApi.sendTextCommand(text)
      setLastTranscription(text)

      const historyItem: CommandHistoryItem = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        raw_text: text,
        intent: result.intent?.intent || 'unknown',
        query: result.intent?.query,
        success: result.success,
        response_text: result.response_text,
      }
      addCommand(historyItem)

      setVoiceStatus(result.success ? 'responding' : 'error')
      setTimeout(() => setVoiceStatus('idle'), 2500)

      return result
    } catch (err) {
      setVoiceStatus('error')
      setTimeout(() => setVoiceStatus('idle'), 2000)
      throw err
    }
  }, [setVoiceStatus, setLastTranscription, addCommand])

  return {
    isRecording,
    startRecording,
    stopRecording,
    sendTextCommand,
  }
}
