import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Button,
  Collapse,
} from '@mui/material'
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  RemoveCircle as SkippedIcon,
  Refresh as RefreshIcon,
  ArrowBack as BackIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material'
import { useI18n } from '../i18n'

interface Platform {
  name: string
  status: string
  reason?: string
}

interface LogEntry {
  id: string
  timestamp: string
  status: 'success' | 'fail' | 'skipped'
  project: { id: string; name: string }
  task: { id: string; time: string; action: string; description: string }
  message: string
  platforms?: Platform[]
}

interface HistoryProps {
  logs: LogEntry[]
  loading: boolean
  onRefresh: () => void
  onBack?: () => void
}

function StatusChip({ status }: { status: string }) {
  const { t } = useI18n()
  if (status === 'success') return <Chip size="small" icon={<SuccessIcon />} label={t('success')} color="success" variant="outlined" />
  if (status === 'skipped') return <Chip size="small" icon={<SkippedIcon />} label="Skipped" color="default" variant="outlined" />
  return <Chip size="small" icon={<ErrorIcon />} label={t('failed')} color="error" variant="outlined" />
}

function LogRow({ log }: { log: LogEntry }) {
  const { t } = useI18n()
  const [open, setOpen] = React.useState(false)
  const hasPlatforms = log.platforms && log.platforms.length > 0

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    } catch { return iso }
  }

  const getTaskLabel = (action: string) => {
    if (action === 'search') return t('searchTask')
    if (action === 'generate') return t('generateTask')
    if (action === 'publish') return t('publishTask')
    return action
  }

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: hasPlatforms && open ? 'none' : undefined } }}>
        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
          {formatDate(log.timestamp)}
        </TableCell>
        <TableCell>
          <StatusChip status={log.status} />
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{log.project?.name || '-'}</TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {log.task?.time && <Chip size="small" label={log.task.time} variant="outlined" />}
            <Chip size="small" label={getTaskLabel(log.task?.action || '')} color="primary" />
          </Box>
        </TableCell>
        <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Tooltip title={log.message || ''}>
            <span>{log.message || '-'}</span>
          </Tooltip>
        </TableCell>
        <TableCell sx={{ width: 40, p: 0 }}>
          {hasPlatforms && (
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
            </IconButton>
          )}
        </TableCell>
      </TableRow>

      {/* 展開：平台詳情 */}
      {hasPlatforms && (
        <TableRow>
          <TableCell colSpan={6} sx={{ py: 0, bgcolor: 'action.hover' }}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ py: 1, px: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {log.platforms!.map((p, i) => (
                  <Tooltip key={i} title={p.reason || ''}>
                    <Chip
                      size="small"
                      label={p.name}
                      color={p.status === 'success' ? 'success' : p.status === 'skipped' ? 'default' : 'error'}
                      variant="outlined"
                    />
                  </Tooltip>
                ))}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export default function History({ logs, loading, onRefresh, onBack }: HistoryProps) {
  const { t } = useI18n()

  return (
    <Paper sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {onBack && (
            <Tooltip title={t('schedule')}>
              <IconButton size="small" onClick={onBack}>
                <BackIcon />
              </IconButton>
            </Tooltip>
          )}
          <Typography variant="h6">{t('history')}</Typography>
          {logs.length > 0 && <Chip size="small" label={logs.length} color="primary" />}
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={onRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : logs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Alert severity="info" sx={{ mb: 3 }}>{t('noData')}</Alert>
          {onBack && (
            <Button variant="outlined" startIcon={<BackIcon />} onClick={onBack}>
              {t('schedule')}
            </Button>
          )}
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 'calc(100vh - 220px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{t('timestamp')}</TableCell>
                <TableCell sx={{ width: 100 }}>{t('status')}</TableCell>
                <TableCell>{t('project')}</TableCell>
                <TableCell>{t('task')}</TableCell>
                <TableCell>{t('message')}</TableCell>
                <TableCell sx={{ width: 40 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}
