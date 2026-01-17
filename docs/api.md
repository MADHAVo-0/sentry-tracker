# SENTRY-DOC API Documentation

This document provides details on all available API endpoints in the SENTRY-DOC application.

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:5000
```

## Authentication

Most endpoints require authentication using a JWT token. Include the token in the request header:

```
x-auth-token: <your_jwt_token>
```

## API Endpoints

### Authentication

#### Register a new user

```
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

#### Login

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

#### Get current user

```
GET /api/auth/user
```

**Response:**
```json
{
  "id": "number",
  "username": "string",
  "email": "string",
  "role": "string"
}
```

### Events

#### Get all events (paginated)

```
GET /api/events
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `eventType`: Filter by event type
- `riskLevel`: Filter by risk level
- `searchTerm`: Search in file paths
- `dateRange`: Filter by date range (today, week, month, all)

**Response:**
```json
{
  "events": [
    {
      "id": "number",
      "event_type": "string",
      "file_path": "string",
      "timestamp": "string",
      "user_id": "number",
      "username": "string",
      "risk_score": "number",
      "details": "string"
    }
  ],
  "total": "number"
}
```

#### Get recent events

```
GET /api/events/recent
```

**Response:**
```json
[
  {
    "id": "number",
    "event_type": "string",
    "file_path": "string",
    "timestamp": "string",
    "user_id": "number",
    "username": "string",
    "risk_score": "number",
    "details": "string"
  }
]
```

#### Get high-risk events

```
GET /api/events/high-risk
```

**Response:**
```json
[
  {
    "id": "number",
    "event_type": "string",
    "file_path": "string",
    "timestamp": "string",
    "user_id": "number",
    "username": "string",
    "risk_score": "number",
    "details": "string"
  }
]
```

#### Get event statistics

```
GET /api/events/stats
```

**Response:**
```json
{
  "eventCounts": {
    "create": "number",
    "modify": "number",
    "delete": "number",
    "rename": "number",
    "copy": "number",
    "move": "number"
  },
  "averageRisk": "number",
  "highRiskCount": "number",
  "externalDriveEvents": "number"
}
```

#### Get event by ID

```
GET /api/events/:id
```

**Response:**
```json
{
  "id": "number",
  "event_type": "string",
  "file_path": "string",
  "timestamp": "string",
  "user_id": "number",
  "username": "string",
  "risk_score": "number",
  "details": "string"
}
```

### Analytics

#### Get risk summary

```
GET /api/analytics/risk-summary
```

**Response:**
```json
{
  "highRiskCount": "number",
  "mediumRiskCount": "number",
  "lowRiskCount": "number",
  "alertsCount": "number"
}
```

#### Get anomalies

```
GET /api/analytics/anomalies
```

**Response:**
```json
{
  "anomalies": [
    {
      "id": "number",
      "file_path": "string",
      "event_type": "string",
      "timestamp": "string",
      "risk_score": "number",
      "description": "string"
    }
  ]
}
```

#### Get event timeline

```
GET /api/analytics/event-timeline
```

**Response:**
```json
{
  "labels": ["string"],
  "counts": ["number"]
}
```

#### Get external drive activity

```
GET /api/analytics/external-drive-activity
```

**Response:**
```json
{
  "labels": ["string"],
  "counts": ["number"]
}
```

### Settings

#### Get all settings

```
GET /api/settings
```

**Response:**
```json
{
  "monitoringEnabled": "boolean",
  "alertsEnabled": "boolean",
  "highRiskThreshold": "number",
  "mediumRiskThreshold": "number",
  "monitoringPaths": ["string"]
}
```

#### Update settings

```
PUT /api/settings
```

**Request Body:**
```json
{
  "monitoringEnabled": "boolean",
  "alertsEnabled": "boolean",
  "highRiskThreshold": "number",
  "mediumRiskThreshold": "number"
}
```

**Response:**
```json
{
  "message": "Settings updated successfully"
}
```

#### Add monitoring path

```
POST /api/settings/monitoring-paths
```

**Request Body:**
```json
{
  "path": "string"
}
```

**Response:**
```json
{
  "message": "Monitoring path added successfully"
}
```

#### Delete monitoring path

```
DELETE /api/settings/monitoring-paths
```

**Request Body:**
```json
{
  "path": "string"
}
```

**Response:**
```json
{
  "message": "Monitoring path removed successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "message": "Error message describing the issue"
}
```

### 401 Unauthorized

```json
{
  "message": "Authentication failed"
}
```

### 403 Forbidden

```json
{
  "message": "Access denied"
}
```

### 404 Not Found

```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "message": "Server error"
}
```