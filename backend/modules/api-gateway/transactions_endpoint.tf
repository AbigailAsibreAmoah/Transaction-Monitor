# ======================================================
# TRANSACTIONS ENDPOINT (GET - Protected by Cognito)
# ======================================================
resource "aws_api_gateway_resource" "transactions_resource" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  parent_id   = aws_api_gateway_rest_api.transaction_api.root_resource_id
  path_part   = "transactions"
}

resource "aws_api_gateway_method" "transactions_get" {
  rest_api_id   = aws_api_gateway_rest_api.transaction_api.id
  resource_id   = aws_api_gateway_resource.transactions_resource.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_method" "transactions_options" {
  rest_api_id   = aws_api_gateway_rest_api.transaction_api.id
  resource_id   = aws_api_gateway_resource.transactions_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "transactions_integration" {
  rest_api_id             = aws_api_gateway_rest_api.transaction_api.id
  resource_id             = aws_api_gateway_resource.transactions_resource.id
  http_method             = aws_api_gateway_method.transactions_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

resource "aws_api_gateway_integration" "transactions_options_integration" {
  rest_api_id   = aws_api_gateway_rest_api.transaction_api.id
  resource_id   = aws_api_gateway_resource.transactions_resource.id
  http_method   = aws_api_gateway_method.transactions_options.http_method
  type          = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "transactions_get_response_200" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  resource_id = aws_api_gateway_resource.transactions_resource.id
  http_method = aws_api_gateway_method.transactions_get.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_method_response" "transactions_options_response_200" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  resource_id = aws_api_gateway_resource.transactions_resource.id
  http_method = aws_api_gateway_method.transactions_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "transactions_get_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.transaction_api.id
  resource_id = aws_api_gateway_resource.transactions_resource.id
  http_method = aws_api_gateway_method.transactions_get.http_method
  status_code = aws_api_gateway_method_response.transactions_get_response_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'${var.cors_allowed_origin}'"
  }

  depends_on = [aws_api_gateway_integration.transactions_integration]
}

resource "aws_api_gateway_integration_response" "transactions_options_integration_response" {
  rest_api_id  = aws_api_gateway_rest_api.transaction_api.id
  resource_id  = aws_api_gateway_resource.transactions_resource.id
  http_method  = aws_api_gateway_method.transactions_options.http_method
  status_code  = aws_api_gateway_method_response.transactions_options_response_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'${var.cors_allowed_origin}'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }

  depends_on = [aws_api_gateway_integration.transactions_options_integration]
}