import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAllUsers, adminUpdateUserTier, adminUpdateUserAdmin } from '../services/userService'
import { useSnackbar } from '../contexts/SnackbarContext'
import UserMenu from '../components/UserMenu'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  Card,
  CardContent,
  Stack,
  Divider,
  Switch,
  Tooltip,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
  FileDownload as DownloadIcon,
  FileUpload as UploadIcon,
} from '@mui/icons-material'

function AdminPanel() {
  const navigate = useNavigate()
  const { isAdmin, isAuthenticated } = useAuth()
  const { showSuccess, showError, showInfo } = useSnackbar()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})
  const [importing, setImporting] = useState({})

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    } else if (isAuthenticated && !loading && !isAdmin) {
      showError('Access denied. Admin privileges required.')
      navigate('/scrapbook')
    }
  }, [isAuthenticated, isAdmin, navigate, loading, showError])

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const allUsers = await getAllUsers()
      // Sort by creation date (newest first)
      allUsers.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0)
        const dateB = b.createdAt?.toDate?.() || new Date(0)
        return dateB - dateA
      })
      setUsers(allUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      showError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const handleTierChange = async (userId, newTier) => {
    setUpdating({ ...updating, [userId]: true })
    try {
      await adminUpdateUserTier(userId, newTier)

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, tier: newTier } : user
      ))

      showSuccess(`User tier updated to ${newTier}`)
    } catch (error) {
      console.error('Error updating tier:', error)
      showError('Failed to update user tier')
    } finally {
      setUpdating({ ...updating, [userId]: false })
    }
  }

  const handleAdminToggle = async (userId, currentAdminStatus, userEmail) => {
    const newAdminStatus = !currentAdminStatus
    setUpdating({ ...updating, [userId]: true })
    try {
      await adminUpdateUserAdmin(userId, newAdminStatus)

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, admin: newAdminStatus } : user
      ))

      showSuccess(`${userEmail} ${newAdminStatus ? 'promoted to admin' : 'removed from admin'}`)
    } catch (error) {
      console.error('Error updating admin status:', error)
      showError('Failed to update admin status')
    } finally {
      setUpdating({ ...updating, [userId]: false })
    }
  }

  // Export user's scrapbook data
  const handleExportUser = async (userId, userEmail) => {
    try {
      const docRef = doc(db, 'users', userId, 'scrapbooks', 'main')
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        const sections = data.sections || []

        const dataStr = JSON.stringify(sections, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `scrapbook-${userEmail}-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)

        showSuccess(`Exported scrapbook for ${userEmail}`)
      } else {
        showInfo(`No scrapbook data found for ${userEmail}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      showError(`Failed to export scrapbook for ${userEmail}`)
    }
  }

  // Import scrapbook data for a user
  const handleImportUser = async (userId, userEmail, file) => {
    if (!file) return

    setImporting({ ...importing, [userId]: true })
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result)

        // Validate the imported data
        if (!Array.isArray(imported)) {
          throw new Error('Invalid format: expected an array of sections')
        }

        showInfo(`Importing scrapbook for ${userEmail}... This may take a moment.`)

        // Process each section and upload base64 images to Firebase Storage
        const processedSections = await Promise.all(
          imported.map(async (section) => {
            if (section.images && section.images.length > 0) {
              const processedImages = await Promise.all(
                section.images.map(async (img) => {
                  // Check if it's a base64 image
                  if (img.startsWith('data:image/')) {
                    try {
                      // Convert base64 to blob
                      const response = await fetch(img)
                      const blob = await response.blob()

                      // Upload to Firebase Storage
                      const timestamp = Date.now()
                      const randomId = Math.random().toString(36).substring(2, 9)
                      const fileName = `${timestamp}-${randomId}.jpg`
                      const storageRef = ref(storage, `users/${userId}/scrapbook-images/${fileName}`)

                      await uploadBytes(storageRef, blob)
                      const downloadURL = await getDownloadURL(storageRef)

                      return downloadURL
                    } catch (uploadError) {
                      console.error('Failed to upload image:', uploadError)
                      // Keep the original base64 if upload fails
                      return img
                    }
                  }
                  // Already a URL, keep it
                  return img
                })
              )

              return { ...section, images: processedImages }
            }
            return section
          })
        )

        // Save directly to Firestore
        const docRef = doc(db, 'users', userId, 'scrapbooks', 'main')
        await setDoc(docRef, {
          sections: processedSections,
          updatedAt: new Date()
        })

        showSuccess(`Scrapbook imported successfully for ${userEmail}!`)
      } catch (error) {
        console.error('Import error:', error)
        showError(`Failed to import scrapbook for ${userEmail}: ${error.message}`)
      } finally {
        setImporting({ ...importing, [userId]: false })
      }
    }

    reader.readAsText(file)
  }

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    freeUsers: users.filter(u => u.tier === 'free').length,
    paidUsers: users.filter(u => u.tier === 'paid').length,
    admins: users.filter(u => u.admin === true).length,
  }

  if (!isAdmin && !loading) {
    return null
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fecdd3 100%)',
        pb: 4,
      }}
    >
      {/* App Bar */}
      <AppBar position="static" elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="primary"
            onClick={() => navigate('/scrapbook')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <AdminIcon sx={{ color: 'primary.main', mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 600 }}>
            Admin Panel - User Management
          </Typography>
          <IconButton onClick={fetchUsers} color="primary" disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <UserMenu />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'primary.main', fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }}>
            User Management
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            Manage user tiers and permissions
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={4}>
          <Card elevation={3} sx={{ flex: 1, borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {stats.totalUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={3} sx={{ flex: 1, borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: 'success.dark', fontWeight: 700 }}>F</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {stats.freeUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Free Tier
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={3} sx={{ flex: 1, borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <StarIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {stats.paidUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Paid Tier
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={3} sx={{ flex: 1, borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <AdminIcon sx={{ fontSize: 40, color: 'error.main' }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {stats.admins}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Admins
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* Users Table */}
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell sx={{ fontWeight: 600, color: 'primary.contrastText' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'primary.contrastText' }}>Tier</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'primary.contrastText' }}>Admin</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'primary.contrastText' }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'primary.contrastText' }}>Tier Change</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'primary.contrastText' }}>Admin Toggle</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'primary.contrastText' }}>Data Management</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Loading users...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.tier || 'free'}
                        color={user.tier === 'paid' ? 'warning' : 'default'}
                        size="small"
                        icon={user.tier === 'paid' ? <StarIcon /> : undefined}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.admin ? 'Admin' : 'User'}
                        color={user.admin ? 'error' : 'default'}
                        size="small"
                        icon={user.admin ? <AdminIcon /> : undefined}
                      />
                    </TableCell>
                    <TableCell>
                      {user.createdAt?.toDate?.()?.toLocaleDateString() || '-'}
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={user.tier || 'free'}
                          onChange={(e) => handleTierChange(user.id, e.target.value)}
                          disabled={updating[user.id]}
                        >
                          <MenuItem value="free">Free</MenuItem>
                          <MenuItem value="paid">Paid</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={user.admin ? 'Remove admin' : 'Make admin'}>
                        <Switch
                          checked={user.admin || false}
                          onChange={() => handleAdminToggle(user.id, user.admin, user.email)}
                          disabled={updating[user.id]}
                          color="error"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleExportUser(user.id, user.email)}
                          title="Export scrapbook"
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="secondary"
                          component="label"
                          disabled={importing[user.id]}
                          title="Import scrapbook"
                        >
                          {importing[user.id] ? (
                            <CircularProgress size={20} />
                          ) : (
                            <UploadIcon fontSize="small" />
                          )}
                          <input
                            type="file"
                            accept=".json"
                            onChange={(e) => handleImportUser(user.id, user.email, e.target.files[0])}
                            hidden
                            disabled={importing[user.id]}
                          />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Back Button */}
        <Box textAlign="center" mt={4}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/scrapbook')}
          >
            Back to Scrapbook
          </Button>
        </Box>
      </Container>
    </Box>
  )
}

export default AdminPanel
