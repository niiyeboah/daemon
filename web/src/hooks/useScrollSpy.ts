import { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { activeSectionAtom } from '@/store/atoms'

export function useScrollSpy(sectionIds: string[]) {
  const setActiveSection = useSetAtom(activeSectionAtom)

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      }
    }

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '-20% 0px -75% 0px',
    })

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) {
        observer.observe(el)
        observers.push(observer)
      }
    }

    return () => {
      observer.disconnect()
    }
  }, [sectionIds, setActiveSection])
}
