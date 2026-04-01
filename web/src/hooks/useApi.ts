import { useState, useEffect, useCallback } from 'react'
import { ScheduleData, LogsData } from '../types'

const API_BASE = '/api'

export function useSchedule() {
  const [data, setData] = useState<ScheduleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/schedule`)
      if (!res.ok) throw new Error('Failed to fetch schedule')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const saveSchedule = useCallback(async (newData: ScheduleData) => {
    try {
      const res = await fetch(`${API_BASE}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      })
      if (!res.ok) throw new Error('Failed to save schedule')
      const json = await res.json()
      if (json.ok) {
        setData(newData)
        return true
      }
      return false
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return false
    }
  }, [])

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  return { data, loading, error, saveSchedule, refetch: fetchSchedule }
}

export function useLogs() {
  const [data, setData] = useState<LogsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/logs`)
      if (!res.ok) throw new Error('Failed to fetch logs')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return { data, loading, error, refetch: fetchLogs }
}
