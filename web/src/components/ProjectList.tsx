import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Chip,
  Tooltip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Autocomplete,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  AutoAwesome as GenerateIcon,
  Send as PublishIcon,
  Today as DailyIcon,
  Event as ScheduledIcon,
  Replay as OnceIcon,
} from '@mui/icons-material'
import { useI18n } from '../i18n'
import { Project, Group, Task } from '../types'

interface ProjectListProps {
  projects: Project[]
  groups: Group[]
  onAdd: (project: Omit<Project, 'id'>) => void
  onEdit: (project: Project) => void
  onDelete: (id: string, name: string) => void
  onToggle: (id: string, enabled: boolean) => void
  onUpdateTask?: (projectId: string, taskIndex: number, field: string, value: string | boolean) => void
}

const taskTypeIcon: Record<string, React.ReactNode> = {
  search: <SearchIcon fontSize="small" />,
  generate: <GenerateIcon fontSize="small" />,
  publish: <PublishIcon fontSize="small" />,
}

const taskTypeColor: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'> = {
  search: 'info',
  generate: 'secondary',
  publish: 'success',
}

const PRESET_ACTIONS = ['search', 'generate', 'publish']

const emptyTask = (): Omit<Task, 'id'> => ({
  time: '12:00',
  action: 'generate',
  description: '',
  enabled: true,
})

export default function ProjectList({ projects, groups, onAdd, onEdit, onDelete, onToggle, onUpdateTask }: ProjectListProps) {
  const { t } = useI18n()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [name, setName] = useState('')
  const [groupId, setGroupId] = useState('')
  const [tasks, setTasks] = useState<Omit<Task, 'id'>[]>([])
  const [runMode, setRunMode] = useState<'daily' | 'once'>('daily')
  const [scheduledAt, setScheduledAt] = useState('')

  const openDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project)
      setName(project.name)
      setGroupId(project.groupId)
      setTasks(project.tasks.map(({ id: _id, ...rest }) => rest))
      setRunMode(project.runMode || 'daily')
      setScheduledAt(project.scheduledAt || '')
    } else {
      setEditingProject(null)
      setName('')
      setGroupId(groups[0]?.id || '')
      setTasks([])
      setRunMode('daily')
      setScheduledAt('')
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingProject(null)
    setName('')
    setGroupId('')
    setTasks([])
    setRunMode('daily')
    setScheduledAt('')
  }

  const handleSave = () => {
    if (!name.trim()) return
    const fullTasks: Task[] = tasks.map((tk, i) => ({
      ...tk,
      id: editingProject?.tasks[i]?.id || `t_${Date.now()}_${i}`,
    }))
    if (editingProject) {
      onEdit({ 
        ...editingProject, 
        name, 
        groupId, 
        tasks: fullTasks,
        runMode,
        scheduledAt: runMode === 'once' ? scheduledAt : undefined,
      })
    } else {
      onAdd({ 
        name, 
        groupId, 
        tasks: fullTasks, 
        enabled: true,
        runMode,
        scheduledAt: runMode === 'once' ? scheduledAt : undefined,
      })
    }
    closeDialog()
  }

  const addTask = () => setTasks([...tasks, emptyTask()])

  const updateTask = (index: number, field: string, value: string | boolean) => {
    const updated = [...tasks]
    updated[index] = { ...updated[index], [field]: value }
    setTasks(updated)
  }

  const removeTask = (index: number) => setTasks(tasks.filter((_, i) => i !== index))

  const getGroupName = (id: string) => groups.find(g => g.id === id)?.name || id

  const getTaskLabel = (action: string) => {
    if (action === 'search') return t('searchTask')
    if (action === 'generate') return t('generateTask')
    if (action === 'publish') return t('publishTask')
    return action
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{t('projects')}</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openDialog()}>
          {t('addProject')}
        </Button>
      </Box>

      {projects.length === 0 ? (
        <Alert severity="info">{t('noData')}</Alert>
      ) : (
        projects.map((project) => (
          <Accordion key={project.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                <Switch
                  size="small"
                  checked={project.enabled}
                  onChange={(e) => { e.stopPropagation(); onToggle(project.id, e.target.checked) }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Typography sx={{ fontWeight: 500, flexShrink: 0 }}>{project.name}</Typography>
                <Chip size="small" label={getGroupName(project.groupId)} variant="outlined" />
                <Chip 
                  size="small" 
                  label={`${project.tasks.length} ${t('tasks')}`} 
                  color="primary" 
                  variant="outlined" 
                />
                {/* 執行模式標籤 */}
                {project.runMode === 'once' && project.scheduledAt && (
                  <Chip
                    size="small"
                    icon={<OnceIcon />}
                    label={new Date(project.scheduledAt).toLocaleString('zh-TW', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, mr: 1, flexShrink: 0 }}>
                <Tooltip title={t('edit')}>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); openDialog(project) }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('delete')}>
                  <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete(project.id, project.name) }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {project.tasks.length === 0 ? (
                <Alert severity="info" sx={{ m: 2 }}>{t('noTasks')}</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 80 }}>{t('taskTime')}</TableCell>
                      <TableCell sx={{ width: 110 }}>{t('taskType')}</TableCell>
                      <TableCell>{t('taskDescription')}</TableCell>
                      <TableCell sx={{ width: 70, textAlign: 'center' }}>{t('enable')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {project.tasks.map((task, index) => (
                      <TableRow key={task.id}>
                        <TableCell>{task.time}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            icon={taskTypeIcon[task.action] as React.ReactElement}
                            label={getTaskLabel(task.action)}
                            color={taskTypeColor[task.action] || 'default'}
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.description}
                        </TableCell>
                        <TableCell align="center">
                          <Switch
                            size="small"
                            checked={!!task.enabled}
                            onChange={(e) => {
                              if (onUpdateTask) {
                                onUpdateTask(project.id, index, 'enabled', e.target.checked)
                              }
                            }}
                            sx={{ mx: 'auto', display: 'block' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingProject ? t('editProject') : t('addProject')}</DialogTitle>
        <DialogContent>
          {/* 專案名稱 + 群組 */}
          <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 2 }}>
            <TextField
              label={t('projectName')}
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <FormControl fullWidth>
              <InputLabel>{t('selectGroup')}</InputLabel>
              <Select
                value={groupId}
                label={t('selectGroup')}
                onChange={(e) => setGroupId(e.target.value)}
              >
                {groups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* 執行模式 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>{t('runMode')}</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <ToggleButtonGroup
                value={runMode}
                exclusive
                onChange={(_, val) => val && setRunMode(val)}
                size="small"
              >
                <ToggleButton value="daily">
                  <DailyIcon sx={{ mr: 0.5 }} fontSize="small" />
                  {t('dailyMode')}
                </ToggleButton>
                <ToggleButton value="once">
                  <OnceIcon sx={{ mr: 0.5 }} fontSize="small" />
                  {t('onceMode')}
                </ToggleButton>
              </ToggleButtonGroup>
              {runMode === 'once' && (
                <TextField
                  type="datetime-local"
                  label={t('scheduledDate')}
                  size="small"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 220 }}
                />
              )}
            </Box>
            {runMode === 'once' && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {t('onceModeHint')}
              </Typography>
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* 任務標題 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>{t('tasks')}</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addTask}>
              {t('addTask')}
            </Button>
          </Box>

          {/* 任務捲動區，高度 300 */}
          <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 0.5 }}>
            {tasks.length === 0 ? (
              <Alert severity="info">{t('noTasks')}</Alert>
            ) : (
              tasks.map((task, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                  {/* 第一行：時間 + 類型（平均）+ 每日 + 啟用 + 刪除 */}
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1 }}>
                    {/* 24小時時間選擇器（取代 input[type=time]） */}
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flex: 1 }}>
                      <FormControl size="small" sx={{ flex: 1, minWidth: 70 }}>
                        <InputLabel>{t('hour')}</InputLabel>
                        <Select
                          label={t('hour')}
                          value={task.time.split(':')[0] || '00'}
                          onChange={(e) => {
                            const mm = task.time.split(':')[1] || '00'
                            updateTask(index, 'time', `${e.target.value}:${mm}`)
                          }}
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <MenuItem key={i} value={String(i).padStart(2, '0')}>
                              {String(i).padStart(2, '0')}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Typography sx={{ fontWeight: 500, flexShrink: 0 }}>:</Typography>
                      <FormControl size="small" sx={{ flex: 1, minWidth: 70 }}>
                        <InputLabel>{t('minute')}</InputLabel>
                        <Select
                          label={t('minute')}
                          value={task.time.split(':')[1] || '00'}
                          onChange={(e) => {
                            const hh = task.time.split(':')[0] || '00'
                            updateTask(index, 'time', `${hh}:${e.target.value}`)
                          }}
                        >
                          {Array.from({ length: 12 }, (_, i) => {
                            const mm = String(i * 5).padStart(2, '0')
                            return (
                              <MenuItem key={mm} value={mm}>{mm}</MenuItem>
                            )
                          })}
                        </Select>
                      </FormControl>
                    </Box>
                    <Autocomplete
                      freeSolo
                      options={PRESET_ACTIONS}
                      getOptionLabel={(opt) => {
                        if (opt === 'search') return `🔍 ${t('searchTask')}`
                        if (opt === 'generate') return `✍️ ${t('generateTask')}`
                        if (opt === 'publish') return `📢 ${t('publishTask')}`
                        return opt
                      }}
                      value={task.action}
                      onInputChange={(_, val) => updateTask(index, 'action', val)}
                      onChange={(_, val) => updateTask(index, 'action', val || '')}
                      sx={{ flex: 1 }}
                      renderInput={(params) => (
                        <TextField {...params} label={t('taskType')} size="small" />
                      )}
                    />
                    {/* 啟用 */}
                    <Tooltip title={t('enableDescription')}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={!!task.enabled}
                            onChange={(e) => updateTask(index, 'enabled', e.target.checked)}
                          />
                        }
                        label={t('enable')}
                        labelPlacement="top"
                        sx={{ mx: 0, flexShrink: 0, '.MuiFormControlLabel-label': { fontSize: 11 } }}
                      />
                    </Tooltip>
                    {/* 刪除 */}
                    <IconButton size="small" color="error" onClick={() => removeTask(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* 描述 */}
                  <TextField
                    label={t('taskDescription')}
                    size="small"
                    fullWidth
                    multiline
                    rows={5}
                    value={task.description}
                    onChange={(e) => updateTask(index, 'description', e.target.value)}
                  />
                </Paper>
              ))
            )}
          </Box>
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
