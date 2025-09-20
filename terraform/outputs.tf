# Outputs for Common Corpus Lambda Infrastructure

# API Gateway Outputs
output "api_gateway_url" {
  description = "Base URL for API Gateway stage"
  value       = "https://${aws_api_gateway_rest_api.corpus_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${var.environment}"
}

output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.corpus_api.id
}

output "api_gateway_stage" {
  description = "API Gateway stage name"
  value       = var.environment
}

# Lambda Function Outputs
output "api_function_name" {
  description = "Name of the API Lambda function"
  value       = aws_lambda_function.api_function.function_name
}

output "api_function_arn" {
  description = "ARN of the API Lambda function"
  value       = aws_lambda_function.api_function.arn
}

output "batch_function_name" {
  description = "Name of the batch Lambda function"
  value       = aws_lambda_function.batch_function.function_name
}

output "batch_function_arn" {
  description = "ARN of the batch Lambda function"
  value       = aws_lambda_function.batch_function.arn
}

# Lambda Layer Outputs
output "layer_arn" {
  description = "ARN of the Common Corpus Lambda layer"
  value       = aws_lambda_layer_version.common_corpus_layer.arn
}

output "layer_version" {
  description = "Version of the Common Corpus Lambda layer"
  value       = aws_lambda_layer_version.common_corpus_layer.version
}

# IAM Outputs
output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution_role.arn
}

output "lambda_execution_role_name" {
  description = "Name of the Lambda execution role"
  value       = aws_iam_role.lambda_execution_role.name
}

# CloudWatch Outputs
output "api_log_group_name" {
  description = "Name of the API function CloudWatch log group"
  value       = aws_cloudwatch_log_group.api_logs.name
}

output "batch_log_group_name" {
  description = "Name of the batch function CloudWatch log group"
  value       = aws_cloudwatch_log_group.batch_logs.name
}

# Monitoring Outputs
output "cloudwatch_alarms" {
  description = "CloudWatch alarm names (if monitoring enabled)"
  value = var.enable_monitoring ? {
    api_errors   = aws_cloudwatch_metric_alarm.api_function_errors[0].alarm_name
    api_duration = aws_cloudwatch_metric_alarm.api_function_duration[0].alarm_name
  } : {}
}

# Scheduled Analysis Outputs
output "scheduled_analysis_rule" {
  description = "EventBridge rule for scheduled analysis (if enabled)"
  value       = var.enable_scheduled_analysis ? aws_cloudwatch_event_rule.daily_analysis[0].name : null
}

# Deployment Information
output "deployment_info" {
  description = "Deployment information and useful commands"
  value = {
    environment = var.environment
    region      = data.aws_region.current.name
    account_id  = data.aws_caller_identity.current.account_id
    
    # Useful AWS CLI commands
    test_commands = {
      health_check = "curl ${local.api_url}/health"
      list_texts   = "curl ${local.api_url}/texts"
      get_cyberpunk = "curl ${local.api_url}/texts/cyberpunk"
    }
    
    # Lambda invocation commands
    lambda_commands = {
      invoke_api = "aws lambda invoke --function-name ${aws_lambda_function.api_function.function_name} --payload '{}' response.json"
      invoke_batch = "aws lambda invoke --function-name ${aws_lambda_function.batch_function.function_name} --payload '{\"operation\":\"analyzeTexts\",\"parameters\":{\"category\":\"literature\",\"limit\":5}}' response.json"
    }
  }
}

# Resource Summary
output "resource_summary" {
  description = "Summary of created resources"
  value = {
    lambda_functions = {
      api   = aws_lambda_function.api_function.function_name
      batch = aws_lambda_function.batch_function.function_name
    }
    
    layer = {
      name    = aws_lambda_layer_version.common_corpus_layer.layer_name
      version = aws_lambda_layer_version.common_corpus_layer.version
      arn     = aws_lambda_layer_version.common_corpus_layer.arn
    }
    
    api_gateway = {
      id   = aws_api_gateway_rest_api.corpus_api.id
      url  = local.api_url
      name = aws_api_gateway_rest_api.corpus_api.name
    }
    
    monitoring = {
      enabled    = var.enable_monitoring
      log_groups = [
        aws_cloudwatch_log_group.api_logs.name,
        aws_cloudwatch_log_group.batch_logs.name
      ]
      alarms_count = var.enable_monitoring ? 2 : 0
    }
  }
}

# Cost Estimation Information
output "cost_estimation" {
  description = "Cost estimation information"
  value = {
    lambda_pricing = {
      api_function = {
        memory_mb = aws_lambda_function.api_function.memory_size
        timeout_s = aws_lambda_function.api_function.timeout
        estimated_gb_seconds_per_invocation = (aws_lambda_function.api_function.memory_size / 1024) * (aws_lambda_function.api_function.timeout / 1000)
      }
      batch_function = {
        memory_mb = aws_lambda_function.batch_function.memory_size
        timeout_s = aws_lambda_function.batch_function.timeout
        estimated_gb_seconds_per_invocation = (aws_lambda_function.batch_function.memory_size / 1024) * (aws_lambda_function.batch_function.timeout / 1000)
      }
    }
    
    notes = [
      "Lambda pricing: $0.20 per 1M requests + $0.0000166667 per GB-second",
      "API Gateway pricing: $3.50 per million API calls",
      "CloudWatch Logs pricing: $0.50 per GB ingested",
      "Actual costs depend on usage patterns and request volume"
    ]
  }
}

# Security Information
output "security_info" {
  description = "Security-related information"
  value = {
    iam_role = aws_iam_role.lambda_execution_role.arn
    
    permissions = [
      "Basic Lambda execution (CloudWatch Logs)",
      "Enhanced logging and monitoring",
      "CloudWatch metrics publishing"
    ]
    
    api_security = {
      cors_enabled = true
      authorization = "None (public API)"
      https_only = true
    }
    
    recommendations = [
      "Consider adding API authentication for production",
      "Review IAM permissions regularly",
      "Enable AWS X-Ray tracing for debugging",
      "Consider VPC deployment for enhanced security"
    ]
  }
}

# Local values for computed outputs
locals {
  api_url = "https://${aws_api_gateway_rest_api.corpus_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${var.environment}"
}