# Random suffix for bucket uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 bucket for transaction logs
resource "aws_s3_bucket" "transaction_logs" {
  bucket = "${var.project_name}-logs-${var.environment}-${random_string.bucket_suffix.result}"
}

# Versioning (disabled to save cost)
resource "aws_s3_bucket_versioning" "transaction_logs_versioning" {
  bucket = aws_s3_bucket.transaction_logs.id
  versioning_configuration {
    status = "Disabled"
  }
}

# Server-side encryption (AES256)
resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs_encryption" {
  bucket = aws_s3_bucket.transaction_logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle policy to delete objects after 30 days
resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs_lifecycle" {
  bucket = aws_s3_bucket.transaction_logs.id
  rule {
    id     = "delete_old_logs"
    status = "Enabled"
    filter {
      prefix = ""  # All objects
    }
    expiration {
      days = 30
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "transaction_logs_pab" {
  bucket = aws_s3_bucket.transaction_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
