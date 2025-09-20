# Lambda Deployment Guide

This guide provides step-by-step instructions for deploying Common Corpus as AWS Lambda functions and layers.

## Quick Start

### 1. Build the Lambda Layer

```bash
# Make the build script executable
chmod +x scripts/build-lambda-layer.sh

# Build the layer
./scripts/build-lambda-layer.sh

# Or build and deploy in one step
./scripts/build-lambda-layer.sh deploy
```

### 2. Deploy with Terraform

```bash
# Initialize and deploy infrastructure
cd terraform/
terraform init
terraform plan
terraform apply

# Test the deployment
API_URL=$(terraform output -raw api_gateway_url)
curl $API_URL/health
```

### 3. Use in Your Lambda Function

```javascript
const Corpora = require("/opt/nodejs/node_modules/common-corpus");

exports.handler = async (event) => {
  const corpus = new Corpora();
  const texts = corpus.filter("cyberpunk");

  return {
    statusCode: 200,
    body: JSON.stringify({
      count: texts.length,
      texts: texts.map((t) => t.name),
    }),
  };
};
```

## Detailed Setup

### Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 14+ installed
- Sufficient AWS Lambda quotas
- `unzip` and optionally `7z` command-line tools

### AWS Permissions Required

Your AWS user/role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:PublishLayerVersion",
        "lambda:GetLayerVersion",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PassRole",
        "apigateway:*",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

## Layer Deployment Options

### Option 1: Manual Layer Creation

```bash
# Build the layer
./scripts/build-lambda-layer.sh

# Upload via AWS CLI
aws lambda publish-layer-version \
    --layer-name common-corpus \
    --description "Common Corpus text collection" \
    --zip-file fileb://common-corpus-layer.zip \
    --compatible-runtimes nodejs14.x nodejs16.x nodejs18.x

# Note the returned LayerVersionArn
```

### Option 2: Automated Deployment

```bash
# Build and deploy in one step
./scripts/build-lambda-layer.sh deploy
```

### Option 3: Terraform Infrastructure

```hcl
# terraform/main.tf
resource "aws_lambda_layer_version" "common_corpus_layer" {
  filename                 = var.layer_zip_path
  layer_name              = "common-corpus-layer-${var.environment}"
  description             = "Common Corpus text collection"
  compatible_runtimes     = ["nodejs18.x", "nodejs16.x", "nodejs14.x"]
}
```

## Function Deployment

### Basic Function Setup

```javascript
// handler.js
const Corpora = require("/opt/nodejs/node_modules/common-corpus");

let corpus; // Reuse across warm invocations

exports.handler = async (event, context) => {
  // Initialize on cold start
  if (!corpus) {
    console.log("Cold start: initializing corpus...");
    corpus = new Corpora({
      maxCacheSize: 5, // Limit memory usage
    });
    console.log(`Initialized with ${corpus.texts.length} texts`);
  }

  // Your logic here
  const category = event.pathParameters?.category;
  const texts = category ? corpus.filter(category) : corpus.texts;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      category: category || "all",
      count: texts.length,
      texts: texts.slice(0, 10).map((t) => ({ name: t.name })),
    }),
  };
};
```

### Function Configuration

```bash
# Create function with layer
aws lambda create-function \
    --function-name common-corpus-api \
    --runtime nodejs18.x \
    --role arn:aws:iam::ACCOUNT:role/lambda-execution-role \
    --handler handler.handler \
    --zip-file fileb://function.zip \
    --layers arn:aws:lambda:REGION:ACCOUNT:layer:common-corpus:VERSION \
    --memory-size 512 \
    --timeout 30
```

## Performance Optimization

### Memory Configuration

Choose memory based on your usage:

- **256MB**: Basic text listing and filtering
- **512MB**: Single text processing with sentences
- **1024MB**: Batch processing multiple texts
- **1536MB+**: Heavy NLP processing or large text analysis

### Cold Start Optimization

```javascript
// Optimize for cold starts
const Corpora = require("/opt/nodejs/node_modules/common-corpus");

// Pre-initialize during module load (outside handler)
const corpus = new Corpora({
  maxCacheSize: 3, // Conservative cache size
  preloadCategories: ["cyberpunk", "literature"], // Custom option
});

exports.handler = async (event) => {
  // Corpus already initialized
  const startTime = Date.now();
  const result = processRequest(event);
  console.log(`Request processed in ${Date.now() - startTime}ms`);
  return result;
};
```

### Caching Strategy

```javascript
// Implement intelligent caching
class SmartCorpora extends Corpora {
  constructor(options = {}) {
    super(options);
    this.accessCount = new Map();
    this.lastAccess = new Map();
  }

  getText(name) {
    // Track access patterns
    this.accessCount.set(name, (this.accessCount.get(name) || 0) + 1);
    this.lastAccess.set(name, Date.now());

    return super.getText(name);
  }

  // Evict least recently used texts
  evictLRU() {
    if (this.textCache.size < this.maxCacheSize) return;

    let oldestTime = Date.now();
    let oldestKey = null;

    for (const [key, time] of this.lastAccess) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.textCache.delete(oldestKey);
      this.lastAccess.delete(oldestKey);
    }
  }
}
```

## Monitoring and Debugging

### CloudWatch Metrics

Monitor these key metrics:

- **Duration**: Function execution time
- **Memory Usage**: Peak memory consumption
- **Cold Starts**: Initialization frequency
- **Errors**: Failed invocations
- **Throttles**: Concurrent execution limits

### Custom Metrics

```javascript
// Add custom metrics
const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch();

async function putMetric(metricName, value, unit = "Count") {
  const params = {
    Namespace: "CommonCorpus",
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
      },
    ],
  };

  try {
    await cloudwatch.putMetricData(params).promise();
  } catch (error) {
    console.error("Failed to put metric:", error);
  }
}

// Usage in handler
exports.handler = async (event) => {
  const startTime = Date.now();

  try {
    const result = await processRequest(event);
    await putMetric("RequestSuccess", 1);
    return result;
  } catch (error) {
    await putMetric("RequestError", 1);
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    await putMetric("RequestDuration", duration, "Milliseconds");
  }
};
```

### Logging Best Practices

```javascript
// Structured logging
const log = (level, message, data = {}) => {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: context.awsRequestId,
      ...data,
    })
  );
};

exports.handler = async (event, context) => {
  log("INFO", "Request started", {
    path: event.path,
    method: event.httpMethod,
  });

  try {
    const result = await processRequest(event);
    log("INFO", "Request completed", {
      statusCode: result.statusCode,
    });
    return result;
  } catch (error) {
    log("ERROR", "Request failed", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
```

## Troubleshooting

### Common Issues

#### Layer Size Exceeded

```bash
# Check layer contents
unzip -l common-corpus-layer.zip | head -20

# Remove unnecessary files
find lambda-layer -name "*.md" -delete
find lambda-layer -name "test*" -type d -exec rm -rf {} +
```

#### Memory Errors

```javascript
// Monitor memory usage
const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
  };
};

// Log memory usage
console.log("Memory usage:", getMemoryUsage());
```

#### Cold Start Performance

```javascript
// Measure initialization time
const initStart = Date.now();
const corpus = new Corpora();
const initTime = Date.now() - initStart;
console.log(`Corpus initialized in ${initTime}ms`);

// Optimize by reducing initial scan
const corpus = new Corpora({
  lazyInit: true, // Don't scan all files immediately
  categories: ["cyberpunk", "literature"], // Only load specific categories
});
```

#### File Not Found Errors

```bash
# Verify layer structure
aws lambda get-layer-version \
    --layer-name common-corpus \
    --version-number 1 \
    --query 'Content.Location' \
    --output text | xargs curl -o layer-check.zip

unzip -l layer-check.zip | grep corpus-extracted
```

### Debug Mode

```javascript
// Enable debug logging
const corpus = new Corpora({
  debug: true,
  logLevel: "DEBUG",
});

// Custom debug function
const debug = (message, data) => {
  if (process.env.DEBUG === "true") {
    console.log(`[DEBUG] ${message}`, data);
  }
};
```

## Cost Optimization

### Request-Based Pricing

- **Invocations**: $0.20 per 1M requests
- **Duration**: $0.0000166667 per GB-second
- **Layer Storage**: No additional cost

### Optimization Strategies

1. **Right-size Memory**: Use minimum memory needed
2. **Optimize Cold Starts**: Pre-initialize where possible
3. **Use Provisioned Concurrency**: For consistent performance
4. **Implement Caching**: Reduce processing time

### Cost Monitoring

```javascript
// Track cost-relevant metrics
const trackCosts = (event, context) => {
  const memoryMB = context.memoryLimitInMB;
  const durationMs = context.getRemainingTimeInMillis();
  const gbSeconds = (memoryMB / 1024) * (durationMs / 1000);

  console.log(
    `Cost metrics: ${memoryMB}MB, ${durationMs}ms, ${gbSeconds} GB-seconds`
  );
};
```

## Production Checklist

- [ ] Layer size under 250MB
- [ ] Function memory appropriately sized
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Cost analysis performed
- [ ] Backup and recovery plan
- [ ] Documentation updated

## Next Steps

1. **Test thoroughly** with your specific use cases
2. **Monitor performance** in production
3. **Optimize based on usage patterns**
4. **Consider S3-based approach** for very large corpora
5. **Implement caching layers** for frequently accessed texts

For more advanced deployment patterns, see the [Advanced Lambda Patterns](./lambda-advanced-patterns.md) guide.

## Terraform Infrastructure Deployment

### Complete Infrastructure as Code

The project includes comprehensive Terraform configuration for production-ready deployment:

```bash
# Navigate to Terraform directory
cd terraform/

# Configure variables for your environment
cp terraform.tfvars.example terraform.tfvars
vim terraform.tfvars

# Initialize Terraform
terraform init

# Plan deployment (review changes)
terraform plan

# Deploy infrastructure
terraform apply
```

### Terraform Configuration Features

- **Multi-environment support**: Separate dev, staging, prod configurations
- **Auto-scaling resources**: Environment-specific memory and timeout settings
- **Built-in monitoring**: CloudWatch alarms and structured logging
- **Security best practices**: IAM roles with least-privilege access
- **Cost optimization**: Environment-based resource allocation
- **API Gateway integration**: Complete REST API with CORS support

### Environment-Specific Deployment

```bash
# Development environment
terraform apply -var="environment=dev"

# Staging environment
terraform apply -var="environment=staging"

# Production environment
terraform apply -var="environment=prod"
```

### Key Terraform Resources Created

- **Lambda Layer**: Pre-extracted corpus texts (no runtime extraction)
- **Lambda Functions**: API and batch processing functions
- **API Gateway**: REST API with proper CORS configuration
- **IAM Roles**: Secure execution permissions
- **CloudWatch**: Log groups and monitoring alarms
- **EventBridge**: Optional scheduled corpus analysis

### Configuration Example

```hcl
# terraform.tfvars
environment = "prod"
aws_region = "us-east-1"

# Function sizing
api_memory_size = 1024
batch_memory_size = 2048
corpus_cache_size = 20

# Monitoring
enable_monitoring = true
log_retention_days = 30

# Security
enable_xray_tracing = true
```

### Deployment Outputs

After successful deployment, Terraform provides:

```bash
# Get API URL
terraform output api_gateway_url

# Get function names
terraform output api_function_name
terraform output batch_function_name

# Get layer information
terraform output layer_arn
```

## Recommended Deployment Strategy

For Lambda deployment with Common Corpus, the **Terraform + Pre-Extracted Layer** approach is recommended because:

### 1. **Infrastructure as Code Benefits**

- Reproducible deployments across environments
- Version-controlled infrastructure changes
- Easy rollback and disaster recovery
- Team collaboration on infrastructure

### 2. **Lambda Optimization**

- Pre-extracted texts eliminate cold start delays
- No runtime zip extraction or file system writes
- Memory-efficient caching with configurable limits
- Environment-specific resource sizing

### 3. **Production Readiness**

- Built-in monitoring and alerting
- Structured logging for debugging
- Security best practices implemented
- Cost optimization features

### 4. **Operational Excellence**

- Multi-environment support (dev/staging/prod)
- Automated deployment pipelines ready
- Comprehensive documentation and examples
- Easy maintenance and updates

## Next Steps

1. **Review the complete Terraform configuration** in `/terraform` directory
2. **Examine the Lambda-optimized implementation** in `lambda-index.js`
3. **Test with the provided example function** in `/examples`
4. **Customize for your specific use case** using the configuration variables
5. **Set up monitoring and alerting** using the built-in CloudWatch integration

For detailed Terraform usage, see the [Terraform README](../terraform/README.md).
