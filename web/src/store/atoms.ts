import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { OsChoice } from '@/types'
import { STEPS } from './constants'

export const osAtom = atomWithStorage<OsChoice>('daemon-os', 'macos')

export const progressAtom = atomWithStorage<Record<string, boolean>>('daemon-progress', {})

export const progressSummaryAtom = atom((get) => {
  const os = get(osAtom)
  const progress = get(progressAtom)
  const relevantSteps = STEPS.filter((s) => s.os === 'all' || s.os === os)
  const completed = relevantSteps.filter((s) => progress[s.id]).length
  return { completed, total: relevantSteps.length }
})

export const activeSectionAtom = atom<string | null>(null)

export const themeAtom = atomWithStorage<'light' | 'dark'>('daemon-theme', 'light')
