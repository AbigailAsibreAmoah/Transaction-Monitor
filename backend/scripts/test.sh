#!/bin/bash

echo "🧪 Testing Transaction Monitoring System..."

# Navigate to the dev environment
cd environments/dev || { echo "❌ Dev environment not found"; exit 1; }

# Initialize Terraform (ensure providers are installed)
echo "Initializing Terraform..."
terraform init

# Validate configuration
echo "Validating Terraform configuration..."
terraform validate

# Get API endpoint from Terraform outputs
echo "Retrieving API endpoint..."
API_ENDPOINT=$(terraform output -raw api_endpoint 2>/dev/null)

# Navigate back to project root
cd ../../ || exit

# Check if API endpoint was retrieved successfully
if [ -z "$API_ENDPOINT" ]; then
    echo "❌ Error: Could not retrieve API endpoint. Make sure infrastructure is deployed."
    exit 1
fi

echo "Testing Transaction API at: $API_ENDPOINT/transaction"

# Send a test transaction
echo "Sending test transaction..."
response=$(curl -s -X POST "$API_ENDPOINT/transaction" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1500,
    "merchant": "coffee-shop",
    "currency": "USD"
  }')

# Display API response
echo "API Response:"
echo "$response"

# Check if curl executed successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Test complete! Check AWS S3 console for logged transaction."
else
    echo ""
    echo "❌ Test failed! Check your API Gateway and Lambda configuration."
fi
