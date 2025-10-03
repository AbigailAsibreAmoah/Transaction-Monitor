# Transaction Monitoring System

A comprehensive full-stack financial transaction monitoring and risk assessment platform built with Angular frontend and AWS serverless backend infrastructure.

## Architecture Overview

### Frontend (Angular)
- **Framework**: Angular 20.3.0 with standalone components
- **Language**: TypeScript for type safety
- **Styling**: Custom CSS with professional blue theme
- **Charts**: Chart.js + ng2-charts for real-time data visualization
- **Authentication**: AWS Cognito integration
- **Deployment**: S3 + CloudFront CDN

### Backend (AWS Serverless)
- **Compute**: AWS Lambda (Python 3.x)
- **API**: API Gateway with CORS support
- **Authentication**: AWS Cognito User Pools
- **Storage**: S3 for transaction logs
- **Security**: DynamoDB for CSRF token management
- **Infrastructure**: Terraform for IaC

## Features

### Core Functionality
- **User Authentication** - Secure signup/login with AWS Cognito
- **Transaction Processing** - Real-time transaction submission and validation
- **Risk Assessment** - Intelligent risk scoring algorithm
- **Transaction History** - Complete audit trail with delete functionality
- **Real-time Dashboard** - Live metrics and data visualization
- **Multi-currency Support** - USD, EUR, GBP, GHS (Ghana Cedis)

### Security Features
- **CSRF Protection** - Token-based request validation (configurable)
- **Input Validation** - Comprehensive server-side validation
- **Authentication Tokens** - JWT-based session management
- **CORS Configuration** - Secure cross-origin resource sharing

### User Interface
- **Responsive Design** - Mobile-first responsive layout
- **Tabbed Navigation** - Dashboard, Submit Transaction, History
- **Professional Theme** - Clean blue and white color scheme
- **Interactive Charts** - Line, bar, and doughnut charts
- **Real-time Updates** - Live transaction monitoring

## Risk Assessment Algorithm

### Risk Scoring Rules
The system calculates risk scores based on:

**Amount-based Risk:**
- Transactions > $10,000: +50 points
- Transactions > $5,000: +30 points  
- Transactions > $1,000: +10 points

**Merchant-based Risk:**
- High-risk merchants (+40 points): 'casino', 'crypto', 'gambling'

**Decision Thresholds:**
- **Risk Score > 70**: Transaction flagged as high-risk
- **Risk Score ≤ 70**: Transaction approved

### Example Risk Scenarios
- $15,000 to any merchant = 50 points → **FLAGGED**
- $6,001 to "Casino" = 30 + 40 = 70+ points → **FLAGGED**
- $2,000 to "Amazon" = 10 points → **APPROVED**

## Project Structure

```
Transaction-Monitoring/
├── frontend/                    # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/     # Angular components
│   │   │   │   ├── auth/       # Authentication component
│   │   │   │   ├── dashboard/  # Main dashboard
│   │   │   │   ├── monitoring-dashboard/  # Real-time charts
│   │   │   │   ├── analytics/  # Comprehensive analytics
│   │   │   │   ├── transaction-history/   # Transaction list
│   │   │   │   └── tab-navigation/        # Tab navigation
│   │   │   └── utils/          # Utility functions
│   │   └── styles.css          # Global styles
│   └── package.json            # Dependencies
├── backend/                   # AWS infrastructure
│   ├── environments/dev/      # Development environment
│   ├── modules/              # Terraform modules
│   │   ├── api-gateway/      # API Gateway configuration
│   │   ├── lambda/           # Lambda functions
│   │   └── storage/          # S3 bucket setup
│   └── scripts/              # Deployment scripts
└── README.md                 # This file
```

## Technology Stack

### Frontend Dependencies
```json
{
  "@angular/core": "^20.3.0",
  "@angular/common": "^20.3.0",
  "@angular/forms": "^20.3.0",
  "chart.js": "^4.5.0",
  "ng2-charts": "^8.0.0",
  "typescript": "~5.9.2"
}
```

### Backend Technologies
- **Runtime**: Python 3.x
- **AWS Services**: Lambda, API Gateway, Cognito, S3, DynamoDB
- **Infrastructure**: Terraform
- **Libraries**: boto3, json, datetime, uuid, secrets

## Deployment

### AWS Resources
- **Lambda Function**: `transaction-monitor-dev-function`
- **S3 Bucket**: `transaction-monitor-frontend-dev-iqye17nn`
- **CloudFront Distribution**: `E2K9YPW4SMSG86`
- **API Gateway**: `https://lpf1gn8aia.execute-api.us-east-1.amazonaws.com/dev`
- **DynamoDB Tables**: `transaction-monitor-dev-transactions`, `csrf-tokens`

### Frontend Deployment
```bash
cd frontend
npm run build
aws s3 sync dist/frontend/browser/ s3://transaction-monitor-frontend-dev-iqye17nn --delete
aws cloudfront create-invalidation --distribution-id E2K9YPW4SMSG86 --paths "/*"
```

### Backend Deployment
```bash
cd backend/environments/dev
terraform init
terraform plan
terraform apply
```

## API Endpoints

### Authentication
- `POST /login` - User authentication
- `POST /signup` - User registration
- `GET /csrf-token` - CSRF token generation

### Transactions
- `POST /transaction` - Submit new transaction
- `GET /transactions` - Retrieve user transactions
- `GET /test` - API health check

### Request/Response Examples

**Submit Transaction:**
```json
POST /transaction
{
  "amount": 1500.00,
  "merchant": "Amazon",
  "currency": "USD"
}

Response:
{
  "transaction_id": "uuid-string",
  "risk_score": 10,
  "status": "approved"
}
```

## UI Components

### Navigation Tabs
- **Dashboard**: Compact overview with key metrics and mini-charts
- **Submit Transaction**: Transaction form with validation
- **Analytics**: Comprehensive full-size charts and detailed metrics
- **Transaction History**: Complete transaction list with export functionality

### Dashboard Features
- **Metrics Cards**: Total transactions, volume, average risk score, alerts
- **Interactive Charts**: Transaction amounts, risk scores, risk distribution
- **Real-time Updates**: Live data refresh without page reload
- **Animated Dolphin**: Delightful mascot animation on page load

### Analytics Features
- **Detailed KPIs**: 6 comprehensive metric cards
- **Risk Analysis**: Visual breakdown of low/medium/high risk transactions
- **Full-Size Charts**: 6 large interactive charts for detailed analysis
- **Data Tables**: Currency and merchant breakdown with statistics
- **Time Series**: Dual-axis charts showing trends over time

### Export Features
- **Icon-Based Buttons**: Clean SVG icons for CSV and PDF export
- **Professional Design**: Color-coded file type indicators
- **Hover Effects**: Smooth animations and tooltips

### Styling Highlights
- **Professional Theme**: Blue (#3b82f6) and white color scheme with striped background
- **Responsive Design**: Mobile-optimized layouts
- **Accessibility**: High contrast ratios and keyboard navigation
- **Modern UI**: Glassmorphic effects with backdrop blur
- **TypeScript**: Full type safety throughout the application

## Security Implementation

### Current Security Measures
- AWS Cognito authentication
- Input validation and sanitization
- CORS configuration
- Secure token management
- Transaction audit logging

### CSRF Protection (Configurable)
- Token-based validation system
- DynamoDB token storage
- 1-hour token expiration
- Currently disabled for development

## Monitoring & Analytics

### Real-time Metrics
- Transaction volume tracking
- Risk score analysis
- Currency distribution
- Time-based transaction patterns

### Data Visualization
- **Line Charts**: Transaction amounts over time
- **Bar Charts**: Risk score distribution
- **Doughnut Charts**: Risk level breakdown
- **Activity Feed**: Recent transaction stream

## Multi-currency Support

Supported currencies with proper symbols:
- **USD** ($) - US Dollar
- **EUR** (€) - Euro
- **GBP** (£) - British Pound
- **GHS** (₵) - Ghana Cedis

## Configuration

### Environment Variables
```bash
S3_BUCKET=transaction-monitor-frontend-dev-iqye17nn
PROJECT_NAME=transaction-monitor
ENVIRONMENT=dev
```

### CORS Configuration
```javascript
'Access-Control-Allow-Origin': 'https://d1n1njxujlyqzf.cloudfront.net'
'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-CSRF-Token'
'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
```

## Current Status

### Completed Features
- **Full-stack Angular application** with TypeScript
- **AWS Cognito authentication** system
- **Transaction processing pipeline** with DynamoDB persistence
- **Advanced risk assessment** algorithm
- **Multi-tab interface** with dedicated analytics section
- **Comprehensive analytics** with 6 detailed charts
- **Real-time dashboard** with compact overview
- **Transaction history** with icon-based export (CSV/PDF)
- **Multi-currency support** (10 currencies)
- **Professional UI design** with animated dolphin mascot
- **Responsive mobile design** with glassmorphic effects
- **Complete data persistence** with transaction retrieval

### Technical Implementation
- **Angular 20.3.0** with standalone components architecture
- **TypeScript** for full type safety
- **DynamoDB integration** for transaction storage and retrieval
- **Chart.js + ng2-charts** for advanced data visualization
- **AWS Lambda** with Decimal support for financial data
- **API Gateway** with proper CORS and Cognito authorization
- **S3 + CloudFront** for global content delivery

## Usage Instructions

1. **Access Application**: Visit the CloudFront URL
2. **Create Account**: Use the signup form with email verification
3. **Login**: Authenticate with username/password
4. **Submit Transactions**: Use the transaction form with amount, merchant, currency
5. **Monitor Dashboard**: View real-time metrics and charts
6. **Review History**: Check transaction history with risk scores
7. **Delete Records**: Remove transactions from session view

## Key Achievements

- **Modern Angular Architecture**: Standalone components with TypeScript
- **Comprehensive Analytics**: Dedicated tab with full-size charts and detailed metrics
- **Professional Design**: Enterprise-grade UI/UX with animated elements
- **Complete Data Persistence**: DynamoDB integration with transaction retrieval
- **Advanced Visualization**: 6 different chart types for comprehensive analysis
- **Icon-Based Exports**: Clean SVG file icons for CSV/PDF export
- **Real-time Processing**: Instant transaction validation and risk assessment
- **Multi-layer Security**: AWS Cognito + API Gateway authorization
- **Scalable Infrastructure**: Serverless AWS architecture
- **Audit Compliance**: Complete transaction logging to S3 and DynamoDB
- **International Support**: Multi-currency with proper symbols and formatting
- **Mobile Responsive**: Optimized for all device sizes

---

**Built with Angular, TypeScript, AWS, and Terraform**