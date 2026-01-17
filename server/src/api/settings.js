const express = require('express');
const router = express.Router();
const { db } = require('../db/setup');
const auth = require('../middleware/auth');

// @route   GET api/settings
// @desc    Get all settings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const settings = await db('settings').select('*');

    // Convert to key-value object
    const settingsObj = settings.reduce((obj, item) => {
      obj[item.key] = item.value;
      return obj;
    }, {});

    res.json(settingsObj);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/settings
// @desc    Update settings
// @access  Private (admin only)
router.put('/', auth, async (req, res) => {
  try {
    // Check if user is admin - REMOVED per user request
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ msg: 'Not authorized' });
    // }

    const settings = req.body;

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      await db('settings')
        .where({ key })
        .update({
          value,
          updated_at: db.fn.now()
        });
    }

    res.json({ msg: 'Settings updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/settings/monitoring-paths
// @desc    Get monitoring paths
// @access  Private
router.get('/monitoring-paths', auth, async (req, res) => {
  try {
    const setting = await db('settings')
      .where({ key: 'monitoring_paths' })
      .first();

    if (!setting) {
      return res.json([]);
    }

    const paths = setting.value.split(',');
    res.json(paths);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/settings/monitoring-paths
// @desc    Update monitoring paths
// @access  Private (admin only)
router.put('/monitoring-paths', auth, async (req, res) => {
  try {
    // Check if user is admin - REMOVED per user request
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ msg: 'Not authorized' });
    // }

    const { paths } = req.body;

    if (!Array.isArray(paths)) {
      return res.status(400).json({ msg: 'Paths must be an array' });
    }

    const pathsString = paths.join(',');

    // Update or insert monitoring_paths setting
    const exists = await db('settings')
      .where({ key: 'monitoring_paths' })
      .first();

    if (exists) {
      await db('settings')
        .where({ key: 'monitoring_paths' })
        .update({
          value: pathsString,
          updated_at: db.fn.now()
        });
    } else {
      await db('settings').insert({
        key: 'monitoring_paths',
        value: pathsString,
        description: 'Paths to monitor for file events'
      });
    }

    res.json({ msg: 'Monitoring paths updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;