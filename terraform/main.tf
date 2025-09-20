# Common Corpus Lambda Infrastructure
# Terraform configuration for deploying Common Corpus as AWS Lambda functions and layers

# Terraform configuration is defined in versions.tf

# Configure AWS Provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "common-corpus"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Local variables
locals {
  function_name = "common-corpus-${var.environment}"
  layer_name    = "common-corpus-layer-${var.environment}"
  
  common_tags = {
    Project     = "common-corpus"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Lambda execution role
resource "aws_iam_role" "lambda_execution_role" {
  name = "${local.function_name}-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Attach basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Additional IAM policy for enhanced logging and monitoring
resource "aws_iam_role_policy" "lambda_enhanced_policy" {
  name = "${local.function_name}-enhanced-policy"
  role = aws_iam_role.lambda_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda Layer for Common Corpus
resource "aws_lambda_layer_version" "common_corpus_layer" {
  filename                 = var.layer_zip_path
  layer_name              = local.layer_name
  description             = "Common Corpus text collection for NLP/NLG (${var.environment})"
  compatible_runtimes     = ["nodejs18.x", "nodejs16.x", "nodejs14.x"]
  compatible_architectures = ["x86_64"]
  
  source_code_hash = filebase64sha256(var.layer_zip_path)

  lifecycle {
    create_before_destroy = true
  }

  # Note: Lambda layers don't support tags
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/lambda/${local.function_name}-api"
  retention_in_days = var.log_retention_days
  
  tags = merge(local.common_tags, {
    Function = "api"
  })
}

resource "aws_cloudwatch_log_group" "batch_logs" {
  name              = "/aws/lambda/${local.function_name}-batch"
  retention_in_days = var.log_retention_days
  
  tags = merge(local.common_tags, {
    Function = "batch"
  })
}

# Lambda function package
data "archive_file" "lambda_function_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../examples"
  output_path = "${path.module}/lambda-function.zip"
  
  excludes = [
    "*.md",
    "test*",
    "*.test.js"
  ]
}

# Main API Lambda Function
resource "aws_lambda_function" "api_function" {
  filename         = data.archive_file.lambda_function_zip.output_path
  function_name    = "${local.function_name}-api"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "lambda-function.handler"
  runtime         = var.lambda_runtime
  memory_size     = var.api_memory_size
  timeout         = var.api_timeout
  
  source_code_hash = data.archive_file.lambda_function_zip.output_base64sha256
  
  layers = [aws_lambda_layer_version.common_corpus_layer.arn]
  
  environment {
    variables = {
      STAGE              = var.environment
      FUNCTION_TYPE      = "api"
      CORPUS_CACHE_SIZE  = var.corpus_cache_size
      LOG_LEVEL          = var.log_level
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.api_logs,
  ]

  tags = merge(local.common_tags, {
    Name     = "${local.function_name}-api"
    Function = "api"
  })
}

# Batch Processing Lambda Function
resource "aws_lambda_function" "batch_function" {
  filename         = data.archive_file.lambda_function_zip.output_path
  function_name    = "${local.function_name}-batch"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "lambda-function.batchHandler"
  runtime         = var.lambda_runtime
  memory_size     = var.batch_memory_size
  timeout         = var.batch_timeout
  
  source_code_hash = data.archive_file.lambda_function_zip.output_base64sha256
  
  layers = [aws_lambda_layer_version.common_corpus_layer.arn]
  
  environment {
    variables = {
      STAGE              = var.environment
      FUNCTION_TYPE      = "batch"
      CORPUS_CACHE_SIZE  = var.batch_cache_size
      LOG_LEVEL          = var.log_level
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.batch_logs,
  ]

  tags = merge(local.common_tags, {
    Name     = "${local.function_name}-batch"
    Function = "batch"
  })
}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "corpus_api" {
  name        = "${local.function_name}-api"
  description = "Common Corpus REST API (${var.environment})"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.function_name}-api"
    Type = "api-gateway"
  })
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "corpus_api_deployment" {
  depends_on = [
    aws_api_gateway_integration.proxy_integration,
    aws_api_gateway_integration.root_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.corpus_api.id
  stage_name  = var.environment

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Resource (proxy)
resource "aws_api_gateway_resource" "proxy_resource" {
  rest_api_id = aws_api_gateway_rest_api.corpus_api.id
  parent_id   = aws_api_gateway_rest_api.corpus_api.root_resource_id
  path_part   = "{proxy+}"
}

# API Gateway Method (proxy)
resource "aws_api_gateway_method" "proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.corpus_api.id
  resource_id   = aws_api_gateway_resource.proxy_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

# API Gateway Method (root)
resource "aws_api_gateway_method" "root_method" {
  rest_api_id   = aws_api_gateway_rest_api.corpus_api.id
  resource_id   = aws_api_gateway_rest_api.corpus_api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

# API Gateway Integration (proxy)
resource "aws_api_gateway_integration" "proxy_integration" {
  rest_api_id = aws_api_gateway_rest_api.corpus_api.id
  resource_id = aws_api_gateway_method.proxy_method.resource_id
  http_method = aws_api_gateway_method.proxy_method.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_function.invoke_arn
}

# API Gateway Integration (root)
resource "aws_api_gateway_integration" "root_integration" {
  rest_api_id = aws_api_gateway_rest_api.corpus_api.id
  resource_id = aws_api_gateway_method.root_method.resource_id
  http_method = aws_api_gateway_method.root_method.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_function.invoke_arn
}

# Lambda permission for API Gateway (proxy)
resource "aws_lambda_permission" "api_gateway_proxy" {
  statement_id  = "AllowExecutionFromAPIGatewayProxy"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.corpus_api.execution_arn}/*/*"
}

# Lambda permission for API Gateway (root)
resource "aws_lambda_permission" "api_gateway_root" {
  statement_id  = "AllowExecutionFromAPIGatewayRoot"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.corpus_api.execution_arn}/*/"
}

# CORS Configuration
resource "aws_api_gateway_method" "options_method" {
  rest_api_id   = aws_api_gateway_rest_api.corpus_api.id
  resource_id   = aws_api_gateway_resource.proxy_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id = aws_api_gateway_rest_api.corpus_api.id
  resource_id = aws_api_gateway_resource.proxy_resource.id
  http_method = aws_api_gateway_method.options_method.http_method
  type        = "MOCK"
  
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "options_response" {
  rest_api_id = aws_api_gateway_rest_api.corpus_api.id
  resource_id = aws_api_gateway_resource.proxy_resource.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.corpus_api.id
  resource_id = aws_api_gateway_resource.proxy_resource.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = aws_api_gateway_method_response.options_response.status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "api_function_errors" {
  count = var.enable_monitoring ? 1 : 0
  
  alarm_name          = "${local.function_name}-api-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors lambda errors"
  alarm_actions       = var.alarm_actions

  dimensions = {
    FunctionName = aws_lambda_function.api_function.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "api_function_duration" {
  count = var.enable_monitoring ? 1 : 0
  
  alarm_name          = "${local.function_name}-api-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000"  # 10 seconds
  alarm_description   = "This metric monitors lambda duration"
  alarm_actions       = var.alarm_actions

  dimensions = {
    FunctionName = aws_lambda_function.api_function.function_name
  }

  tags = local.common_tags
}

# EventBridge rule for scheduled batch processing (optional)
resource "aws_cloudwatch_event_rule" "daily_analysis" {
  count = var.enable_scheduled_analysis ? 1 : 0
  
  name                = "${local.function_name}-daily-analysis"
  description         = "Trigger daily corpus analysis"
  schedule_expression = "rate(1 day)"

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "batch_function_target" {
  count = var.enable_scheduled_analysis ? 1 : 0
  
  rule      = aws_cloudwatch_event_rule.daily_analysis[0].name
  target_id = "BatchFunctionTarget"
  arn       = aws_lambda_function.batch_function.arn
  
  input = jsonencode({
    operation = "analyzeTexts"
    parameters = {
      category = "literature"
      limit    = 20
    }
  })
}

resource "aws_lambda_permission" "allow_eventbridge" {
  count = var.enable_scheduled_analysis ? 1 : 0
  
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.batch_function.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_analysis[0].arn
}