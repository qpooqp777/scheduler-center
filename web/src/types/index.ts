export interface Platform {
  name: string
  url: string
  browser?: string        // 使用瀏覽器（e.g. chrome, firefox, safari, edge）
  browserProfile?: string // 瀏覽器設定檔名稱（e.g. Default, Profile 1, user）
}

export interface Group {
  id: string
  name: string
  platforms: Platform[]
}

export interface Task {
  id: string
  time: string
  action: string
  description: string
  enabled: boolean
}

export interface Project {
  id: string
  name: string
  groupId: string
  tasks: Task[]
  enabled: boolean
}

export interface ScheduleData {
  groups: Group[]
  projects: Project[]
  lastUpdated: string
}

export interface LogEntry {
  id: string
  timestamp: string
  status: 'success' | 'fail'
  project: {
    id: string
    name: string
  }
  task: {
    id: string
    time: string
    action: string
    description: string
  }
  message: string
}

export interface LogsData {
  logs: LogEntry[]
  lastUpdated: string
}

export type ThemeMode = 'light' | 'dark' | 'system'
