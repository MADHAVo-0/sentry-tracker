import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import {
  WarningAmber,
  Security,
  Storage,
  Timeline
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

const RiskAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [riskDistribution, setRiskDistribution] = useState({});
  const [eventTimeline, setEventTimeline] = useState({});
  const [anomalies, setAnomalies] = useState([]);
  const [externalDriveActivity, setExternalDriveActivity] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch risk distribution data
        const riskRes = await axios.get('/api/analytics/risk-summary');
        setRiskDistribution(riskRes.data);

        // Fetch event timeline data
        const timelineRes = await axios.get('/api/analytics/event-timeline');
        setEventTimeline(timelineRes.data);

        // Fetch anomalies
        const anomalyRes = await axios.get('/api/analytics/anomalies');
        setAnomalies(anomalyRes.data.anomalies);

        // Fetch external drive activity
        const externalRes = await axios.get('/api/analytics/external-drive-activity');
        setExternalDriveActivity(externalRes.data);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Risk distribution chart data
  const riskChartData = {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [
      {
        data: [
          riskDistribution.highRiskCount || 0,
          riskDistribution.mediumRiskCount || 0,
          riskDistribution.lowRiskCount || 0
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(75, 192, 192)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Event timeline chart data
  const timelineChartData = {
    labels: eventTimeline.labels || [],
    datasets: [
      {
        label: 'File Events',
        data: eventTimeline.counts || [],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  // External drive activity chart data
  const externalDriveChartData = {
    labels: externalDriveActivity.labels || [],
    datasets: [
      {
        label: 'External Drive Events',
        data: externalDriveActivity.counts || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
      }
    ]
  };

  const getRiskLevelColor = (riskScore) => {
    if (riskScore >= 70) return 'error';
    if (riskScore >= 40) return 'warning';
    return 'success';
  };

  return (
    <Container maxWidth="xl" className="page-container">
      <Typography variant="h4" component="h1" className="page-header">
        Risk Analytics
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <Typography>Loading analytics data...</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Risk Distribution */}
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardHeader
                title="Risk Distribution"
                avatar={<Security color="primary" />}
              />
              <Divider />
              <CardContent className="dashboard-card-content">
                <Box sx={{ height: 300 }}>
                  <Pie data={riskChartData} options={{ maintainAspectRatio: false }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Event Timeline */}
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardHeader
                title="Event Timeline"
                avatar={<Timeline color="primary" />}
              />
              <Divider />
              <CardContent className="dashboard-card-content">
                <Box sx={{ height: 300 }}>
                  <Line
                    data={timelineChartData}
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Anomalies */}
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardHeader
                title="Detected Anomalies"
                avatar={<WarningAmber color="error" />}
              />
              <Divider />
              <CardContent className="dashboard-card-content">
                <List>
                  {anomalies.length === 0 ? (
                    <ListItem>
                      <ListItemText primary="No anomalies detected" />
                    </ListItem>
                  ) : (
                    anomalies.slice(0, 5).map((anomaly, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <WarningAmber color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={anomaly.description}
                          secondary={`${anomaly.file_path} - ${new Date(anomaly.timestamp).toLocaleString()}`}
                        />
                        <Chip
                          label={`Risk: ${anomaly.risk_score}`}
                          color={getRiskLevelColor(anomaly.risk_score)}
                          size="small"
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* External Drive Activity */}
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardHeader
                title="External Drive Activity"
                avatar={<Storage color="primary" />}
              />
              <Divider />
              <CardContent className="dashboard-card-content">
                <Box sx={{ height: 300 }}>
                  <Bar
                    data={externalDriveChartData}
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default RiskAnalytics;