#!/bin/bash

# Simple Layer-Only Deployment Script for Common Corpus
# This script creates a clean layer-only deployment without conflicts

set -e

echo "📦 Common Corpus Layer-Only Deployment"
echo ""

# Check if layer zip exists
if [ ! -f "../common-corpus-layer.zip" ]; then
    echo "❌ Layer zip not found. Building layer first..."
    cd ..
    ./scripts/build-lambda-layer.sh
    cd terraform
    echo "✅ Layer built successfully"
fi

# Clean up any existing layer-only deployment
if [ -d "layer-only" ]; then
    echo "🧹 Cleaning up existing layer-only deployment..."
    rm -rf layer-only
fi

echo "📁 Creating clean layer-only deployment..."

# Create layer-only directory
mkdir -p layer-only

# Copy versions.tf (provider configuration)
cp versions.tf layer-only/

# Copy the clean layer configuration (without variables)
cp layer-only-clean.tf layer-only/main.tf

# Create variables.tf
cat > layer-only/variables.tf << 'EOF'
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "layer_zip_path" {
  description = "Path to the Lambda layer zip file"
  type        = string
  default     = "../../common-corpus-layer.zip"
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 14
}

variable "create_log_groups" {
  description = "Create CloudWatch log groups for functions using this layer"
  type        = bool
  default     = false
}

variable "user_function_name_prefix" {
  description = "Prefix for user function log groups (only if create_log_groups is true)"
  type        = string
  default     = "my-corpus-function"
}
EOF

# Create terraform.tfvars
cat > layer-only/terraform.tfvars << EOF
# Layer-only deployment configuration
aws_region = "us-east-1"
environment = "dev"
layer_zip_path = "../../common-corpus-layer.zip"
log_retention_days = 14
create_log_groups = false
EOF

echo "✅ Configuration files created successfully"
echo ""

# Change to layer-only directory
cd layer-only

echo "📁 Working directory: $(pwd)"
echo ""

# Validate configuration
echo "🔍 Validating Terraform configuration..."
terraform init -upgrade
terraform validate

if [ $? -eq 0 ]; then
    echo "✅ Configuration is valid"
else
    echo "❌ Configuration validation failed"
    exit 1
fi

echo ""
read -p "Continue with deployment? (y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo ""
    echo "📋 Planning deployment..."
    terraform plan -out=tfplan
    
    echo ""
    echo "🚀 Applying changes..."
    terraform apply tfplan
    
    echo ""
    echo "✅ Layer-only deployment completed!"
    echo ""
    echo "📦 Layer Information:"
    echo "Layer ARN: $(terraform output -raw layer_arn)"
    echo "Layer Name: $(terraform output -raw layer_name)"
    echo "Layer Version: $(terraform output -raw layer_version)"
    echo ""
    echo "🔧 Usage in your Lambda functions:"
    echo "Terraform:"
    echo "  layers = [\"$(terraform output -raw layer_arn)\"]"
    echo ""
    echo "AWS CLI:"
    echo "  aws lambda update-function-configuration \\"
    echo "    --function-name YOUR_FUNCTION \\"
    echo "    --layers $(terraform output -raw layer_arn)"
    echo ""
    echo "JavaScript:"
    echo "  const Corpora = require('/opt/nodejs/node_modules/common-corpus');"
    echo ""
    echo "📊 View all outputs: terraform output"
    
else
    echo "❌ Deployment cancelled."
    echo "To deploy later:"
    echo "  cd layer-only/"
    echo "  terraform apply"
fi