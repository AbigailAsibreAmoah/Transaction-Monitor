# DynamoDB table for transactions
resource "aws_dynamodb_table" "transactions" {
  name           = "${var.project_name}-${var.environment}-transactions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "transaction_id"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  global_secondary_index {
    name               = "UserTimestampIndex"
    hash_key           = "user_id"
    range_key          = "timestamp"
    projection_type    = "ALL"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-transactions"
    Environment = var.environment
    Project     = var.project_name
  }
}

# DynamoDB table for CSRF tokens
resource "aws_dynamodb_table" "csrf_tokens" {
  name           = "csrf-tokens"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "token"

  attribute {
    name = "token"
    type = "S"
  }

  ttl {
    attribute_name = "expires"
    enabled        = true
  }

  tags = {
    Name        = "csrf-tokens"
    Environment = var.environment
    Project     = var.project_name
  }
}