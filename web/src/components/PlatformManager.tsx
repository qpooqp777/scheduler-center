import React, { useState, useMemo } from 'react'
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
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Alert,
  Chip,
  InputAdornment,
  Autocomplete,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  OpenInNew as OpenIcon,
  Computer as BrowserIcon,
  AccountCircle as ProfileIcon,
} from '@mui/icons-material'
import { useI18n } from '../i18n'
import { Platform, Group } from '../types'

interface PlatformManagerProps {
  groups: Group[]
  onSaveGroups: (groups: Group[]) => void
}

interface FlatPlatform extends Platform {
  groupId: string
  groupName: string
  platformIndex: number
}

const BROWSER_OPTIONS = ['chrome', 'firefox', 'safari', 'edge', 'brave', 'arc']
const PROFILE_OPTIONS = ['openclaw', 'user', 'chrome-relay']

const PLATFORM_PRESETS = [
  { name: 'Facebook', url: 'https://www.facebook.com/', browser: 'chrome', browserProfile: 'openclaw' },
  { name: 'Threads', url: 'https://www.threads.com/', browser: 'chrome', browserProfile: 'openclaw' },
  { name: 'X (Twitter)', url: 'https://x.com/', browser: 'chrome', browserProfile: 'openclaw' },
  { name: 'Instagram', url: 'https://www.instagram.com/', browser: 'chrome', browserProfile: 'openclaw' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/', browser: 'chrome', browserProfile: 'openclaw' },
  { name: 'YouTube', url: 'https://www.youtube.com/', browser: 'chrome', browserProfile: 'openclaw' },
]

const emptyPlatform = (): Platform => ({
  name: '',
  url: '',
  browser: 'chrome',
  browserProfile: 'openclaw',
})

export default function PlatformManager({ groups, onSaveGroups }: PlatformManagerProps) {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<FlatPlatform | null>(null)
  const [editing, setEditing] = useState<FlatPlatform | null>(null)
  const [form, setForm] = useState<Platform>(emptyPlatform())
  const [targetGroupId, setTargetGroupId] = useState('')

  // 展平所有平台
  const allPlatforms = useMemo<FlatPlatform[]>(() => {
    const result: FlatPlatform[] = []
    for (const group of groups) {
      for (let i = 0; i < group.platforms.length; i++) {
        result.push({
          ...group.platforms[i],
          groupId: group.id,
          groupName: group.name,
          platformIndex: i,
        })
      }
    }
    return result
  }, [groups])

  // 搜尋過濾
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allPlatforms
    const q = searchQuery.toLowerCase()
    return allPlatforms.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.url.toLowerCase().includes(q) ||
      p.groupName.toLowerCase().includes(q) ||
      (p.browser || '').toLowerCase().includes(q) ||
      (p.browserProfile || '').toLowerCase().includes(q)
    )
  }, [allPlatforms, searchQuery])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyPlatform())
    setTargetGroupId(groups[0]?.id || '')
    setDialogOpen(true)
  }

  const openEdit = (p: FlatPlatform) => {
    setEditing(p)
    setForm({ name: p.name, url: p.url, browser: p.browser || 'chrome', browserProfile: p.browserProfile || 'openclaw' })
    setTargetGroupId(p.groupId)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
    setForm(emptyPlatform())
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.url.trim()) return
    const newGroups = groups.map(g => ({ ...g, platforms: [...g.platforms] }))
    if (editing) {
      // 編輯：先從原群組移除，再加到目標群組
      const srcGroup = newGroups.find(g => g.id === editing.groupId)
      if (srcGroup) srcGroup.platforms.splice(editing.platformIndex, 1)
      const dstGroup = newGroups.find(g => g.id === targetGroupId)
      if (dstGroup) dstGroup.platforms.push({ ...form })
    } else {
      // 新增
      const dstGroup = newGroups.find(g => g.id === targetGroupId)
      if (dstGroup) dstGroup.platforms.push({ ...form })
    }
    onSaveGroups(newGroups)
    closeDialog()
  }

  const handleDelete = (p: FlatPlatform) => {
    const newGroups = groups.map(g => ({ ...g, platforms: [...g.platforms] }))
    const grp = newGroups.find(g => g.id === p.groupId)
    if (grp) grp.platforms.splice(p.platformIndex, 1)
    onSaveGroups(newGroups)
    setDeleteConfirm(null)
  }

  const applyPreset = (preset: typeof PLATFORM_PRESETS[0]) => {
    setForm({ name: preset.name, url: preset.url, browser: preset.browser, browserProfile: preset.browserProfile })
  }

  const browserColor = (b?: string) => {
    if (!b) return 'default'
    if (b === 'chrome') return 'primary'
    if (b === 'firefox') return 'warning'
    if (b === 'safari') return 'info'
    if (b === 'edge') return 'secondary'
    return 'default'
  }

  return (
    <Paper sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{t('platformManager')}</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd}>
          {t('addPlatform')}
        </Button>
      </Box>

      {/* 搜尋列 */}
      <TextField
        fullWidth
        size="small"
        placeholder={t('searchPlatform')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {/* 統計 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Chip size="small" label={`${t('all')}: ${allPlatforms.length}`} />
        {searchQuery && <Chip size="small" label={`${t('search')}: ${filtered.length}`} color="primary" />}
      </Box>

      {/* 表格 */}
      {filtered.length === 0 ? (
        <Alert severity="info">{searchQuery ? `"${searchQuery}" 無結果` : t('noPlatforms')}</Alert>
      ) : (
        <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 130 }}>{t('platformName')}</TableCell>
                <TableCell>{t('platformUrl')}</TableCell>
                <TableCell sx={{ width: 110 }}>{t('browser')}</TableCell>
                <TableCell sx={{ width: 130 }}>{t('browserProfile')}</TableCell>
                <TableCell sx={{ width: 80 }}>群組</TableCell>
                <TableCell sx={{ width: 100 }} align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p, idx) => (
                <TableRow key={`${p.groupId}-${p.platformIndex}-${idx}`} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{p.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {p.url}
                      </Typography>
                      <Tooltip title={p.url}>
                        <IconButton size="small" onClick={() => window.open(p.url, '_blank')}>
                          <OpenIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {p.browser && (
                      <Chip
                        size="small"
                        icon={<BrowserIcon sx={{ fontSize: 14 }} />}
                        label={p.browser}
                        color={browserColor(p.browser) as 'default' | 'primary' | 'secondary' | 'warning' | 'info'}
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {p.browserProfile && (
                      <Chip
                        size="small"
                        icon={<ProfileIcon sx={{ fontSize: 14 }} />}
                        label={p.browserProfile}
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={p.groupName} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('edit')}>
                      <IconButton size="small" onClick={() => openEdit(p)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('delete')}>
                      <IconButton size="small" color="error" onClick={() => setDeleteConfirm(p)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('editPlatform') : t('addPlatform')}</DialogTitle>
        <DialogContent>
          {/* 快速預設 */}
          {!editing && (
            <Box sx={{ mb: 2, mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                快速套用預設
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {PLATFORM_PRESETS.map((preset) => (
                  <Chip
                    key={preset.name}
                    size="small"
                    label={preset.name}
                    onClick={() => applyPreset(preset)}
                    clickable
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* 群組選擇 */}
          <Autocomplete
            options={groups}
            getOptionLabel={(g) => g.name}
            value={groups.find(g => g.id === targetGroupId) || null}
            onChange={(_, val) => setTargetGroupId(val?.id || '')}
            renderInput={(params) => <TextField {...params} label="所屬群組" size="small" margin="dense" />}
            fullWidth
          />

          {/* 平台名稱 */}
          <TextField
            label={t('platformName')}
            fullWidth
            size="small"
            margin="dense"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />

          {/* 平台 URL */}
          <TextField
            label={t('platformUrl')}
            fullWidth
            size="small"
            margin="dense"
            value={form.url}
            onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))}
            placeholder="https://..."
            required
          />

          {/* 使用瀏覽器 */}
          <Autocomplete
            freeSolo
            options={BROWSER_OPTIONS}
            value={form.browser || ''}
            onInputChange={(_, val) => setForm(f => ({ ...f, browser: val }))}
            onChange={(_, val) => setForm(f => ({ ...f, browser: val || '' }))}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('browser')}
                size="small"
                margin="dense"
                placeholder={t('browserPlaceholder')}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <BrowserIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 18 }} />,
                }}
              />
            )}
            fullWidth
          />

          {/* 瀏覽器設定檔 */}
          <Autocomplete
            freeSolo
            options={PROFILE_OPTIONS}
            value={form.browserProfile || ''}
            onInputChange={(_, val) => setForm(f => ({ ...f, browserProfile: val }))}
            onChange={(_, val) => setForm(f => ({ ...f, browserProfile: val || '' }))}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('browserProfile')}
                size="small"
                margin="dense"
                placeholder={t('browserProfilePlaceholder')}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <ProfileIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 18 }} />,
                }}
              />
            )}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t('cancel')}</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!form.name.trim() || !form.url.trim() || !targetGroupId}
          >
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('deletePlatform')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('confirmDelete')}
          </Typography>
          {deleteConfirm && (
            <Box sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={600}>{deleteConfirm.name}</Typography>
              <Typography variant="caption" color="text.secondary">{deleteConfirm.url}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>{t('cancel')}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
