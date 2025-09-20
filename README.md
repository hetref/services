# Kafka Microservices System

This project implements a microservices architecture using Apache Kafka for event-driven communication. The system includes business registration, search logging, and email notification services.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  Business Reg.  │    │  Search Logs    │
│   (Port 3001)   │    │   (Port 8000)   │    │   (Port 8002)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │        Kafka Broker       │
                    │       (Port 9094)         │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Send Email Service   │
                    │     (Consumer Only)       │
                    └───────────────────────────┘
```

## Services

### 1. API Gateway (Port 3001)
- Unified entry point for all services
- Routes requests to appropriate microservices
- Health check endpoint

### 2. Business Registration Service (Port 8000)
- Handles business registration requests
- Publishes events to `business-registered` topic
- Validates required fields

### 3. Search Logs Service (Port 8002)
- Logs search queries via API
- Consumes from `search-logs` topic
- Creates CSV log files with timestamps

### 4. Send Email Service
- Consumes `business-registered` events
- Sends welcome emails via Gmail SMTP
- Publishes email status to `send-email` topic

## Prerequisites

- Docker and Docker Compose
- Node.js (v14 or higher)
- Gmail account with App Password

## Setup Instructions

### 1. Start Kafka Infrastructure

```bash
cd kafka
docker-compose up -d
```

This will start:
- Kafka broker on port 9094
- Kafka UI on port 8080 (for monitoring)

### 2. Create Kafka Topics

```bash
cd kafka
node admin.js
```

This creates the following topics:
- `business-registered`
- `search-logs`
- `send-email`

### 3. Install Dependencies

For each service, install dependencies:

```bash
# Business Registration Service
cd business-registered
npm install

# Search Logs Service
cd ../search-logs
npm install

# Send Email Service
cd ../send-email
npm install

# API Gateway
cd ../api-gateway
npm install
```

### 4. Configure Email Service

Update the email configuration in `send-email/index.js`:

```javascript
const EMAIL_CONFIG = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "your-email@gmail.com", // Your Gmail address
    pass: "your-app-password"      // Your Gmail App Password
  }
};
```

**To get Gmail App Password:**
1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account settings > Security > App passwords
3. Generate a new app password for "Mail"
4. Use this password in the configuration

### 5. Start All Services

Open separate terminal windows for each service:

```bash
# Terminal 1 - Business Registration Service
cd business-registered
npm start

# Terminal 2 - Search Logs Service
cd search-logs
npm start

# Terminal 3 - Send Email Service
cd send-email
npm start

# Terminal 4 - API Gateway
cd api-gateway
npm start
```

## API Usage

### Business Registration

**Endpoint:** `POST http://localhost:3001/api/business-registered`

**Request Body:**
```json
{
  "businessName": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+1234567890",
  "address": "123 Main St, City, State",
  "businessType": "Technology"
}
```

**Response:**
```json
{
  "message": "Business registration successful",
  "businessId": "BIZ_1234567890_abc123def",
  "status": "pending"
}
```

### Search Logging

**Endpoint:** `POST http://localhost:3001/api/search-logs`

**Request Body:**
```json
{
  "searchQuery": "restaurants near me",
  "userId": "user123",
  "resultsCount": 15
}
```

**Response:**
```json
{
  "message": "Search logged successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Health Check

**Endpoint:** `GET http://localhost:3001/health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "businessRegistered": "http://localhost:8000",
    "searchLogs": "http://localhost:8002"
  }
}
```

## Event Flow

### Business Registration Flow

1. Client sends POST request to `/api/business-registered`
2. API Gateway forwards to Business Registration Service
3. Business Registration Service validates data and publishes to `business-registered` topic
4. Send Email Service consumes the event and sends welcome email
5. Email status is published to `send-email` topic

### Search Logging Flow

1. Client sends POST request to `/api/search-logs`
2. API Gateway forwards to Search Logs Service
3. Search Logs Service publishes to `search-logs` topic
4. Search Logs Service consumes its own events and writes to CSV file

## File Structure

```
services/
├── api-gateway/
│   ├── index.js
│   └── package.json
├── business-registered/
│   ├── index.js
│   └── package.json
├── search-logs/
│   ├── index.js
│   ├── package.json
│   └── logs/
│       └── search-logs.csv
├── send-email/
│   ├── index.js
│   └── package.json
├── kafka/
│   ├── admin.js
│   ├── docker-compose.yml
│   └── package.json
└── README.md
```

## Monitoring

- **Kafka UI:** http://localhost:8080
- **API Gateway Health:** http://localhost:3001/health

## Testing the System

### Test Business Registration

```bash
curl -X POST http://localhost:3001/api/business-registered \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Business",
    "email": "test@example.com",
    "phone": "+1234567890",
    "address": "123 Test St",
    "businessType": "Retail"
  }'
```

### Test Search Logging

```bash
curl -X POST http://localhost:3001/api/search-logs \
  -H "Content-Type: application/json" \
  -d '{
    "searchQuery": "coffee shops",
    "userId": "user123",
    "resultsCount": 5
  }'
```

## Troubleshooting

### Common Issues

1. **Kafka Connection Error:**
   - Ensure Docker containers are running
   - Check if Kafka is accessible on port 9094

2. **Email Not Sending:**
   - Verify Gmail credentials
   - Check if App Password is correct
   - Ensure 2FA is enabled on Gmail account

3. **Service Not Starting:**
   - Check if ports are available
   - Verify all dependencies are installed
   - Check console logs for error messages

### Logs

- Business Registration: Check console output for registration events
- Search Logs: Check `search-logs/logs/search-logs.csv` file
- Email Service: Check console output for email sending status

## Environment Variables

You can use environment variables for configuration:

```bash
# For send-email service
export GMAIL_USER="your-email@gmail.com"
export GMAIL_APP_PASSWORD="your-app-password"

# For API Gateway
export PORT=3001
```

## Development

To modify the services:

1. Make changes to the respective service files
2. Restart the service: `npm start`
3. Test using the API endpoints

## Production Considerations

- Use environment variables for all configuration
- Implement proper error handling and logging
- Add authentication and authorization
- Use a proper database instead of CSV files
- Implement health checks and monitoring
- Use Docker containers for deployment
