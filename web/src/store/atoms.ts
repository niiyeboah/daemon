import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { OsChoice } from '@/types'

export const osAtom = atomWithStorage<OsChoice>('daemon-os', 'macos')

export const activeSectionAtom = atom<string | null>(null)

export const themeAtom = atomWithStorage<'light' | 'dark'>('daemon-theme', 'light')
