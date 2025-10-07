# SNS Topic for Transaction Alerts
resource "aws_sns_topic" "transaction_alerts" {
  name = "${var.project_name}-${var.environment}-alerts"
}

# Email Subscription (replace with your email)
resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = aws_sns_topic.transaction_alerts.arn
  protocol  = "email"
  endpoint  = "amoahamoah23@gmail.com"
}

# Output SNS Topic ARN
output "sns_topic_arn" {
  value = aws_sns_topic.transaction_alerts.arn
}