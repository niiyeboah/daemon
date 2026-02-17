import type { ReactNode } from 'react'
import { useAtomValue } from 'jotai'
import { osAtom } from '@/store/atoms'
import type { OsChoice } from '@/types'

interface OsFilterProps {
  os: OsChoice | 'all'
  children: ReactNode
}

export function OsFilter({ os, children }: OsFilterProps) {
  const selectedOs = useAtomValue(osAtom)

  if (os !== 'all' && os !== selectedOs) {
    return null
  }

  return <>{children}</>
}
