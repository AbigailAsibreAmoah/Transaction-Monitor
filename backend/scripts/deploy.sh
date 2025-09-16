#!/bin/bash

echo "🚀 Deploying Transaction Monitoring System..."

# Navigate to the dev environment
cd environments/dev || { echo "❌ Dev environment not found"; exit 1; }

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

# Validate configuration
echo "Validating Terraform configuration..."
terraform validate

# Plan deployment
echo "Planning Terraform deployment..."
terraform plan -out=tfplan

# Confirm before applying
echo ""
echo "Review the plan above. Do you want to proceed? (yes/no)"
read -r response

if [[ "$response" == "yes" ]]; then
    echo "Applying Terraform plan..."
    terraform apply tfplan

    echo ""
    echo "✅ Deployment complete!"

    # Show important outputs
    echo "📋 Important endpoints and resources:"
    echo "- API Gateway Base URL: $(terraform output -raw api_base_url 2>/dev/null || echo 'Not found')"
    echo "- Transaction Endpoint: $(terraform output -raw transaction_url 2>/dev/null || echo 'Not found')"
    echo "- Signup Endpoint: $(terraform output -raw signup_url 2>/dev/null || echo 'Not found')"
    echo "- Login Endpoint: $(terraform output -raw login_url 2>/dev/null || echo 'Not found')"
    echo "- Lambda Function Name: $(terraform output -raw lambda_function_name 2>/dev/null || echo 'Not found')"
    echo "- Lambda Invoke ARN: $(terraform output -raw lambda_invoke_arn 2>/dev/null || echo 'Not found')"

else
    echo "❌ Deployment cancelled"
fi

# Return to project root
cd ../../

