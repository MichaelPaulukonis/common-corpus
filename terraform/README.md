# Terraform Infrastructure for Common Corpus

This directory contains Terraform configuration for deploying the Common Corpus library as AWS Lambda functions and layers.

## Architecture

The Terraform configuration creates:

- **Lambda Layer**: Pre-extracted Common Corpus texts
- **API Function**: REST API for text access and filtering
- **Batch Function**: Background processing for text analysis
- **API Gateway**: HTTP endpoints with CORS support
- **CloudWatch**: Logging and monitoring
- **IAM Roles**: Least-privilege execution permissions

## Quick Start

### 1. Prerequisites

```bash
# Install Terraform
brew install terraform  # macOS
# or download from https://terraform.io

# Install AWS CLI and configure credentials
aws configure

# Build the Lambda layer
cd ..
./scripts/build-lambda-layer.sh
cd terraform
```

### 2. Configure Variables

```bash
# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit variables for your environment
vim terraform.tfvars
```

### 3. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply changes
terraform apply
```

### 4. Test Deployment

```bash
# Get API URL from outputs
API_URL=$(terraform output -raw api_gateway_url)

# Test health endpoint
curl $API_URL/health

# List available texts
curl $API_URL/texts

# Get cyberpunk texts
curl $API_URL/texts/cyberpunk
```

## Configuration

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region for deployment | `us-east-1` |
| `environment` | Environment name (dev/staging/prod) | `dev` |
| `layer_zip_path` | Path to Lambda layer zip file | `../common-corpus-layer.zip` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `api_memory_size` | API function memory (MB) | `512` |
| `batch_memory_size` | Batch function memory (MB) | `1024` |
| `corpus_cache_size` | Number of texts to cache | `10` |
| `log_retention_days` | CloudWatch log retention | `14` |
| `enable_monitoring` | Enable CloudWatch alarms | `true` |

See [variables.tf](./variables.tf) for complete list.

### Environment-Specific Configuration

The configuration supports environment-specific overrides:

```hcl
# terraform.tfvars
environment = "prod"

# Automatically uses production settings:
# - Higher memory allocation
# - Longer log retention
# - Enhanced monitoring
```

## Deployment Environments

### Development
```bash
terraform workspace new dev
terraform apply -var="environment=dev"
```

**Characteristics:**
- Lower memory allocation (256MB API, 512MB batch)
- Shorter log retention (7 days)
- Monitoring disabled
- Cost-optimized

### Staging
```bash
terraform workspace new staging  
terraform apply -var="environment=staging"
```

**Characteristics:**
- Medium memory allocation (512MB API, 1024MB batch)
- Standard log retention (14 days)
- Basic monitoring enabled
- Production-like testing

### Production
```bash
terraform workspace new prod
terraform apply -var="environment=prod"
```

**Characteristics:**
- High memory allocation (1024MB API, 2048MB batch)
- Extended log retention (30 days)
- Full monitoring and alerting
- Performance optimized

## API Endpoints

After deployment, the following endpoints are available:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check and system status |
| `/texts` | GET | List all available texts |
| `/texts/{category}` | GET | Filter texts by category |
| `/text/{name}` | GET | Get specific text content |

### Example Usage

```bash
# Health check
curl https://api-id.execute-api.region.amazonaws.com/dev/health

# List texts with pagination
curl "https://api-id.execute-api.region.amazonaws.com/dev/texts?limit=10&offset=0"

# Get cyberpunk texts
curl https://api-id.execute-api.region.amazonaws.com/dev/texts/cyberpunk

# Get specific text with sentences
curl "https://api-id.execute-api.region.amazonaws.com/dev/text/neuromancer?sentences=true"
```

## Monitoring

### CloudWatch Metrics

The deployment automatically creates CloudWatch alarms for:

- **Error Rate**: Triggers when function errors exceed threshold
- **Duration**: Triggers when execution time is too high
- **Memory Usage**: Monitor memory consumption patterns

### Custom Metrics

Functions publish custom metrics to CloudWatch:

```javascript
// Example custom metrics
- CommonCorpus.RequestSuccess
- CommonCorpus.RequestError  
- CommonCorpus.RequestDuration
- CommonCorpus.TextAccess
- CommonCorpus.CacheHit
```

### Logging

Structured JSON logging is enabled:

```json
{
  "timestamp": "2023-09-19T10:30:00.000Z",
  "level": "INFO",
  "message": "Request completed",
  "requestId": "abc-123-def",
  "duration": 150,
  "statusCode": 200
}
```

## Cost Management

### Cost Optimization

The configuration includes several cost optimization features:

1. **Environment-based sizing**: Smaller resources for dev/staging
2. **Log retention limits**: Automatic log cleanup
3. **Reserved concurrency**: Optional limits on concurrent executions
4. **Provisioned concurrency**: Optional for consistent performance

### Cost Estimation

Use Terraform outputs to estimate costs:

```bash
terraform output cost_estimation
```

Example monthly costs (approximate):

| Environment | Requests/Month | Estimated Cost |
|-------------|----------------|----------------|
| Development | 10K | $2-5 |
| Staging | 100K | $15-25 |
| Production | 1M | $50-100 |

*Costs include Lambda execution, API Gateway, and CloudWatch logs*

## Security

### IAM Permissions

Functions use least-privilege IAM roles with permissions for:

- CloudWatch Logs (create/write)
- CloudWatch Metrics (publish)
- Lambda execution

### API Security

- **HTTPS Only**: All API endpoints use HTTPS
- **CORS Enabled**: Cross-origin requests supported
- **No Authentication**: Public API (add authentication as needed)

### Security Recommendations

For production deployments:

1. **Add API Authentication**: Use API Gateway authorizers
2. **Enable VPC**: Deploy functions in private subnets
3. **Enable X-Ray**: Add distributed tracing
4. **Rotate Credentials**: Regular IAM key rotation
5. **Monitor Access**: CloudTrail logging

## Troubleshooting

### Common Issues

#### Layer Size Too Large
```bash
# Check layer size
ls -lh ../common-corpus-layer.zip

# Reduce size by removing unnecessary files
./scripts/build-lambda-layer.sh
```

#### Function Timeout
```bash
# Increase timeout in terraform.tfvars
api_timeout = 60
batch_timeout = 600

terraform apply
```

#### Memory Errors
```bash
# Increase memory allocation
api_memory_size = 1024
batch_memory_size = 2048

terraform apply
```

#### Permission Errors
```bash
# Check IAM role permissions
aws iam get-role-policy --role-name common-corpus-dev-execution-role --policy-name common-corpus-dev-enhanced-policy
```

### Debugging

#### View Logs
```bash
# API function logs
aws logs tail /aws/lambda/common-corpus-dev-api --follow

# Batch function logs  
aws logs tail /aws/lambda/common-corpus-dev-batch --follow
```

#### Test Functions Directly
```bash
# Invoke API function
aws lambda invoke \
  --function-name common-corpus-dev-api \
  --payload '{"httpMethod":"GET","path":"/health"}' \
  response.json

# Invoke batch function
aws lambda invoke \
  --function-name common-corpus-dev-batch \
  --payload '{"operation":"analyzeTexts","parameters":{"category":"literature","limit":5}}' \
  response.json
```

#### Check Layer
```bash
# List layer versions
aws lambda list-layer-versions --layer-name common-corpus-layer-dev

# Get layer info
aws lambda get-layer-version \
  --layer-name common-corpus-layer-dev \
  --version-number 1
```

## Cleanup

### Destroy Infrastructure

```bash
# Destroy all resources
terraform destroy

# Destroy specific workspace
terraform workspace select dev
terraform destroy
```

### Manual Cleanup

Some resources may need manual cleanup:

```bash
# Delete CloudWatch log groups (if retention is set to never expire)
aws logs delete-log-group --log-group-name /aws/lambda/common-corpus-dev-api

# Delete layer versions (if needed)
aws lambda delete-layer-version --layer-name common-corpus-layer-dev --version-number 1
```

## Advanced Configuration

### Remote State

For team collaboration, configure remote state:

```hcl
# versions.tf
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "common-corpus/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

### Multi-Region Deployment

Deploy to multiple regions:

```bash
# Deploy to us-east-1
terraform apply -var="aws_region=us-east-1"

# Deploy to eu-west-1
terraform apply -var="aws_region=eu-west-1"
```

### Custom Domain

Add custom domain for API Gateway:

```hcl
# Add to main.tf
resource "aws_api_gateway_domain_name" "corpus_domain" {
  domain_name     = "corpus-api.yourdomain.com"
  certificate_arn = var.certificate_arn
}
```

## Support

For issues with the Terraform configuration:

1. Check [troubleshooting section](#troubleshooting)
2. Review [AWS Lambda documentation](https://docs.aws.amazon.com/lambda/)
3. Create an issue in the project repository
4. Consult [Terraform AWS provider docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)