output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.transaction_processor.function_name
}

output "lambda_invoke_arn" {
  description = "Invoke ARN of the Lambda function for API Gateway"
  value       = aws_lambda_function.transaction_processor.invoke_arn
}

output "lambda_function_arn" {
  value = aws_lambda_function.transaction_processor.arn
}
