#!/bin/bash

echo "🚀 Deploying Transaction Monitoring System..."

# Navigate to dev environment
cd environments/dev

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

# Validate configuration
echo "Validating Terraform configuration..."
terraform validate

# Plan deployment
echo "Planning Terraform deployment..."
terraform plan -out=tfplan

# Apply deployment
echo "Applying Terraform deployment..."
terraform apply -auto-approve tfplan

# Show outputs
echo ""
echo "✅ Deployment complete!"
echo "- API Gateway: $(terraform output -raw api_endpoint)"
echo "- Lambda Function: $(terraform output -raw lambda_function_name)"
echo "- S3 Bucket: $(terraform output -raw s3_bucket_name)"

# Return to root
cd ../../
