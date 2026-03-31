'use client'

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  return ctx
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  delay = 0,
  gain = 0.3
) {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gainNode = c.createGain()
    osc.connect(gainNode)
    gainNode.connect(c.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime + delay)
    gainNode.gain.setValueAtTime(gain, c.currentTime + delay)
    gainNode.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration)
    osc.start(c.currentTime + delay)
    osc.stop(c.currentTime + delay + duration + 0.05)
  } catch {}
}

export const SFX = {
  correct: () => {
    playTone(523, 0.15, 'sine', 0)
    playTone(659, 0.2, 'sine', 0.12)
    playTone(784, 0.25, 'sine', 0.24)
  },
  wrong: () => {
    playTone(220, 0.15, 'sawtooth', 0, 0.2)
    playTone(180, 0.3, 'sawtooth', 0.1, 0.15)
  },
  combo: () => {
    playTone(523, 0.1, 'sine', 0)
    playTone(659, 0.1, 'sine', 0.1)
    playTone(784, 0.1, 'sine', 0.2)
    playTone(1047, 0.3, 'sine', 0.3)
  },
  tick: () => {
    playTone(800, 0.05, 'square', 0, 0.15)
  },
  timeout: () => {
    playTone(440, 0.1, 'sine', 0)
    playTone(349, 0.1, 'sine', 0.15)
    playTone(261, 0.4, 'sine', 0.3, 0.2)
  },
  select: () => {
    playTone(600, 0.08, 'sine', 0, 0.2)
  },
}
