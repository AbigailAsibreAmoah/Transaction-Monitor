output "api_endpoint" {
  description = "API Gateway endpoint for testing"
  value       = module.api_gateway.api_gateway_url
}

output "s3_bucket_name" {
  description = "S3 bucket for transaction logs"
  value       = module.storage.s3_bucket_name
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.lambda.lambda_function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = module.lambda.lambda_function_arn
}

output "lambda_invoke_arn" {
  description = "Lambda function invoke ARN for API Gateway"
  value       = module.lambda.lambda_invoke_arn
}

output "api_base_url" {
  description = "API Gateway base URL"
  value       = module.api_gateway.api_gateway_url
}

output "transaction_url" {
  description = "Transaction endpoint URL"
  value       = "${module.api_gateway.api_gateway_url}/transaction"
}

output "signup_url" {
  description = "Signup endpoint URL"
  value       = "${module.api_gateway.api_gateway_url}/signup"
}

output "login_url" {
  description = "Login endpoint URL"
  value       = "${module.api_gateway.api_gateway_url}/login"
}

output "frontend_config" {
  value = {
  region                      = var.aws_region
  cognito_user_pool_id        = module.api_gateway.cognito_user_pool_id
  cognito_user_pool_client_id = module.api_gateway.cognito_user_pool_client_id
  }
  sensitive = false
}

