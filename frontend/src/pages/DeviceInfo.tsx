import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  PhoneAndroid,
  Tag,
  SimCard,
  Visibility,
  VisibilityOff,
  Edit,
  Check,
  Close,
} from '@mui/icons-material'
import { api } from '../api/current'
import ErrorSnackbar from '../components/ErrorSnackbar'
import type { DeviceInfo, SimInfo } from '../api/types'

function getSensitiveStyle(show: boolean) {
  return {
    filter: show ? 'none' : 'blur(5px)',
    transition: 'filter 0.3s ease',
    userSelect: show ? 'auto' : 'none',
    cursor: show ? 'text' : 'default',
  } as const
}

export default function DeviceInfoPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeviceId, setShowDeviceId] = useState(false)
  const [showSimInfo, setShowSimInfo] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [simInfo, setSimInfo] = useState<SimInfo | null>(null)
  
  const [editingPhone, setEditingPhone] = useState(false)
  const [editingSmsc, setEditingSmsc] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [smscInput, setSmscInput] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const [savingSmsc, setSavingSmsc] = useState(false)

  const isPhoneEmpty = !simInfo?.phone_numbers?.length
  const isSmscEmpty = !simInfo?.sms_center
  
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const showMsg = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const validatePhoneStr = (val: string) => /^\+?\d+$/.test(val.trim())

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [deviceRes, simRes] = await Promise.all([
        api.getDeviceInfo(),
        api.getSimInfo(),
      ])

      if (deviceRes.data) setDeviceInfo(deviceRes.data)
      if (simRes.data) setSimInfo(simRes.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSavePhone = async () => {
    if (!phoneInput.trim()) {
      setEditingPhone(false)
      return
    }
    if (!validatePhoneStr(phoneInput)) {
      showMsg('号码格式错误，只能包含数字和开头的+', 'error')
      return
    }
    setSavingPhone(true)
    try {
      await api.updateSimCache({ phone_number: phoneInput.trim() })
      showMsg('号码缓存已更新', 'success')
      setEditingPhone(false)
      void loadData()
    } catch (err) {
      showMsg(err instanceof Error ? err.message : String(err), 'error')
    } finally {
      setSavingPhone(false)
    }
  }

  const handleSaveSmsc = async () => {
    if (!smscInput.trim()) {
      setEditingSmsc(false)
      return
    }
    if (!validatePhoneStr(smscInput)) {
      showMsg('号码格式错误，只能包含数字和开头的+', 'error')
      return
    }
    setSavingSmsc(true)
    try {
      await api.updateSimCache({ sms_center: smscInput.trim() })
      showMsg('短信中心缓存已更新', 'success')
      setEditingSmsc(false)
      void loadData()
    } catch (err) {
      showMsg(err instanceof Error ? err.message : String(err), 'error')
    } finally {
      setSavingSmsc(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          设备信息
        </Typography>
        <Typography variant="body2" color="text.secondary">
          查看当前设备与 SIM 卡的基础状态。
        </Typography>
      </Box>

      <ErrorSnackbar error={error} onClose={() => setError(null)} />

      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{ xs: 12, md: 6 }} display="flex">
          <Card sx={{ width: '100%', height: '100%' }}>
            <CardHeader
              avatar={<PhoneAndroid color="primary" />}
              title="设备状态"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" width="40%">在线状态</TableCell>
                      <TableCell>
                        <Chip
                          label={deviceInfo?.online ? '在线' : '离线'}
                          color={deviceInfo?.online ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">电源状态</TableCell>
                      <TableCell>
                        <Chip
                          label={deviceInfo?.powered ? '已上电' : '未上电'}
                          color={deviceInfo?.powered ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">制造商</TableCell>
                      <TableCell>{deviceInfo?.manufacturer || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">型号</TableCell>
                      <TableCell>{deviceInfo?.model || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">固件版本</TableCell>
                      <TableCell>{deviceInfo?.revision || 'N/A'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} display="flex">
          <Card sx={{ width: '100%', height: '100%' }}>
            <CardHeader
              avatar={<SimCard color="primary" />}
              title="SIM 卡信息"
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <Tooltip title={showSimInfo ? '隐藏敏感信息' : '显示完整信息'}>
                  <IconButton
                    size="small"
                    onClick={() => setShowSimInfo((value) => !value)}
                    color="primary"
                  >
                    {showSimInfo ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" width="40%">SIM 状态</TableCell>
                      <TableCell>
                        <Chip
                          label={simInfo?.present ? '已插入' : '未插入'}
                          color={simInfo?.present ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">手机号</TableCell>
                      <TableCell>
                        {editingPhone ? (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <TextField
                              size="small"
                              variant="standard"
                              placeholder="+86..."
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value)}
                              disabled={savingPhone}
                              inputProps={{ style: { fontFamily: 'monospace' } }}
                            />
                            <IconButton size="small" color="success" onClick={() => void handleSavePhone()} disabled={savingPhone}>
                              {savingPhone ? <CircularProgress size={16} /> : <Check fontSize="small" />}
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => setEditingPhone(false)} disabled={savingPhone}>
                              <Close fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Box sx={{ fontFamily: 'monospace', ...getSensitiveStyle(showSimInfo) }}>
                              {simInfo?.phone_numbers?.length ? simInfo.phone_numbers.join(', ') : 'N/A'}
                            </Box>
                            {(isPhoneEmpty || simInfo?.phone_number_is_manual) && simInfo?.present && (
                              <IconButton size="small" onClick={() => { setPhoneInput(simInfo?.phone_numbers?.[0] || ''); setEditingPhone(true); }}>
                                <Edit sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            )}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">MCC / MNC</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        {simInfo?.mcc || 'N/A'} / {simInfo?.mnc || 'N/A'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">短信中心号码</TableCell>
                      <TableCell>
                        {editingSmsc ? (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <TextField
                              size="small"
                              variant="standard"
                              placeholder="+86..."
                              value={smscInput}
                              onChange={(e) => setSmscInput(e.target.value)}
                              disabled={savingSmsc}
                              inputProps={{ style: { fontFamily: 'monospace' } }}
                            />
                            <IconButton size="small" color="success" onClick={() => void handleSaveSmsc()} disabled={savingSmsc}>
                              {savingSmsc ? <CircularProgress size={16} /> : <Check fontSize="small" />}
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => setEditingSmsc(false)} disabled={savingSmsc}>
                              <Close fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Box sx={{ fontFamily: 'monospace', ...getSensitiveStyle(showSimInfo) }}>
                              {simInfo?.sms_center || '未读取到'}
                            </Box>
                            {(isSmscEmpty || simInfo?.sms_center_is_manual) && simInfo?.present && (
                              <IconButton size="small" onClick={() => { setSmscInput(simInfo?.sms_center || ''); setEditingSmsc(true); }}>
                                <Edit sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            )}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card>
            <CardHeader
              avatar={<Tag color="primary" />}
              title="设备标识"
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <Tooltip title={showDeviceId ? '隐藏敏感信息' : '显示完整信息'}>
                  <IconButton
                    size="small"
                    onClick={() => setShowDeviceId((value) => !value)}
                    color="primary"
                  >
                    {showDeviceId ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">IMEI</Typography>
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      sx={{ wordBreak: 'break-all', ...getSensitiveStyle(showDeviceId) }}
                    >
                      {deviceInfo?.imei || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">ICCID</Typography>
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      sx={{ wordBreak: 'break-all', ...getSensitiveStyle(showDeviceId) }}
                    >
                      {simInfo?.iccid || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">IMSI</Typography>
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      sx={{ wordBreak: 'break-all', ...getSensitiveStyle(showDeviceId) }}
                    >
                      {simInfo?.imsi || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
