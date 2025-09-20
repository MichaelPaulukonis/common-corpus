# Variables for Common Corpus Lambda Infrastructure

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "layer_zip_path" {
  description = "Path to the Lambda layer zip file"
  type        = string
  default     = "../common-corpus-layer.zip"
}

variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "nodejs18.x"
  
  validation {
    condition     = contains(["nodejs14.x", "nodejs16.x", "nodejs18.x", "nodejs20.x"], var.lambda_runtime)
    error_message = "Lambda runtime must be a supported Node.js version."
  }
}

# API Function Configuration
variable "api_memory_size" {
  description = "Memory size for API Lambda function (MB)"
  type        = number
  default     = 512
  
  validation {
    condition     = var.api_memory_size >= 128 && var.api_memory_size <= 10240
    error_message = "Memory size must be between 128 and 10240 MB."
  }
}

variable "api_timeout" {
  description = "Timeout for API Lambda function (seconds)"
  type        = number
  default     = 30
  
  validation {
    condition     = var.api_timeout >= 1 && var.api_timeout <= 900
    error_message = "Timeout must be between 1 and 900 seconds."
  }
}

# Batch Function Configuration
variable "batch_memory_size" {
  description = "Memory size for batch Lambda function (MB)"
  type        = number
  default     = 1024
  
  validation {
    condition     = var.batch_memory_size >= 128 && var.batch_memory_size <= 10240
    error_message = "Memory size must be between 128 and 10240 MB."
  }
}

variable "batch_timeout" {
  description = "Timeout for batch Lambda function (seconds)"
  type        = number
  default     = 300
  
  validation {
    condition     = var.batch_timeout >= 1 && var.batch_timeout <= 900
    error_message = "Timeout must be between 1 and 900 seconds."
  }
}

# Corpus Configuration
variable "corpus_cache_size" {
  description = "Number of texts to cache in memory for API function"
  type        = number
  default     = 10
  
  validation {
    condition     = var.corpus_cache_size >= 1 && var.corpus_cache_size <= 100
    error_message = "Cache size must be between 1 and 100."
  }
}

variable "batch_cache_size" {
  description = "Number of texts to cache in memory for batch function"
  type        = number
  default     = 20
  
  validation {
    condition     = var.batch_cache_size >= 1 && var.batch_cache_size <= 100
    error_message = "Cache size must be between 1 and 100."
  }
}

# Logging Configuration
variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 14
  
  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653
    ], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch retention period."
  }
}

variable "log_level" {
  description = "Log level for Lambda functions"
  type        = string
  default     = "INFO"
  
  validation {
    condition     = contains(["DEBUG", "INFO", "WARN", "ERROR"], var.log_level)
    error_message = "Log level must be one of: DEBUG, INFO, WARN, ERROR."
  }
}

# Monitoring Configuration
variable "enable_monitoring" {
  description = "Enable CloudWatch alarms and monitoring"
  type        = bool
  default     = true
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarms trigger"
  type        = list(string)
  default     = []
}

# Scheduled Processing
variable "enable_scheduled_analysis" {
  description = "Enable scheduled daily corpus analysis"
  type        = bool
  default     = false
}

# API Gateway Configuration
variable "api_gateway_stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = null  # Will use environment if not specified
}

variable "enable_api_gateway_logging" {
  description = "Enable API Gateway access logging"
  type        = bool
  default     = true
}

variable "api_throttle_rate_limit" {
  description = "API Gateway throttle rate limit (requests per second)"
  type        = number
  default     = 1000
}

variable "api_throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 2000
}

# Security Configuration
variable "enable_xray_tracing" {
  description = "Enable AWS X-Ray tracing for Lambda functions"
  type        = bool
  default     = false
}

variable "reserved_concurrent_executions" {
  description = "Reserved concurrent executions for Lambda functions (null for unreserved)"
  type        = number
  default     = null
}

# Cost Optimization
variable "provisioned_concurrency_config" {
  description = "Provisioned concurrency configuration for API function"
  type = object({
    provisioned_concurrent_executions = number
  })
  default = null
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# VPC Configuration (optional)
variable "vpc_config" {
  description = "VPC configuration for Lambda functions"
  type = object({
    subnet_ids         = list(string)
    security_group_ids = list(string)
  })
  default = null
}

# Dead Letter Queue Configuration
variable "enable_dlq" {
  description = "Enable Dead Letter Queue for failed Lambda invocations"
  type        = bool
  default     = false
}

variable "dlq_target_arn" {
  description = "ARN of SQS queue or SNS topic for Dead Letter Queue"
  type        = string
  default     = null
}

# Environment-specific configurations
variable "environment_configs" {
  description = "Environment-specific configuration overrides"
  type = map(object({
    api_memory_size    = optional(number)
    batch_memory_size  = optional(number)
    corpus_cache_size  = optional(number)
    log_retention_days = optional(number)
    enable_monitoring  = optional(bool)
  }))
  default = {
    dev = {
      api_memory_size    = 256
      batch_memory_size  = 512
      corpus_cache_size  = 5
      log_retention_days = 7
      enable_monitoring  = false
    }
    staging = {
      api_memory_size    = 512
      batch_memory_size  = 1024
      corpus_cache_size  = 10
      log_retention_days = 14
      enable_monitoring  = true
    }
    prod = {
      api_memory_size    = 1024
      batch_memory_size  = 2048
      corpus_cache_size  = 20
      log_retention_days = 30
      enable_monitoring  = true
    }
  }
}