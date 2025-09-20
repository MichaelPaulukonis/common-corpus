# Lambda Layer Only Configuration
# This file contains only the resources needed for the Common Corpus Lambda layer

# Local variables
locals {
  layer_name = "common-corpus-layer-${var.environment}"
  
  common_tags = {
    Project     = "common-corpus"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Lambda Layer for Common Corpus
resource "aws_lambda_layer_version" "common_corpus_layer" {
  filename                 = var.layer_zip_path
  layer_name              = local.layer_name
  description             = "Common Corpus text collection for NLP/NLG (${var.environment})"
  compatible_runtimes     = ["nodejs18.x", "nodejs16.x", "nodejs14.x", "nodejs20.x"]
  compatible_architectures = ["x86_64"]
  
  source_code_hash = filebase64sha256(var.layer_zip_path)

  lifecycle {
    create_before_destroy = true
  }
}

# Optional: CloudWatch Log Group for functions that use this layer
resource "aws_cloudwatch_log_group" "user_function_logs" {
  count = var.create_log_groups ? 1 : 0
  
  name              = "/aws/lambda/${var.user_function_name_prefix}"
  retention_in_days = var.log_retention_days
  
  tags = local.common_tags
}

# Variables are defined in variables.tf

# Outputs
output "layer_arn" {
  description = "ARN of the Common Corpus Lambda layer"
  value       = aws_lambda_layer_version.common_corpus_layer.arn
}

output "layer_version" {
  description = "Version of the Common Corpus Lambda layer"
  value       = aws_lambda_layer_version.common_corpus_layer.version
}

output "layer_name" {
  description = "Name of the Common Corpus Lambda layer"
  value       = aws_lambda_layer_version.common_corpus_layer.layer_name
}

output "usage_example" {
  description = "How to use this layer in your Lambda functions"
  value = {
    terraform_config = <<-EOT
      resource "aws_lambda_function" "my_function" {
        # ... other configuration ...
        layers = ["${aws_lambda_layer_version.common_corpus_layer.arn}"]
      }
    EOT
    
    javascript_usage = <<-EOT
      const Corpora = require('/opt/nodejs/node_modules/common-corpus');
      
      exports.handler = async (event) => {
          const corpus = new Corpora();
          const texts = corpus.filter('cyberpunk');
          return { texts: texts.map(t => t.name) };
      };
    EOT
    
    aws_cli_command = "aws lambda update-function-configuration --function-name YOUR_FUNCTION --layers ${aws_lambda_layer_version.common_corpus_layer.arn}"
  }
}