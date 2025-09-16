variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "lambda_function_name" {
  description = "Lambda function name"
  type        = string
}

variable "lambda_invoke_arn" {
  description = "Lambda function invoke ARN"
  type        = string
}

variable "cors_allowed_origin" {
  description = "CORS allowed origin (use '*' for demo, or your frontend URL for production)"
  type        = string
  default     = "http://localhost:3000"  # safer default
}

