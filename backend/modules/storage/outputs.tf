output "s3_bucket_name" {
  description = "Name of the S3 bucket for transaction logs"
  value       = aws_s3_bucket.transaction_logs.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.transaction_logs.arn
}

output "frontend_bucket_name" {
  description = "Name of the frontend S3 bucket"
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_website_endpoint" {
  description = "S3 website endpoint"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "transactions_table_name" {
  description = "Name of the DynamoDB transactions table"
  value       = aws_dynamodb_table.transactions.name
}

output "transactions_table_arn" {
  description = "ARN of the DynamoDB transactions table"
  value       = aws_dynamodb_table.transactions.arn
}


