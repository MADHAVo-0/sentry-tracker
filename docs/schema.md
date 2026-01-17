# SENTRY-DOC Database Schema

This document outlines the database schema for the SENTRY-DOC application.

## Overview

SENTRY-DOC uses SQLite as the default database (with an option to switch to PostgreSQL). The schema consists of the following tables:

- `users`: User account information
- `file_events`: Records of file system events
- `risk_alerts`: High-risk events that triggered alerts
- `external_domains`: Information about external drives
- `settings`: Application configuration settings

## Tables

### users

Stores user account information and authentication details.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Unique identifier |
| username | TEXT | NOT NULL, UNIQUE | User's display name |
| email | TEXT | NOT NULL, UNIQUE | User's email address |
| password | TEXT | NOT NULL | Hashed password |
| role | TEXT | NOT NULL | User role (admin, user) |
| created_at | TIMESTAMP | NOT NULL | Account creation timestamp |
| last_login | TIMESTAMP | | Last login timestamp |

### file_events

Records all file system events monitored by the application.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Unique identifier |
| event_type | TEXT | NOT NULL | Type of event (create, modify, delete, etc.) |
| file_path | TEXT | NOT NULL | Full path to the file |
| file_name | TEXT | NOT NULL | Name of the file |
| file_extension | TEXT | | File extension |
| timestamp | TIMESTAMP | NOT NULL | When the event occurred |
| user_id | INTEGER | FOREIGN KEY | Reference to users.id |
| risk_score | INTEGER | NOT NULL | Calculated risk score (0-100) |
| is_external_drive | BOOLEAN | NOT NULL | Whether event occurred on external drive |
| details | TEXT | | Additional event details |

### risk_alerts

Stores high-risk events that triggered security alerts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Unique identifier |
| event_id | INTEGER | FOREIGN KEY | Reference to file_events.id |
| alert_type | TEXT | NOT NULL | Type of alert |
| severity | TEXT | NOT NULL | Alert severity (high, critical) |
| timestamp | TIMESTAMP | NOT NULL | When the alert was generated |
| description | TEXT | NOT NULL | Alert description |
| is_resolved | BOOLEAN | NOT NULL | Whether the alert has been resolved |
| resolved_by | INTEGER | FOREIGN KEY | Reference to users.id who resolved |
| resolved_at | TIMESTAMP | | When the alert was resolved |

### external_domains

Tracks information about external drives connected to the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Unique identifier |
| drive_name | TEXT | NOT NULL | Name of the external drive |
| drive_path | TEXT | NOT NULL | Path to the external drive |
| first_connected | TIMESTAMP | NOT NULL | When first detected |
| last_connected | TIMESTAMP | NOT NULL | When last detected |
| connection_count | INTEGER | NOT NULL | Number of times connected |
| is_trusted | BOOLEAN | NOT NULL | Whether drive is marked as trusted |

### settings

Stores application configuration settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Unique identifier |
| key | TEXT | NOT NULL, UNIQUE | Setting name |
| value | TEXT | NOT NULL | Setting value |
| description | TEXT | | Setting description |
| updated_at | TIMESTAMP | NOT NULL | Last updated timestamp |
| updated_by | INTEGER | FOREIGN KEY | Reference to users.id |

## Relationships

- `file_events.user_id` → `users.id`: Links file events to the user who performed them
- `risk_alerts.event_id` → `file_events.id`: Links risk alerts to their triggering events
- `risk_alerts.resolved_by` → `users.id`: Links alert resolution to the user who resolved it
- `settings.updated_by` → `users.id`: Links setting changes to the user who made them

## Indexes

- `idx_file_events_timestamp`: Index on `file_events.timestamp` for faster time-based queries
- `idx_file_events_risk_score`: Index on `file_events.risk_score` for faster risk-based filtering
- `idx_file_events_user_id`: Index on `file_events.user_id` for faster user-based filtering
- `idx_risk_alerts_timestamp`: Index on `risk_alerts.timestamp` for faster time-based queries

## Default Data

The database is initialized with the following default data:

### Default Admin User

```sql
INSERT INTO users (username, email, password, role, created_at)
VALUES ('admin', 'admin@example.com', '$2a$10$hashed_password', 'admin', CURRENT_TIMESTAMP);
```

### Default Settings

```sql
INSERT INTO settings (key, value, description, updated_at)
VALUES 
  ('monitoringEnabled', 'true', 'Enable file monitoring', CURRENT_TIMESTAMP),
  ('alertsEnabled', 'true', 'Enable risk alerts', CURRENT_TIMESTAMP),
  ('highRiskThreshold', '70', 'Threshold for high risk events', CURRENT_TIMESTAMP),
  ('mediumRiskThreshold', '40', 'Threshold for medium risk events', CURRENT_TIMESTAMP);
```