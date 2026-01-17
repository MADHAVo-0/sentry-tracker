/**
 * Risk Analyzer Service
 * Calculates risk scores for file events based on various factors
 */

// High-risk file extensions
const HIGH_RISK_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'ps1', 'vbs', 'js', 'jar', 'sh', 'py', 'dll'
];

// Sensitive file extensions (potentially containing sensitive data)
const SENSITIVE_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'txt', 'rtf',
  'db', 'sql', 'json', 'xml', 'config', 'env'
];

/**
 * Calculate risk score for a file event
 * @param {Object} eventData - Data about the file event
 * @returns {Number} Risk score from 0-100
 */
const calculateRiskScore = (eventData) => {
  const { eventType, filePath, fileName, fileExt, isExternalDrive } = eventData;
  let score = 0;
  
  // Base risk by event type
  switch (eventType) {
    case 'create':
      score += 30;
      break;
    case 'modify':
      score += 20;
      break;
    case 'delete':
      score += 40; // Deletion is higher risk
      break;
    case 'create_dir':
      score += 15;
      break;
    case 'delete_dir':
      score += 35;
      break;
    default:
      score += 10;
  }
  
  // External drive factor (significant risk increase)
  if (isExternalDrive) {
    score += 30;
  }
  
  // File extension risk
  if (HIGH_RISK_EXTENSIONS.includes(fileExt.toLowerCase())) {
    score += 25;
  } else if (SENSITIVE_EXTENSIONS.includes(fileExt.toLowerCase())) {
    score += 15;
  }
  
  // File name patterns that might indicate sensitive content
  const sensitivePatterns = [
    /password/i, /secret/i, /confidential/i, /private/i, 
    /account/i, /credit/i, /ssn/i, /social/i, /bank/i
  ];
  
  for (const pattern of sensitivePatterns) {
    if (pattern.test(fileName)) {
      score += 20;
      break; // Only add this risk factor once
    }
  }
  
  // Path-based risk factors
  if (filePath.toLowerCase().includes('temp') || filePath.toLowerCase().includes('tmp')) {
    score += 10; // Temp directories can be suspicious
  }
  
  // Cap the score at 100
  return Math.min(Math.max(score, 0), 100);
};

/**
 * Analyze patterns in file events to detect anomalies
 * This is a simplified version - in a real implementation, this would use
 * machine learning algorithms like Isolation Forest
 */
const detectAnomalies = async (userId, recentEvents, db) => {
  // Get user's baseline activity (simplified)
  const userBaseline = await getUserBaseline(userId, db);
  
  // Count events by type
  const eventCounts = recentEvents.reduce((counts, event) => {
    counts[event.event_type] = (counts[event.event_type] || 0) + 1;
    return counts;
  }, {});
  
  const anomalies = [];
  
  // Check for volume anomalies (simplified)
  if (recentEvents.length > userBaseline.avgEventsPerHour * 3) {
    anomalies.push({
      type: 'high_volume',
      description: 'Unusually high number of file operations',
      severity: 3
    });
  }
  
  // Check for deletion anomalies
  if (eventCounts.delete > userBaseline.avgDeletesPerHour * 2) {
    anomalies.push({
      type: 'high_deletion',
      description: 'Unusually high number of file deletions',
      severity: 4
    });
  }
  
  return anomalies;
};

/**
 * Get user's baseline activity patterns
 * In a real implementation, this would be based on historical data
 */
const getUserBaseline = async (userId, db) => {
  // This would normally query the database for historical patterns
  // For now, return default values
  return {
    avgEventsPerHour: 20,
    avgDeletesPerHour: 5,
    avgExternalDriveEvents: 3,
    commonFileTypes: ['docx', 'pdf', 'jpg', 'png']
  };
};

module.exports = {
  calculateRiskScore,
  detectAnomalies
};