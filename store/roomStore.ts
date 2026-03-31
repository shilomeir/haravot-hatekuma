'use client'

import { create } from 'zustand'
import type { RoomPhase, RoomPlayer } from '@/lib/room'
import type { Question } from '@/lib/questions'

interface RoomState {
  code: string
  nickname: string
  isHost: boolean
  phase: RoomPhase | null
  players: RoomPlayer[]
  questions: Question[]
  currentIndex: number
  setRoom: (code: string, nickname: string, isHost: boolean) => void
  setPlayers: (players: Record<string, RoomPlayer>) => void
  setPhase: (phase: RoomPhase) => void
  setQuestions: (questions: Question[]) => void
  advanceIndex: () => void
  updatePlayerScore: (nickname: string, scoreDelta: number) => void
  reset: () => void
}

export const useRoomStore = create<RoomState>((set, get) => ({
  code: '',
  nickname: '',
  isHost: false,
  phase: null,
  players: [],
  questions: [],
  currentIndex: 0,

  setRoom: (code, nickname, isHost) => set({ code, nickname, isHost }),
  setPlayers: (playersMap) => set({ players: Object.values(playersMap) }),
  setPhase: (phase) => set({ phase }),
  setQuestions: (questions) => set({ questions }),
  advanceIndex: () => set((s) => ({ currentIndex: s.currentIndex + 1 })),
  updatePlayerScore: (nickname, scoreDelta) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.nickname === nickname ? { ...p, score: p.score + scoreDelta } : p
      ),
    })),
  reset: () =>
    set({
      code: '',
      nickname: '',
      isHost: false,
      phase: null,
      players: [],
      questions: [],
      currentIndex: 0,
    }),
}))
