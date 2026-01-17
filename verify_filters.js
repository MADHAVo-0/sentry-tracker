const axios = require('axios');

const API_URL = 'http://localhost:5001/api';
// We need a token. Since we are running locally and have access to the DB/Code, 
// we can't easily get a token without logging in. 
// However, we can use the 'testuser' credentials we know.

async function verifyFilters() {
    try {
        // 1. Login to get token
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'test@example.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        const config = { headers: { 'x-auth-token': token } };

        // 2. Test High Risk Filter
        console.log('Testing High Risk Filter...');
        const highRiskRes = await axios.get(`${API_URL}/events?riskLevel=high`, config);
        const highRiskEvents = highRiskRes.data.events;

        const invalidHighRisk = highRiskEvents.filter(e => e.risk_score < 70);
        if (invalidHighRisk.length > 0) {
            console.error('FAILED: Found low risk events in high risk filter:', invalidHighRisk.length);
        } else {
            console.log(`PASSED: Retrieved ${highRiskEvents.length} high risk events.`);
        }

        // 3. Test Event Type Filter
        console.log('Testing Create Event Filter...');
        const createRes = await axios.get(`${API_URL}/events?eventType=create`, config);
        const createEvents = createRes.data.events;

        const invalidCreate = createEvents.filter(e => e.event_type !== 'create');
        if (invalidCreate.length > 0) {
            console.error('FAILED: Found non-create events in create filter:', invalidCreate.length);
        } else {
            console.log(`PASSED: Retrieved ${createEvents.length} create events.`);
        }

    } catch (error) {
        console.error('Error during verification:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

verifyFilters();
