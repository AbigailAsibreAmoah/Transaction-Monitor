# Lambda execution role
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Attach basic Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Inline policy for S3 and Cognito access
resource "aws_iam_role_policy" "lambda_permissions" {
  name = "${var.project_name}-lambda-permissions-${var.environment}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${var.s3_bucket_arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:SignUp",
          "cognito-idp:InitiateAuth",
          "cognito-idp:AdminConfirmSignUp"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          aws_dynamodb_table.transactions.arn,
          "${aws_dynamodb_table.transactions.arn}/index/*",
          aws_dynamodb_table.csrf_tokens.arn,
          "${aws_dynamodb_table.csrf_tokens.arn}/index/*",
          "arn:aws:dynamodb:*:*:table/${var.project_name}-${var.environment}-user-profiles"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.transaction_alerts.arn
      }
    ]
  })
}
