import React from 'react'
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material'
import {
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  BrightnessAuto as SystemIcon,
} from '@mui/icons-material'
import { useI18n } from '../i18n'
import { ThemeMode } from '../types'
import { Language } from '../i18n/translations'

interface SettingsProps {
  themeMode: ThemeMode
  onThemeChange: (mode: ThemeMode) => void
}

export default function Settings({ themeMode, onThemeChange }: SettingsProps) {
  const { t, language, setLanguage } = useI18n()

  return (
    <Paper sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{t('settings')}</Typography>

      <List disablePadding>
        {/* Theme */}
        <ListItem sx={{ px: 0 }}>
          <ListItemText
            primary={t('theme')}
            secondary={
              themeMode === 'light' ? t('lightMode') :
              themeMode === 'dark' ? t('darkMode') : t('systemMode')
            }
          />
          <ListItemSecondaryAction>
            <ToggleButtonGroup
              value={themeMode}
              exclusive
              onChange={(_, val) => val && onThemeChange(val as ThemeMode)}
              size="small"
            >
              <ToggleButton value="light">
                <LightIcon fontSize="small" sx={{ mr: 0.5 }} />
                {t('lightMode')}
              </ToggleButton>
              <ToggleButton value="dark">
                <DarkIcon fontSize="small" sx={{ mr: 0.5 }} />
                {t('darkMode')}
              </ToggleButton>
              <ToggleButton value="system">
                <SystemIcon fontSize="small" sx={{ mr: 0.5 }} />
                {t('systemMode')}
              </ToggleButton>
            </ToggleButtonGroup>
          </ListItemSecondaryAction>
        </ListItem>

        <Divider />

        {/* Language */}
        <ListItem sx={{ px: 0 }}>
          <ListItemText
            primary={t('language')}
            secondary={
              language === 'zh-TW' ? t('traditionalChinese') :
              language === 'zh-CN' ? t('simplifiedChinese') : t('english')
            }
          />
          <ListItemSecondaryAction>
            <ToggleButtonGroup
              value={language}
              exclusive
              onChange={(_, val) => val && setLanguage(val as Language)}
              size="small"
            >
              <ToggleButton value="zh-TW">繁體</ToggleButton>
              <ToggleButton value="zh-CN">简体</ToggleButton>
              <ToggleButton value="en">EN</ToggleButton>
            </ToggleButtonGroup>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
    </Paper>
  )
}
