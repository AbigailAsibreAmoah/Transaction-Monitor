output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.transaction_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${var.environment}"
}