variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "transaction-monitor"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"  # Cheapest region
}
