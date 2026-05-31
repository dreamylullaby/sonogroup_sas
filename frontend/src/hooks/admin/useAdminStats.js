/**
 * useAdminStats — encapsula fetch de stats del dashboard con loading/error state
 * Requirements: 2.2
 */
import { useState, useEffect, useCallback } from 'react'
import { api, parseApiError } from '../../config/api'

export default function useAdminStats() {
  const [kpis, setKpis] = useState(null)
  const [changes, setChanges] = useState(null)
  const [charts, setCharts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [dashRes, chartsRes] = await Promise.all([
        api.get('/api/admin/stats/dashboard'),
        api.get('/api/admin/stats/charts')
      ])

      if (dashRes.data.success) {
        setKpis(dashRes.data.data.kpis)
        setChanges(dashRes.data.data.changes)
      }

      if (chartsRes.data.success) {
        setCharts(chartsRes.data.data)
      }
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { kpis, changes, charts, loading, error, refetch: fetchStats }
}
