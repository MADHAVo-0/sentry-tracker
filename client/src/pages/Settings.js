import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    monitoringEnabled: true,
    alertsEnabled: true,
    highRiskThreshold: 70,
    mediumRiskThreshold: 40,
    monitoringPaths: []
  });
  const [newPath, setNewPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchSettings();
    // Check if user is admin
    if (user && user.role === 'admin') {
      setIsAdmin(true);
    }
  }, [user]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [settingsRes, pathsRes] = await Promise.all([
        axios.get('/api/settings'),
        axios.get('/api/settings/monitoring-paths')
      ]);

      setSettings(prev => ({
        ...prev,
        ...settingsRes.data,
        monitoringPaths: pathsRes.data || []
      }));
    } catch (err) {
      console.error('Error fetching settings:', err);
      showSnackbar('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = e.target.type === 'checkbox' ? checked : value;

    setSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await axios.put('/api/settings', settings);
      showSnackbar('Settings saved successfully', 'success');
    } catch (err) {
      console.error('Error saving settings:', err);
      showSnackbar('Failed to save settings', 'error');
    }
  };

  const handleAddPath = async () => {
    if (!newPath.trim()) return;

    try {
      await axios.post('/api/settings/monitoring-paths', { path: newPath });
      setSettings(prev => ({
        ...prev,
        monitoringPaths: [...prev.monitoringPaths, newPath]
      }));
      setNewPath('');
      showSnackbar('Monitoring path added', 'success');
    } catch (err) {
      console.error('Error adding monitoring path:', err);
      showSnackbar('Failed to add monitoring path', 'error');
    }
  };

  const handleDeletePath = async (path) => {
    try {
      await axios.delete(`/api/settings/monitoring-paths`, { data: { path } });
      setSettings(prev => ({
        ...prev,
        monitoringPaths: prev.monitoringPaths.filter(p => p !== path)
      }));
      showSnackbar('Monitoring path removed', 'success');
    } catch (err) {
      console.error('Error removing monitoring path:', err);
      showSnackbar('Failed to remove monitoring path', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <Container maxWidth="lg" className="page-container">
      <Typography variant="h4" component="h1" className="page-header">
        Settings
      </Typography>

      {/* Admin alert removed */}

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="General Settings" />
            <Divider />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.monitoringEnabled}
                    onChange={handleSettingChange}
                    name="monitoringEnabled"
                    color="primary"
                  />
                }
                label="Enable File Monitoring"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.alertsEnabled}
                    onChange={handleSettingChange}
                    name="alertsEnabled"
                    color="primary"
                  />
                }
                label="Enable Risk Alerts"
              />

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Risk Thresholds
                </Typography>
                <TextField
                  label="High Risk Threshold"
                  type="number"
                  name="highRiskThreshold"
                  value={settings.highRiskThreshold}
                  onChange={handleSettingChange}
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                  size="small"
                  sx={{ mr: 2, mb: 2, width: 150 }}
                />
                <TextField
                  label="Medium Risk Threshold"
                  type="number"
                  name="mediumRiskThreshold"
                  value={settings.mediumRiskThreshold}
                  onChange={handleSettingChange}
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                  size="small"
                  sx={{ width: 150 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Monitoring Paths */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Monitoring Paths" />
            <Divider />
            <CardContent>
              <Box sx={{ mb: 2, display: 'flex' }}>
                <TextField
                  label="Add Path"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  placeholder="C:/Users/Documents"
                  fullWidth
                  size="small"
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Add />}
                  onClick={handleAddPath}
                  sx={{ ml: 1 }}
                  disabled={!newPath.trim()}
                >
                  Add
                </Button>
              </Box>

              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {settings.monitoringPaths.length === 0 ? (
                    <ListItem>
                      <ListItemText primary="No monitoring paths configured" />
                    </ListItem>
                  ) : (
                    settings.monitoringPaths.map((path, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={path} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeletePath(path)}
                            size="small"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))
                  )}
                </List>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveSettings}
        >
          Save Settings
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;