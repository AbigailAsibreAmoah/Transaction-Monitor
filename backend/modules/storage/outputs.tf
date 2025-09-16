output "s3_bucket_name" {
  description = "Name of the S3 bucket for transaction logs"
  value       = aws_s3_bucket.transaction_logs.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.transaction_logs.arn
}
