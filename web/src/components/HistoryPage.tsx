import React from 'react'
import { Box, CircularProgress, Alert } from '@mui/material'
import { useLogs } from '../hooks'
import History from './History'

interface HistoryPageProps {
  onBack: () => void
}

export default function HistoryPage({ onBack }: HistoryPageProps) {
  const { data, loading, error, refetch } = useLogs()

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <Box>
      {loading && !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <History
          logs={data?.logs || []}
          loading={loading}
          onRefresh={refetch}
          onBack={onBack}
        />
      )}
    </Box>
  )
}
