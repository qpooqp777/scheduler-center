import React, { useState } from 'react'
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
} from '@mui/material'
import {
  CalendarMonth as ScheduleIcon,
  Language as PlatformIcon,
} from '@mui/icons-material'
import { useI18n } from '../i18n'
import { useSchedule } from '../hooks'
import { Group, Project, ScheduleData } from '../types'
import GroupList from './GroupList'
import ProjectList from './ProjectList'
import PlatformManager from './PlatformManager'
import ConfirmDialog from './ConfirmDialog'

export default function SchedulePage() {
  const { t } = useI18n()
  const { data, loading, error, saveSchedule } = useSchedule()
  const [tab, setTab] = useState(0)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  })

  // 刪除確認 state
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean
    type: 'group' | 'project' | 'task'
    id: string
    name: string
    index?: number
  }>({ open: false, type: 'project', id: '', name: '' })

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const save = async (newData: ScheduleData) => {
    const ok = await saveSchedule(newData)
    if (ok) showSnack(t('saved'))
    else showSnack('Save failed', 'error')
  }

  // Group handlers
  const handleAddGroup = async (group: Omit<Group, 'id'>) => {
    if (!data) return
    await save({ ...data, groups: [...data.groups, { ...group, id: `g_${Date.now()}` }] })
  }
  const handleEditGroup = async (group: Group) => {
    if (!data) return
    await save({ ...data, groups: data.groups.map(g => g.id === group.id ? group : g) })
  }
  const handleDeleteGroup = async (id: string) => {
    const group = data?.groups.find(g => g.id === id)
    if (!group) return
    setConfirmDelete({ open: true, type: 'group', id, name: group.name })
  }

  // Project handlers
  const handleAddProject = async (project: Omit<Project, 'id'>) => {
    if (!data) return
    await save({ ...data, projects: [...data.projects, { ...project, id: `p_${Date.now()}` }] })
  }
  const handleEditProject = async (project: Project) => {
    if (!data) return
    await save({ ...data, projects: data.projects.map(p => p.id === project.id ? project : p) })
  }
  const handleDeleteProject = async (id: string) => {
    const project = data?.projects.find(p => p.id === id)
    if (!project) return
    setConfirmDelete({ open: true, type: 'project', id, name: project.name })
  }
  const handleToggleProject = async (id: string, enabled: boolean) => {
    if (!data) return
    await save({ ...data, projects: data.projects.map(p => p.id === id ? { ...p, enabled } : p) })
  }

  // Task 更新（表格直接編輯）
  const handleUpdateTask = async (projectId: string, taskIndex: number, field: string, value: string | boolean) => {
    if (!data) return
    const updatedProjects = data.projects.map(p => {
      if (p.id !== projectId) return p
      const updatedTasks = [...p.tasks]
      updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], [field]: value }
      return { ...p, tasks: updatedTasks }
    })
    await save({ ...data, projects: updatedProjects })
  }

  // 確認刪除執行
  const executeDelete = async () => {
    if (!data) return
    const { type, id } = confirmDelete
    if (type === 'group') {
      await save({ ...data, groups: data.groups.filter(g => g.id !== id) })
    } else if (type === 'project') {
      await save({ ...data, projects: data.projects.filter(p => p.id !== id) })
    }
    setConfirmDelete({ ...confirmDelete, open: false })
  }

  // Platform handler（透過 groups 儲存）
  const handleSaveGroups = async (groups: Group[]) => {
    if (!data) return
    await save({ ...data, groups })
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }
  if (error) return <Alert severity="error">{error}</Alert>
  if (!data) return null

  return (
    <Box>
      {/* Tab 切換 */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<ScheduleIcon />} iconPosition="start" label={t('schedule')} />
        <Tab icon={<PlatformIcon />} iconPosition="start" label={t('platformManager')} />
      </Tabs>

      {/* Tab 0：排程管理 */}
      {tab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <GroupList
              groups={data.groups}
              onAdd={handleAddGroup}
              onEdit={handleEditGroup}
              onDelete={handleDeleteGroup}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <ProjectList
              projects={data.projects}
              groups={data.groups}
              onAdd={handleAddProject}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onToggle={handleToggleProject}
              onUpdateTask={handleUpdateTask}
            />
          </Grid>
        </Grid>
      )}

      {/* Tab 1：平台管理 */}
      {tab === 1 && (
        <PlatformManager
          groups={data.groups}
          onSaveGroups={handleSaveGroups}
        />
      )}

      {data.lastUpdated && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          {t('lastUpdated')}: {new Date(data.lastUpdated).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
        </Typography>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 刪除確認對話框 */}
      <ConfirmDialog
        open={confirmDelete.open}
        title={t('confirm') + ' ' + t('delete')}
        message={
          confirmDelete.type === 'group'
            ? `確定要刪除群組「${confirmDelete.name}」嗎？其所屬的專案仍會保留。`
            : `確定要刪除專案「${confirmDelete.name}」嗎？`
        }
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(c => ({ ...c, open: false }))}
        destructive
      />
    </Box>
  )
}
