const express = require('express');
const router = express.Router();
const { db } = require('../db/setup');
const auth = require('../middleware/auth');
const { detectAnomalies } = require('../services/riskAnalyzer');

// @route   GET api/analytics/risk-summary
// @desc    Get risk summary statistics
// @access  Private
router.get('/risk-summary', auth, async (req, res) => {
  try {
    // Get risk distribution
    const riskDistribution = await db.raw(`
      SELECT 
        CASE 
          WHEN risk_score BETWEEN 0 AND 20 THEN 'Very Low'
          WHEN risk_score BETWEEN 21 AND 40 THEN 'Low'
          WHEN risk_score BETWEEN 41 AND 60 THEN 'Medium'
          WHEN risk_score BETWEEN 61 AND 80 THEN 'High'
          ELSE 'Very High'
        END as risk_level,
        COUNT(*) as count
      FROM file_events
      GROUP BY risk_level
      ORDER BY risk_score
    `);
    
    // Get alerts count
    const alertsCount = await db('risk_alerts')
      .count('* as count')
      .first();
    
    // Get unresolved alerts count
    const unresolvedAlertsCount = await db('risk_alerts')
      .where('resolved', 0)
      .count('* as count')
      .first();
    
    res.json({
      riskDistribution: riskDistribution,
      alertsCount: alertsCount.count,
      unresolvedAlertsCount: unresolvedAlertsCount.count
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/analytics/anomalies
// @desc    Detect anomalies in recent file events
// @access  Private
router.get('/anomalies', auth, async (req, res) => {
  try {
    // Get recent events (last 24 hours)
    const recentEvents = await db('file_events')
      .where('created_at', '>', db.raw("datetime('now', '-1 day')"))
      .orderBy('created_at', 'desc');
    
    // Detect anomalies
    const anomalies = await detectAnomalies(
      req.user.id,
      recentEvents,
      db
    );
    
    res.json(anomalies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/analytics/timeline
// @desc    Get event timeline data for visualization
// @access  Private
router.get('/timeline', auth, async (req, res) => {
  try {
    // Get events grouped by hour for the last 24 hours
    const timelineData = await db.raw(`
      SELECT 
        strftime('%Y-%m-%d %H:00:00', created_at) as hour,
        COUNT(*) as count,
        AVG(risk_score) as avg_risk
      FROM file_events
      WHERE created_at > datetime('now', '-1 day')
      GROUP BY hour
      ORDER BY hour
    `);
    
    res.json(timelineData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/analytics/external-drives
// @desc    Get external drive activity
// @access  Private
router.get('/external-drives', auth, async (req, res) => {
  try {
    const externalDriveEvents = await db('file_events')
      .where('is_external_drive', 1)
      .orderBy('created_at', 'desc')
      .limit(100);
    
    res.json(externalDriveEvents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;