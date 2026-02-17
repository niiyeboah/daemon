export type OsChoice = 'windows' | 'ubuntu' | 'macos'

export interface Step {
  id: string
  section: string
  label: string
  os: OsChoice | 'all'
}

export interface SectionMeta {
  id: string
  title: string
}
