import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  useTheme as useMuiTheme,
} from '@mui/material'
import {
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  BrightnessAuto as SystemIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { useI18n } from '../i18n'
import { ThemeMode } from '../types'

interface HeaderProps {
  currentPage: 'schedule' | 'history' | 'settings'
  onPageChange: (page: 'schedule' | 'history' | 'settings') => void
  themeMode: ThemeMode
  onThemeChange: (mode: ThemeMode) => void
}

export default function Header({ currentPage, onPageChange, themeMode, onThemeChange }: HeaderProps) {
  const { t, language, setLanguage } = useI18n()
  const muiTheme = useMuiTheme()

  const themeIcon = {
    light: <LightIcon />,
    dark: <DarkIcon />,
    system: <SystemIcon />,
  }[themeMode]

  const cycleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system']
    const currentIndex = modes.indexOf(themeMode)
    const nextIndex = (currentIndex + 1) % modes.length
    onThemeChange(modes[nextIndex])
  }

  const themeLabel = {
    light: t('lightMode'),
    dark: t('darkMode'),
    system: t('systemMode'),
  }[themeMode]

  return (
    <AppBar position="fixed" elevation={0} sx={{ zIndex: muiTheme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          {t('appTitle')}
        </Typography>

        {/* Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
          <Tooltip title={t('schedule')}>
            <IconButton
              color="inherit"
              onClick={() => onPageChange('schedule')}
              sx={{ opacity: currentPage === 'schedule' ? 1 : 0.6 }}
            >
              <ScheduleIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('history')}>
            <IconButton
              color="inherit"
              onClick={() => onPageChange('history')}
              sx={{ opacity: currentPage === 'history' ? 1 : 0.6 }}
            >
              <HistoryIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('settings')}>
            <IconButton
              color="inherit"
              onClick={() => onPageChange('settings')}
              sx={{ opacity: currentPage === 'settings' ? 1 : 0.6 }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Language Selector */}
        <FormControl size="small" sx={{ mr: 1 }}>
          <Select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'zh-TW' | 'zh-CN' | 'en')}
            sx={{
              color: 'inherit',
              '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
              '.MuiSvgIcon-root': { color: 'inherit' },
            }}
          >
            <MenuItem value="zh-TW">繁體</MenuItem>
            <MenuItem value="zh-CN">简体</MenuItem>
            <MenuItem value="en">EN</MenuItem>
          </Select>
        </FormControl>

        {/* Theme Toggle */}
        <Tooltip title={`${t('theme')}: ${themeLabel}`}>
          <IconButton color="inherit" onClick={cycleTheme}>
            {themeIcon}
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  )
}
