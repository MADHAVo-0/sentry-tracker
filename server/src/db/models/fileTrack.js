const { db } = require('../setup.js');

// Create file_tracks table if it doesn't exist
const createFileTracksTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS file_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      originalname TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size INTEGER NOT NULL,
      path TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      risk_level TEXT DEFAULT 'low',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  
  try {
    await db.run(query);
    console.log('File tracks table created or already exists');
  } catch (error) {
    console.error('Error creating file tracks table:', error);
    throw error;
  }
};

// Add a new file track record
const addFileTrack = async (fileData) => {
  try {
    // Map camelCase keys from API layer to snake_case DB columns
    const insertData = {
      filename: fileData.filename,
      originalname: fileData.originalname,
      mimetype: fileData.mimetype,
      size: fileData.size,
      path: fileData.path,
      user_id: fileData.userId,
      risk_level: fileData.riskLevel || 'low'
    };

    const [id] = await db('file_tracks').insert(insertData);
    return { id, ...insertData };
  } catch (error) {
    console.error('Error adding file track:', error);
    throw error;
  }
};

// Get all file tracks for a user
const getFileTracksByUser = async (userId) => {
  try {
    return await db('file_tracks')
      .where('user_id', userId)
      .orderBy('upload_date', 'desc');
  } catch (error) {
    console.error('Error getting file tracks:', error);
    throw error;
  }
};

// Get all file tracks
const getAllFileTracks = async () => {
  try {
    return await db('file_tracks as ft')
      .join('users as u', 'ft.user_id', 'u.id')
      .select('ft.*', 'u.username')
      .orderBy('upload_date', 'desc');
  } catch (error) {
    console.error('Error getting all file tracks:', error);
    throw error;
  }
};

// Update file track status
const updateFileTrackStatus = async (fileId, status, riskLevel) => {
  try {
    await db('file_tracks')
      .where({ id: fileId })
      .update({ status, risk_level: riskLevel });
    return { id: fileId, status, riskLevel };
  } catch (error) {
    console.error('Error updating file track status:', error);
    throw error;
  }
};

// Delete a file track
const deleteFileTrack = async (fileId) => {
  try {
    await db('file_tracks')
      .where({ id: fileId })
      .del();
    return { id: fileId, deleted: true };
  } catch (error) {
    console.error('Error deleting file track:', error);
    throw error;
  }
};

module.exports = {
  createFileTracksTable,
  addFileTrack,
  getFileTracksByUser,
  getAllFileTracks,
  updateFileTrackStatus,
  deleteFileTrack
};