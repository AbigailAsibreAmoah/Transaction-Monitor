# Data source for current AWS caller identity
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# REST API
resource "aws_api_gateway_rest_api" "transaction_api" {
  name        = "${var.project_name}-api-${var.environment}"
  description = "Transaction monitoring API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# ======================================================
# TRANSACTION ENDPOINT (Protected by Cognito)
# ======================================================
resource "aws_api_gateway_resource" "transaction_resource" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  parent_id   = aws_api_gateway_rest_api.transaction_api.root_resource_id
  path_part   = "transaction"
}

resource "aws_api_gateway_method" "transaction_post" {
  rest_api_id   = aws_api_gateway_rest_api.transaction_api.id
  resource_id   = aws_api_gateway_resource.transaction_resource.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_method" "transaction_options" {
  rest_api_id   = aws_api_gateway_rest_api.transaction_api.id
  resource_id   = aws_api_gateway_resource.transaction_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "transaction_integration" {
  rest_api_id             = aws_api_gateway_rest_api.transaction_api.id
  resource_id             = aws_api_gateway_resource.transaction_resource.id
  http_method             = aws_api_gateway_method.transaction_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

resource "aws_api_gateway_integration" "transaction_options_integration" {
  rest_api_id   = aws_api_gateway_rest_api.transaction_api.id
  resource_id   = aws_api_gateway_resource.transaction_resource.id
  http_method   = aws_api_gateway_method.transaction_options.http_method
  type          = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "transaction_post_response_200" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  resource_id = aws_api_gateway_resource.transaction_resource.id
  http_method = aws_api_gateway_method.transaction_post.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_method_response" "transaction_options_response_200" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  resource_id = aws_api_gateway_resource.transaction_resource.id
  http_method = aws_api_gateway_method.transaction_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "transaction_post_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  resource_id = aws_api_gateway_resource.transaction_resource.id
  http_method = aws_api_gateway_method.transaction_post.http_method
  status_code = aws_api_gateway_method_response.transaction_post_response_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'${var.cors_allowed_origin}'"
  }

  depends_on = [aws_api_gateway_integration.transaction_integration]
}

resource "aws_api_gateway_integration_response" "transaction_options_integration_response" {
  rest_api_id  = aws_api_gateway_rest_api.transaction_api.id
  resource_id  = aws_api_gateway_resource.transaction_resource.id
  http_method  = aws_api_gateway_method.transaction_options.http_method
  status_code  = aws_api_gateway_method_response.transaction_options_response_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'${var.cors_allowed_origin}'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }

  depends_on = [aws_api_gateway_integration.transaction_options_integration]
}

# ======================================================
# SIGNUP ENDPOINT (Public)
# ======================================================
resource "aws_api_gateway_resource" "signup_resource" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  parent_id   = aws_api_gateway_rest_api.transaction_api.root_resource_id
  path_part   = "signup"
}

resource "aws_api_gateway_method" "signup_post" {
  rest_api_id   = aws_api_gateway_rest_api.transaction_api.id
  resource_id   = aws_api_gateway_resource.signup_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "signup_options" {
  rest_api_id   = aws_api_gateway_rest_api.transaction_api.id
  resource_id   = aws_api_gateway_resource.signup_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "signup_integration" {
  rest_api_id             = aws_api_gateway_rest_api.transaction_api.id
  resource_id             = aws_api_gateway_resource.signup_resource.id
  http_method             = aws_api_gateway_method.signup_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

resource "aws_api_gateway_method_response" "signup_post_response_200" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  resource_id = aws_api_gateway_resource.signup_resource.id
  http_method = aws_api_gateway_method.signup_post.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "signup_post_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  resource_id = aws_api_gateway_resource.signup_resource.id
  http_method = aws_api_gateway_method.signup_post.http_method
  status_code = aws_api_gateway_method_response.signup_post_response_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'${var.cors_allowed_origin}'"
  }

  depends_on = [aws_api_gateway_integration.signup_integration]
}

resource "aws_api_gateway_integration" "signup_options_integration" {
  rest_api_id   = aws_api_gateway_rest_api.transaction_api.id
  resource_id   = aws_api_gateway_resource.signup_resource.id
  http_method   = aws_api_gateway_method.signup_options.http_method
  type          = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "signup_options_response_200" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  resource_id = aws_api_gateway_resource.signup_resource.id
  http_method = aws_api_gateway_method.signup_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "signup_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  resource_id = aws_api_gateway_resource.signup_resource.id
  http_method = aws_api_gateway_method.signup_options.http_method
  status_code = aws_api_gateway_method_response.signup_options_response_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'${var.cors_allowed_origin}'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }

  depends_on = [aws_api_gateway_integration.signup_options_integration]
}

# ======================================================
# LOGIN ENDPOINT (Public)
# ======================================================
resource "aws_api_gateway_resource" "login_resource" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  parent_id   = aws_api_gateway_rest_api.transaction_api.root_resource_id
  path_part   = "login"
}

resource "aws_api_gateway_method" "login_post" {
  rest_api_id   = aws_api_gateway_rest_api.transaction_api.id
  resource_id   = aws_api_gateway_resource.login_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "login_options" {
  rest_api_id   = aws_api_gateway_rest_api.transaction_api.id
  resource_id   = aws_api_gateway_resource.login_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "login_integration" {
  rest_api_id             = aws_api_gateway_rest_api.transaction_api.id
  resource_id             = aws_api_gateway_resource.login_resource.id
  http_method             = aws_api_gateway_method.login_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

resource "aws_api_gateway_method_response" "login_post_response_200" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  resource_id = aws_api_gateway_resource.login_resource.id
  http_method = aws_api_gateway_method.login_post.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "login_post_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  resource_id = aws_api_gateway_resource.login_resource.id
  http_method = aws_api_gateway_method.login_post.http_method
  status_code = aws_api_gateway_method_response.login_post_response_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'${var.cors_allowed_origin}'"
  }

  depends_on = [aws_api_gateway_integration.login_integration]
}

resource "aws_api_gateway_integration" "login_options_integration" {
  rest_api_id   = aws_api_gateway_rest_api.transaction_api.id
  resource_id   = aws_api_gateway_resource.login_resource.id
  http_method   = aws_api_gateway_method.login_options.http_method
  type          = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "login_options_response_200" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  resource_id = aws_api_gateway_resource.login_resource.id
  http_method = aws_api_gateway_method.login_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "login_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  resource_id = aws_api_gateway_resource.login_resource.id
  http_method = aws_api_gateway_method.login_options.http_method
  status_code = aws_api_gateway_method_response.login_options_response_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'${var.cors_allowed_origin}'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }

  depends_on = [aws_api_gateway_integration.login_options_integration]
}

# ======================================================
# Cognito Authorizer
# ======================================================
resource "aws_api_gateway_authorizer" "cognito_authorizer" {
  name            = "${var.project_name}-cognito-authorizer"
  rest_api_id     = aws_api_gateway_rest_api.transaction_api.id
  identity_source = "method.request.header.Authorization"
  type            = "COGNITO_USER_POOLS"
  provider_arns   = [aws_cognito_user_pool.user_pool.arn]
}

# ======================================================
# Deployment
# ======================================================
resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id

  depends_on = [
    aws_api_gateway_integration.transaction_integration,
    aws_api_gateway_integration.transaction_options_integration,
    aws_api_gateway_integration_response.transaction_post_integration_response,
    aws_api_gateway_integration_response.transaction_options_integration_response,
    aws_api_gateway_integration.transactions_integration,
    aws_api_gateway_integration.transactions_options_integration,
    aws_api_gateway_integration_response.transactions_get_integration_response,
    aws_api_gateway_integration_response.transactions_options_integration_response,
    aws_api_gateway_integration.signup_integration,
    aws_api_gateway_integration.signup_options_integration,
    aws_api_gateway_integration_response.signup_options_integration_response,
    aws_api_gateway_integration_response.signup_post_integration_response,
    aws_api_gateway_integration.login_integration,
    aws_api_gateway_integration.login_options_integration,
    aws_api_gateway_integration_response.login_options_integration_response,
    aws_api_gateway_integration_response.login_post_integration_response
  ]

  lifecycle {
    create_before_destroy = true
  }

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.transaction_resource.id,
      aws_api_gateway_method.transaction_post.id,
      aws_api_gateway_method.transaction_options.id,
      aws_api_gateway_integration.transaction_integration.id,
      aws_api_gateway_integration.transaction_options_integration.id,
      aws_api_gateway_integration_response.transaction_options_integration_response.id,
      aws_api_gateway_resource.signup_resource.id,
      aws_api_gateway_method.signup_post.id,
      aws_api_gateway_integration.signup_integration.id,
      aws_api_gateway_integration_response.signup_options_integration_response.id,
      aws_api_gateway_resource.login_resource.id,
      aws_api_gateway_method.login_post.id,
      aws_api_gateway_integration.login_integration.id,
      aws_api_gateway_integration_response.login_options_integration_response.id,
      var.cors_allowed_origin
    ]))
  }
}

# ======================================================
# Stage
# ======================================================
resource "aws_api_gateway_stage" "api_stage" {
  rest_api_id   = aws_api_gateway_rest_api.transaction_api.id
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  stage_name    = var.environment

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format          = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }
}

# ======================================================
# CloudWatch Logs
# ======================================================
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.log_key.arn
}

resource "aws_kms_key" "log_key" {
  description = "KMS key for API Gateway logs encryption"
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

resource "aws_kms_alias" "log_key_alias" {
  name          = "alias/${var.project_name}-${var.environment}-logs"
  target_key_id = aws_kms_key.log_key.key_id
}
