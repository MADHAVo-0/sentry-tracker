const chokidar = require('chokidar');
const path = require('path');
const os = require('os');
const { db } = require('../db/setup');
const { calculateRiskScore } = require('./riskAnalyzer');

// Get default monitoring paths if not specified
const getDefaultPaths = () => {
  const userHome = os.homedir();
  return [
    path.join(userHome, 'Documents'),
    path.join(userHome, 'Downloads'),
    path.join(userHome, 'Desktop')
  ];
};

// Setup file monitoring with chokidar
const setupFileMonitoring = (io) => {
  // Get paths to monitor from environment or use defaults
  const monitoringPaths = process.env.MONITORING_PATHS 
    ? process.env.MONITORING_PATHS.split(',') 
    : getDefaultPaths();

  console.log(`Monitoring paths: ${monitoringPaths.join(', ')}`);

  // Initialize watcher
  const watcher = chokidar.watch(monitoringPaths, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    },
    ignored: [
      /(^|[\/\\])\../, // Ignore dot files
      '**/node_modules/**',
      '**/.git/**'
    ]
  });

  // File event handlers
  const handleFileEvent = async (eventType, filePath) => {
    try {
      const fileName = path.basename(filePath);
      const fileExt = path.extname(filePath).slice(1);
      const isExternalDrive = filePath.startsWith('/media/') || 
                             filePath.match(/^[A-Z]:\\/) && !filePath.startsWith('C:\\');
      
      // Calculate risk score based on file and event type
      const riskScore = calculateRiskScore({
        eventType,
        filePath,
        fileName,
        fileExt,
        isExternalDrive
      });

      // Create file event record
      const [eventId] = await db('file_events').insert({
        event_type: eventType,
        file_path: filePath,
        file_name: fileName,
        file_extension: fileExt,
        is_external_drive: isExternalDrive ? 1 : 0,
        risk_score: riskScore,
        user_id: os.userInfo().username,
        process_name: 'system'
      });

      // Emit event to connected clients
      const eventData = {
        id: eventId,
        event_type: eventType,
        file_path: filePath,
        file_name: fileName,
        risk_score: riskScore,
        timestamp: new Date().toISOString()
      };
      
      io.emit('file_event', eventData);
      
      // Generate alert if risk score is high
      if (riskScore > 70) {
        const alertData = {
          alert_type: 'high_risk_activity',
          description: `High risk ${eventType} activity detected on file: ${fileName}`,
          severity: Math.ceil(riskScore / 20), // Convert to 1-5 scale
          risk_score: riskScore,
          file_event_id: eventId
        };
        
        await db('risk_alerts').insert(alertData);
        io.emit('risk_alert', alertData);
      }
      
      console.log(`[${eventType}] ${filePath} (Risk: ${riskScore})`);
    } catch (error) {
      console.error(`Error processing ${eventType} event:`, error);
    }
  };

  // Setup event listeners
  watcher
    .on('add', (filePath) => handleFileEvent('create', filePath))
    .on('change', (filePath) => handleFileEvent('modify', filePath))
    .on('unlink', (filePath) => handleFileEvent('delete', filePath))
    .on('addDir', (dirPath) => handleFileEvent('create_dir', dirPath))
    .on('unlinkDir', (dirPath) => handleFileEvent('delete_dir', dirPath))
    .on('error', (error) => console.error(`Watcher error: ${error}`));

  return watcher;
};

module.exports = { setupFileMonitoring };