# ==============================
# Local values
# ==============================
locals {
  project_name = "transaction-monitor"
  environment  = "dev"
}

# ==============================
# Storage Module
# ==============================
module "storage" {
  source = "../../modules/storage"

  project_name = local.project_name
  environment  = local.environment
}

# ==============================
# API Gateway Module
# ==============================
module "api_gateway" {
  source               = "../../modules/api-gateway"
  project_name         = local.project_name
  environment          = local.environment
  lambda_invoke_arn    = module.lambda.lambda_invoke_arn
  lambda_function_name = module.lambda.lambda_function_name
  cors_allowed_origin  = "https://d1n1njxujlyqzf.cloudfront.net"
}

# ==============================
# Lambda Module
# ==============================
module "lambda" {
  source                      = "../../modules/lambda"
  project_name                = local.project_name
  environment                 = local.environment
  lambda_function_name        = "${local.project_name}-${local.environment}-function"
  s3_bucket_name              = module.storage.s3_bucket_name
  s3_bucket_arn               = module.storage.s3_bucket_arn
  dynamodb_table_name         = module.storage.transactions_table_name
  dynamodb_table_arn          = module.storage.transactions_table_arn
  user_profiles_table_name    = module.storage.user_profiles_table_name
  user_profiles_table_arn     = module.storage.user_profiles_table_arn
}
