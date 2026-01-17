const express = require('express');
const router = express.Router();
const { db } = require('../db/setup');
const auth = require('../middleware/auth');

// @route   GET api/events
// @desc    Get all file events with pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { eventType, riskLevel, searchTerm, dateRange } = req.query;

    // Base query builder function to be reused for both data and count
    const buildQuery = (qb) => {
      if (eventType) {
        qb.where('event_type', eventType);
      }

      if (riskLevel) {
        if (riskLevel === 'high') {
          qb.where('risk_score', '>=', 70);
        } else if (riskLevel === 'medium') {
          qb.whereBetween('risk_score', [40, 69]);
        } else if (riskLevel === 'low') {
          qb.where('risk_score', '<', 40);
        }
      }

      if (searchTerm) {
        qb.where(function () {
          this.where('file_path', 'like', `%${searchTerm}%`)
            .orWhere('file_name', 'like', `%${searchTerm}%`);
        });
      }

      if (dateRange && dateRange !== 'all') {
        const now = new Date();
        let startDate;

        if (dateRange === 'today') {
          startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (dateRange === 'week') {
          startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (dateRange === 'month') {
          startDate = new Date(now.setMonth(now.getMonth() - 1));
        }

        if (startDate) {
          qb.where('created_at', '>=', startDate.toISOString());
        }
      }
    };

    // Get filtered events
    const events = await db('file_events')
      .modify(buildQuery)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Get total count of filtered events
    const total = await db('file_events')
      .modify(buildQuery)
      .count('* as count')
      .first();

    res.json({
      events,
      pagination: {
        page,
        limit,
        total: total.count,
        pages: Math.ceil(total.count / limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/events/recent
// @desc    Get recent file events (last 24 hours)
// @access  Private
router.get('/recent', auth, async (req, res) => {
  try {
    const events = await db('file_events')
      .where('created_at', '>', db.raw("datetime('now', '-1 day')"))
      .orderBy('created_at', 'desc')
      .limit(100);

    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/events/high-risk
// @desc    Get high risk events (risk score > 70)
// @access  Private
router.get('/high-risk', auth, async (req, res) => {
  try {
    const events = await db('file_events')
      .where('risk_score', '>', 70)
      .orderBy('created_at', 'desc')
      .limit(50);

    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/events/stats
// @desc    Get event statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    // Get counts by event type
    const eventTypeCounts = await db('file_events')
      .select('event_type')
      .count('* as count')
      .groupBy('event_type');

    // Get average risk score
    const avgRisk = await db('file_events')
      .avg('risk_score as average')
      .first();

    // Get high risk count
    const highRiskCount = await db('file_events')
      .where('risk_score', '>', 70)
      .count('* as count')
      .first();

    // Get external drive events count
    const externalDriveCount = await db('file_events')
      .where('is_external_drive', 1)
      .count('* as count')
      .first();

    res.json({
      eventTypeCounts,
      avgRisk: avgRisk.average || 0,
      highRiskCount: highRiskCount.count,
      externalDriveCount: externalDriveCount.count
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/events/:id
// @desc    Get event by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await db('file_events')
      .where('id', req.params.id)
      .first();

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;