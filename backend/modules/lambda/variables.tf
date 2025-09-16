variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "transaction-processor"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for logs"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket for transaction logs"
  type        = string
}


