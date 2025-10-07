# Create zip file from Python code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_code.py"
  output_path = "${path.module}/transaction_processor.zip"
}

# Lambda function
resource "aws_lambda_function" "transaction_processor" {
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  function_name = var.lambda_function_name
  role          = aws_iam_role.lambda_role.arn
  handler       = "lambda_code.lambda_handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = 256

  environment {
    variables = {
      S3_BUCKET           = var.s3_bucket_name
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.transactions.name
      PROJECT_NAME        = var.project_name
      ENVIRONMENT         = var.environment
      LOG_LEVEL           = "INFO"
      SNS_TOPIC_ARN       = aws_sns_topic.transaction_alerts.arn
    }
  }
}

# API Gateway invoke permission
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transaction_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*/*/*"
}

# Data sources for permission
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# CloudWatch log group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.transaction_processor.function_name}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.lambda_log_key.arn
}

resource "aws_kms_key" "lambda_log_key" {
  description = "KMS key for Lambda logs encryption"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}
