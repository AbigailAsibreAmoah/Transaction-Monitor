terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "transaction-monitoring"
      Environment = var.environment
      Owner       = "fintech-demo"
      CostCenter  = "learning"
    }
  }
}