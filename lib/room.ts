import { getRedis } from './redis'
import { selectQuestions } from './questions'
import type { Question } from './questions'

export type RoomPhase = 'lobby' | 'playing' | 'results'

export interface RoomPlayer {
  nickname: string
  score: number
  xp: number
  coins: number
}

export interface RoomState {
  code: string
  phase: RoomPhase
  hostNickname: string
  players: Record<string, RoomPlayer>
  questions: Question[]
  currentIndex: number
  createdAt: number
}

const ROOM_TTL = 7200 // 2 hours in seconds

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function roomKey(code: string) {
  return `room:${code}`
}

export async function createRoom(hostNickname: string): Promise<RoomState> {
  const redis = getRedis()
  const code = randomCode()
  const state: RoomState = {
    code,
    phase: 'lobby',
    hostNickname,
    players: {
      [hostNickname]: { nickname: hostNickname, score: 0, xp: 0, coins: 0 },
    },
    questions: [],
    currentIndex: 0,
    createdAt: Date.now(),
  }
  await redis.set(roomKey(code), JSON.stringify(state), { ex: ROOM_TTL })
  return state
}

export async function joinRoom(
  code: string,
  nickname: string
): Promise<RoomState | null> {
  const redis = getRedis()
  const raw = await redis.get<string>(roomKey(code))
  if (!raw) return null
  const state: RoomState = typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as RoomState
  state.players[nickname] = { nickname, score: 0, xp: 0, coins: 0 }
  await redis.set(roomKey(code), JSON.stringify(state), { ex: ROOM_TTL })
  return state
}

export async function getRoomState(code: string): Promise<RoomState | null> {
  const redis = getRedis()
  const raw = await redis.get<string>(roomKey(code))
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as RoomState
}

export async function updatePlayerScore(
  code: string,
  nickname: string,
  scoreDelta: number,
  xpDelta: number,
  coinsDelta: number
): Promise<RoomState | null> {
  const state = await getRoomState(code)
  if (!state) return null
  if (!state.players[nickname]) {
    state.players[nickname] = { nickname, score: 0, xp: 0, coins: 0 }
  }
  state.players[nickname].score += scoreDelta
  state.players[nickname].xp += xpDelta
  state.players[nickname].coins += coinsDelta
  const redis = getRedis()
  await redis.set(roomKey(code), JSON.stringify(state), { ex: ROOM_TTL })
  return state
}

export async function setPhase(code: string, phase: RoomPhase): Promise<RoomState | null> {
  const state = await getRoomState(code)
  if (!state) return null
  state.phase = phase
  const redis = getRedis()
  await redis.set(roomKey(code), JSON.stringify(state), { ex: ROOM_TTL })
  return state
}

export async function setQuestions(code: string, questions: Question[]): Promise<RoomState | null> {
  const state = await getRoomState(code)
  if (!state) return null
  state.questions = questions
  const redis = getRedis()
  await redis.set(roomKey(code), JSON.stringify(state), { ex: ROOM_TTL })
  return state
}
