import React, { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tooltip,
  Alert,
  Divider,
  Tabs,
  Tab,
  Checkbox,
  ListItemButton,
  ListItemIcon,
  InputAdornment,
  Badge,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Facebook as FacebookIcon,
  Language as ThreadsIcon,
  Search as SearchIcon,
  ImportExport as ImportIcon,
  Computer as BrowserIcon,
  AccountCircle as ProfileIcon,
} from '@mui/icons-material'
import { useI18n } from '../i18n'
import { Group, Platform } from '../types'

interface GroupListProps {
  groups: Group[]
  onAdd: (group: Omit<Group, 'id'>) => void
  onEdit: (group: Group) => void
  onDelete: (id: string, name: string) => void
}

const platformIcons: Record<string, React.ReactNode> = {
  'Facebook': <FacebookIcon sx={{ color: '#1877f2' }} />,
  'Threads': <ThreadsIcon sx={{ color: '#000' }} />,
  'X': <ThreadsIcon sx={{ color: '#000' }} />,
  'X (Twitter)': <ThreadsIcon sx={{ color: '#000' }} />,
  'Instagram': <ThreadsIcon sx={{ color: '#e1306c' }} />,
}

export default function GroupList({ groups, onAdd, onEdit, onDelete }: GroupListProps) {
  const { t } = useI18n()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [name, setName] = useState('')
  const [platforms, setPlatforms] = useState<Platform[]>([])

  // 手動新增欄位
  const [manualName, setManualName] = useState('')
  const [manualUrl, setManualUrl] = useState('')

  // 導入 tab 狀態
  const [addTab, setAddTab] = useState(0) // 0=手動, 1=從平台管理導入
  const [importSearch, setImportSearch] = useState('')
  const [importSelected, setImportSelected] = useState<Set<string>>(new Set())

  // 所有已建立的平台（從所有群組展平，去除已在當前 platforms 的）
  const allExistingPlatforms = useMemo<(Platform & { groupName: string; key: string })[]>(() => {
    const result: (Platform & { groupName: string; key: string })[] = []
    for (const g of groups) {
      for (let i = 0; i < g.platforms.length; i++) {
        const p = g.platforms[i]
        result.push({ ...p, groupName: g.name, key: `${g.id}-${i}` })
      }
    }
    return result
  }, [groups])

  // 搜尋過濾
  const filteredImport = useMemo(() => {
    if (!importSearch.trim()) return allExistingPlatforms
    const q = importSearch.toLowerCase()
    return allExistingPlatforms.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.url.toLowerCase().includes(q) ||
      p.groupName.toLowerCase().includes(q)
    )
  }, [allExistingPlatforms, importSearch])

  const openDialog = (group?: Group) => {
    if (group) {
      setEditingGroup(group)
      setName(group.name)
      setPlatforms([...group.platforms])
    } else {
      setEditingGroup(null)
      setName('')
      setPlatforms([])
    }
    setAddTab(0)
    setManualName('')
    setManualUrl('')
    setImportSearch('')
    setImportSelected(new Set())
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingGroup(null)
    setName('')
    setPlatforms([])
    setManualName('')
    setManualUrl('')
    setImportSearch('')
    setImportSelected(new Set())
  }

  const handleSave = () => {
    if (!name.trim()) return
    if (editingGroup) {
      onEdit({ ...editingGroup, name, platforms })
    } else {
      onAdd({ name, platforms })
    }
    closeDialog()
  }

  // 手動新增
  const addManual = () => {
    if (!manualName.trim() || !manualUrl.trim()) return
    setPlatforms(prev => [...prev, { name: manualName.trim(), url: manualUrl.trim() }])
    setManualName('')
    setManualUrl('')
  }

  // 導入選取的平台
  const importSelected_ = () => {
    const toImport = filteredImport.filter(p => importSelected.has(p.key))
    const newPlatforms = toImport.map(({ groupName: _g, key: _k, ...p }) => p)
    // 去除重複（以 name+url 判斷）
    const existing = new Set(platforms.map(p => `${p.name}|${p.url}`))
    const unique = newPlatforms.filter(p => !existing.has(`${p.name}|${p.url}`))
    setPlatforms(prev => [...prev, ...unique])
    setImportSelected(new Set())
  }

  const toggleImport = (key: string) => {
    setImportSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const removePlatform = (index: number) => {
    setPlatforms(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{t('groups')}</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openDialog()}>
          {t('addGroup')}
        </Button>
      </Box>

      {groups.length === 0 ? (
        <Alert severity="info">{t('noData')}</Alert>
      ) : (
        <List disablePadding>
          {groups.map((group) => (
            <React.Fragment key={group.id}>
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary={<Typography fontWeight={500}>{group.name}</Typography>}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      {group.platforms.map((p, i) => (
                        <Tooltip key={i} title={`${p.url}${p.browser ? ` · ${p.browser}` : ''}${p.browserProfile ? ` / ${p.browserProfile}` : ''}`}>
                          <Chip
                            size="small"
                            icon={platformIcons[p.name] as React.ReactElement}
                            label={p.name}
                            variant="outlined"
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title={t('edit')}>
                    <IconButton size="small" onClick={() => openDialog(group)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('delete')}>
                    <IconButton size="small" color="error" onClick={() => onDelete(group.id, group.name)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGroup ? t('editGroup') : t('addGroup')}</DialogTitle>
        <DialogContent>
          {/* 群組名稱 */}
          <TextField
            autoFocus
            margin="dense"
            label={t('groupName')}
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          {/* 已加入的平台 */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('platforms')}
            {platforms.length > 0 && (
              <Chip size="small" label={platforms.length} color="primary" sx={{ ml: 1 }} />
            )}
          </Typography>

          {platforms.length === 0 ? (
            <Alert severity="info" sx={{ mb: 1 }}>{t('noPlatforms')}</Alert>
          ) : (
            <Box sx={{ mb: 1 }}>
              {platforms.map((p, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Chip
                    size="small"
                    icon={platformIcons[p.name] as React.ReactElement}
                    label={p.name}
                    onDelete={() => removePlatform(i)}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.url}
                    {p.browser && <> · <BrowserIcon sx={{ fontSize: 11, verticalAlign: 'middle' }} /> {p.browser}</>}
                    {p.browserProfile && <> / <ProfileIcon sx={{ fontSize: 11, verticalAlign: 'middle' }} /> {p.browserProfile}</>}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* 新增平台：手動 / 從平台管理導入 */}
          <Tabs
            value={addTab}
            onChange={(_, v) => setAddTab(v)}
            sx={{ mb: 1.5, minHeight: 36 }}
          >
            <Tab label={t('add')} sx={{ minHeight: 36, py: 0 }} />
            <Tab
              label={
                <Badge badgeContent={importSelected.size || undefined} color="primary">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ImportIcon sx={{ fontSize: 16 }} />
                    從平台管理導入
                  </Box>
                </Badge>
              }
              sx={{ minHeight: 36, py: 0 }}
            />
          </Tabs>

          {/* Tab 0：手動新增 */}
          {addTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                size="small"
                label={t('platformName')}
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Facebook / Threads / X"
              />
              <TextField
                size="small"
                label={t('platformUrl')}
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://..."
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={addManual}
                disabled={!manualName.trim() || !manualUrl.trim()}
              >
                {t('add')}
              </Button>
            </Box>
          )}

          {/* Tab 1：從平台管理導入 */}
          {addTab === 1 && (
            <Box>
              {allExistingPlatforms.length === 0 ? (
                <Alert severity="info">平台管理尚無資料，請先至「平台管理」新增平台。</Alert>
              ) : (
                <>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={t('searchPlatform')}
                    value={importSearch}
                    onChange={(e) => setImportSearch(e.target.value)}
                    sx={{ mb: 1 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Paper variant="outlined" sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    <List dense disablePadding>
                      {filteredImport.length === 0 ? (
                        <ListItem>
                          <ListItemText secondary="無符合結果" />
                        </ListItem>
                      ) : (
                        filteredImport.map((p) => {
                          const alreadyAdded = platforms.some(ep => ep.name === p.name && ep.url === p.url)
                          return (
                            <ListItemButton
                              key={p.key}
                              dense
                              disabled={alreadyAdded}
                              onClick={() => !alreadyAdded && toggleImport(p.key)}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <Checkbox
                                  size="small"
                                  edge="start"
                                  checked={importSelected.has(p.key)}
                                  disabled={alreadyAdded}
                                  tabIndex={-1}
                                  disableRipple
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="body2" fontWeight={500}>{p.name}</Typography>
                                    {alreadyAdded && <Chip size="small" label="已加入" color="success" />}
                                  </Box>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {p.url}
                                    {p.browser && ` · ${p.browser}`}
                                    {p.browserProfile && ` / ${p.browserProfile}`}
                                    {` · 來自：${p.groupName}`}
                                  </Typography>
                                }
                              />
                            </ListItemButton>
                          )
                        })
                      )}
                    </List>
                  </Paper>

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<ImportIcon />}
                    onClick={importSelected_}
                    disabled={importSelected.size === 0}
                    sx={{ mt: 1 }}
                    fullWidth
                  >
                    導入已選 {importSelected.size > 0 ? `(${importSelected.size})` : ''}
                  </Button>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t('cancel')}</Button>
          <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
