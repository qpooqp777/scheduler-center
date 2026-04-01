import React, { useState } from 'react'
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Toolbar,
  Container,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
} from '@mui/material'
import {
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { I18nProvider, useI18n } from './i18n'
import { useTheme } from './hooks'
import { ThemeMode } from './types'
import {
  Header,
  SchedulePage,
  HistoryPage,
  Settings,
} from './components'

type Page = 'schedule' | 'history' | 'settings'

function AppContent() {
  const { t } = useI18n()
  const { mode, setMode, resolvedMode } = useTheme()
  const [page, setPage] = useState<Page>('schedule')
  const isMobile = useMediaQuery('(max-width:600px)')

  const muiTheme = createTheme({
    palette: {
      mode: resolvedMode,
      primary: {
        main: resolvedMode === 'dark' ? '#90caf9' : '#1976d2',
      },
      background: {
        default: resolvedMode === 'dark' ? '#121212' : '#f5f5f5',
        paper: resolvedMode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"Inter", "Noto Sans TC", "Noto Sans SC", system-ui, sans-serif',
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: resolvedMode === 'dark' ? '#1e1e1e' : '#1976d2',
          },
        },
      },
    },
  })

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header
          currentPage={page}
          onPageChange={setPage}
          themeMode={mode}
          onThemeChange={setMode}
        />
        <Toolbar />

        <Container maxWidth="xl" sx={{ flex: 1, py: 3, pb: isMobile ? 10 : 3 }}>
          {page === 'schedule' && <SchedulePage />}
          {page === 'history' && <HistoryPage onBack={() => setPage('schedule')} />}
          {page === 'settings' && (
            <Settings themeMode={mode} onThemeChange={setMode} />
          )}
        </Container>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <Paper
            sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}
            elevation={3}
          >
            <BottomNavigation
              value={page}
              onChange={(_, val) => setPage(val)}
            >
              <BottomNavigationAction
                label={t('schedule')}
                value="schedule"
                icon={<ScheduleIcon />}
              />
              <BottomNavigationAction
                label={t('history')}
                value="history"
                icon={<HistoryIcon />}
              />
              <BottomNavigationAction
                label={t('settings')}
                value="settings"
                icon={<SettingsIcon />}
              />
            </BottomNavigation>
          </Paper>
        )}
      </Box>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  )
}
