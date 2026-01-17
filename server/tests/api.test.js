const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../index');
const { db } = require('../src/db/setup');

// Mock user for authentication
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin'
};

// Generate a valid JWT token for testing
const generateToken = (user) => {
  // Align with middleware which expects decoded.user
  const secret = process.env.JWT_SECRET || 'testsecret';
  return jwt.sign(
    { user: { id: user.id, role: user.role } },
    secret,
    { expiresIn: '1h' }
  );
};

// Setup and teardown
beforeAll(async () => {
  // Database tables are created by setupDatabase() when index.js is required.
  // No migrations/seeds are defined; proceed with empty tables.
});

afterAll(async () => {
  // Close database connection
  await db.destroy();
});

describe('Auth API', () => {
  test('POST /api/auth/register should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200); // server returns 200 with token
    expect(res.body).toHaveProperty('token');
  });

  test('POST /api/auth/login should authenticate user and return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'newuser@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  test('GET /api/auth/user should return user data with valid token', async () => {
    const token = generateToken(mockUser);
    
    const res = await request(app)
      .get('/api/auth/user')
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username');
  });
});

describe('Events API', () => {
  let token;
  
  beforeEach(() => {
    token = generateToken(mockUser);
  });

  test('GET /api/events should return paginated events', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('events');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.events)).toBeTruthy();
  });

  test('GET /api/events/recent should return recent events', async () => {
    const res = await request(app)
      .get('/api/events/recent')
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('GET /api/events/stats should return event statistics', async () => {
    const res = await request(app)
      .get('/api/events/stats')
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('eventTypeCounts');
    expect(res.body).toHaveProperty('avgRisk');
    expect(res.body).toHaveProperty('highRiskCount');
  });
});

describe('Analytics API', () => {
  let token;
  
  beforeEach(() => {
    token = generateToken(mockUser);
  });

  test('GET /api/analytics/risk-summary should return risk distribution', async () => {
    const res = await request(app)
      .get('/api/analytics/risk-summary')
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('riskDistribution');
    expect(res.body).toHaveProperty('alertsCount');
  });

  test('GET /api/analytics/anomalies should return detected anomalies', async () => {
    const res = await request(app)
      .get('/api/analytics/anomalies')
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});

describe('Settings API', () => {
  let token;
  
  beforeEach(() => {
    token = generateToken(mockUser);
  });

  test('GET /api/settings should return application settings', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('x-auth-token', token);
    
    expect(res.statusCode).toEqual(200);
    expect(typeof res.body).toBe('object');
  });

  test('PUT /api/settings should update application settings', async () => {
    const updatedSettings = {
      monitoringEnabled: true,
      alertsEnabled: false,
      highRiskThreshold: 75,
      mediumRiskThreshold: 45
    };
    
    const res = await request(app)
      .put('/api/settings')
      .set('x-auth-token', token)
      .send(updatedSettings);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.msg || res.body.message).toContain('updated');
  });
});