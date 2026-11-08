import { useRef, useState, useCallback } from 'react'

export interface CVMetrics {
  faceVisible: boolean
  faceCount: number
  lookingAway: boolean
  framingQuality: number   // 0-100
  notes: string[]
}

export interface CVSession {
  samplesCount: number
  faceVisiblePct: number
  lookingAwayPct: number
  avgFramingQuality: number
  observations: string[]
}

// ── face-api.js loader (singleton, loads models once) ────────────────────────
// Models are served from /models/ (local, bundled in public/) — 100% free, no CDN needed.
// MIT licensed: https://github.com/justadudewhohacks/face-api.js
let faceApiLoaded = false
let faceApiLoading = false
const loaderCallbacks: Array<() => void> = []

async function ensureFaceApi(): Promise<boolean> {
  if (faceApiLoaded) return true
  if (faceApiLoading) {
    return new Promise(resolve => loaderCallbacks.push(() => resolve(faceApiLoaded)))
  }
  faceApiLoading = true
  try {
    const faceapi = await import('face-api.js')
    // Use local models from public/models/ — works offline, no external service
    const MODEL_URL = '/models'
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL)
    faceApiLoaded = true
    console.log('[CV] face-api.js models loaded from /models/ (local, free, MIT)')
    return true
  } catch (e) {
    console.warn('[CV] face-api.js failed to load:', e)
    return false
  } finally {
    faceApiLoading = false
    loaderCallbacks.forEach(cb => cb())
    loaderCallbacks.length = 0
  }
}

// Preload silently on module import (non-blocking)
if (typeof window !== 'undefined') {
  ensureFaceApi().catch(() => {})
}

// ── Compute framing quality 0-100 ────────────────────────────────────────────
function framingScore(
  box: { x: number; y: number; width: number; height: number },
  vw: number, vh: number
): number {
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const dx = Math.abs(cx - vw / 2) / (vw / 2)      // 0=centred
  const dy = Math.abs(cy - vh * 0.38) / (vh * 0.38) // face in upper 38%
  const areaPct = (box.width * box.height) / (vw * vh)
  const sizeScore = areaPct > 0.04 && areaPct < 0.35 ? 100 : areaPct <= 0.04 ? 40 : 55
  return Math.round(Math.max(0, Math.min(100, sizeScore * (1 - dx * 0.4) * (1 - dy * 0.3))))
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useCameraCV() {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const samplesRef = useRef<CVMetrics[]>([])
  const [cameraError, setCameraError]   = useState<string>('')
  const [cameraReady, setCameraReady]   = useState(false)

  const startCamera = useCallback(async () => {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraReady(true)
      }
    } catch (err: any) {
      const denied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
      setCameraError(
        denied
          ? 'Camera permission denied. Click the camera icon in your browser address bar to allow it.'
          : 'Camera not found or unavailable.'
      )
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraReady(false)
  }, [])

  // Sample CV once when user submits an answer
  const sampleCV = useCallback(async (): Promise<CVMetrics> => {
    const fallback: CVMetrics = {
      faceVisible: false, faceCount: 0, lookingAway: false, framingQuality: 0, notes: []
    }
    const video = videoRef.current
    if (!video || !cameraReady) return fallback

    const loaded = await ensureFaceApi()
    if (!loaded) {
      const m = { ...fallback, notes: ['Visual analysis skipped (model unavailable)'] }
      samplesRef.current.push(m); return m
    }

    try {
      const faceapi = await import('face-api.js')
      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224 })
      const dets = await faceapi.detectAllFaces(video, opts).withFaceLandmarks(true)

      if (!dets.length) {
        const m: CVMetrics = {
          faceVisible: false, faceCount: 0, lookingAway: false,
          framingQuality: 0, notes: ['Face not detected in camera frame']
        }
        samplesRef.current.push(m); return m
      }

      const d = dets[0]
      const box = d.detection.box
      const lm  = d.landmarks
      const vw  = video.videoWidth  || 640
      const vh  = video.videoHeight || 480

      // Gaze estimate: if nose-tip is offset from eye midpoint → looking away
      const nose     = lm.getNose()[3]
      const leftEye  = lm.getLeftEye()[0]
      const rightEye = lm.getRightEye()[3]
      const eyeMidX  = (leftEye.x + rightEye.x) / 2
      const horizOff = Math.abs(nose.x - eyeMidX) / box.width
      const lookingAway = horizOff > 0.22

      const framing = framingScore({ x: box.x, y: box.y, width: box.width, height: box.height }, vw, vh)
      const notes: string[] = []
      if (lookingAway)       notes.push('Looking away from camera')
      if (framing < 50)      notes.push('Camera framing: face appears too small or off-centre')
      if (dets.length > 1)   notes.push('Multiple people detected in frame')

      const m: CVMetrics = {
        faceVisible: true,
        faceCount:   dets.length,
        lookingAway,
        framingQuality: framing,
        notes,
      }
      samplesRef.current.push(m)
      return m
    } catch {
      return fallback
    }
  }, [cameraReady])

  // Build session summary
  const getCVSession = useCallback((): CVSession | null => {
    const s = samplesRef.current
    if (!s.length) return null
    const total    = s.length
    const visible  = s.filter(x => x.faceVisible).length
    const lookAway = s.filter(x => x.lookingAway).length
    const avgFrame = s.reduce((a, x) => a + x.framingQuality, 0) / total
    const visPct   = Math.round((visible  / total) * 100)
    const lawPct   = Math.round((lookAway / total) * 100)

    const observations: string[] = []
    if (visPct < 70)
      observations.push(`Your face was not visible in ${100 - visPct}% of responses — make sure your face is clearly in frame.`)
    if (lawPct > 40)
      observations.push(`You looked away from the camera during ${lawPct}% of responses — try to maintain eye contact with the lens.`)
    if (avgFrame < 50)
      observations.push('Camera framing could be improved — position yourself so your face fills the upper third of the frame.')
    if (visPct >= 80 && lawPct <= 20)
      observations.push('You maintained strong camera presence and eye contact throughout the interview.')

    return {
      samplesCount:      total,
      faceVisiblePct:    visPct,
      lookingAwayPct:    lawPct,
      avgFramingQuality: Math.round(avgFrame),
      observations:      observations.length ? observations : ['Visual signals were within normal range.'],
    }
  }, [])

  return { videoRef, cameraError, cameraReady, startCamera, stopCamera, sampleCV, getCVSession }
}
