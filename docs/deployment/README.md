# Deployment Guide

This guide covers how to deploy and distribute the Common Corpus library, including NPM publishing, CI/CD setup, and integration considerations.

## Table of Contents

- [NPM Package Deployment](#npm-package-deployment)
- [GitHub Package Registry](#github-package-registry)
- [Continuous Integration](#continuous-integration)
- [Release Process](#release-process)
- [Distribution Strategies](#distribution-strategies)
- [Integration Patterns](#integration-patterns)
- [Performance Considerations](#performance-considerations)
- [Monitoring and Analytics](#monitoring-and-analytics)

## NPM Package Deployment

### Current Status

The library is currently distributed via GitHub repository installation:

```bash
npm install github:michaelpaulukonis/common-corpus
```

### NPM Registry Publishing (Planned)

#### Prerequisites

```bash
# Ensure you have NPM account and are logged in
npm login

# Verify package configuration
npm run test
npm run lint
npm pack --dry-run
```

#### Publishing Process

```bash
# 1. Update version
npm version patch|minor|major

# 2. Build and test
npm run build
npm test

# 3. Publish to NPM
npm publish

# 4. Create GitHub release
git push --tags
```

#### Package Configuration

```json
{
  "name": "common-corpus",
  "version": "0.1.0",
  "description": "Common texts for NLG/NLP projects",
  "main": "index.js",
  "files": ["index.js", "util.js", "lib/", "corpus/", "README.md", "LICENSE"],
  "publishConfig": {
    "access": "public"
  }
}
```

### Size Optimization

The corpus is large (~75MB), requiring optimization strategies:

#### Compression Strategy

```bash
# Create compressed distribution
npm run build:compress

# Selective corpus inclusion
npm run build:minimal  # Core texts only
npm run build:full     # Complete corpus
```

#### Alternative Distribution

```json
{
  "scripts": {
    "postinstall": "node scripts/download-corpus.js"
  }
}
```

## GitHub Package Registry

### Alternative Distribution Channel

```bash
# Configure for GitHub Packages
npm config set @michaelpaulukonis:registry https://npm.pkg.github.com

# Install from GitHub Packages
npm install @michaelpaulukonis/common-corpus
```

### GitHub Actions Workflow

```yaml
# .github/workflows/publish.yml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  publish-npm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "16"
          registry-url: "https://registry.npmjs.org"
      - run: npm ci
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  publish-gpr:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "16"
          registry-url: "https://npm.pkg.github.com"
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Continuous Integration

### GitHub Actions Setup

#### Test Workflow

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        node-version: [14, 16, 18]
        os: [ubuntu-latest, windows-latest, macos-latest]

    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
      - run: npm run lint
```

#### Coverage Reporting

```yaml
- name: Generate coverage report
  run: npm run coverage
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Quality Gates

```yaml
- name: Check test coverage
  run: |
    COVERAGE=$(npm run coverage:check)
    if [ $COVERAGE -lt 80 ]; then
      echo "Coverage below 80%"
      exit 1
    fi

- name: Security audit
  run: npm audit --audit-level moderate

- name: Check bundle size
  run: |
    SIZE=$(npm pack --dry-run | grep "package size" | awk '{print $3}')
    if [ $SIZE -gt 100000000 ]; then  # 100MB limit
      echo "Package too large: $SIZE bytes"
      exit 1
    fi
```

## Release Process

### Semantic Versioning

Following [SemVer](https://semver.org/) principles:

- **PATCH** (0.1.1): Bug fixes, documentation updates
- **MINOR** (0.2.0): New features, corpus additions
- **MAJOR** (1.0.0): Breaking API changes

### Release Checklist

#### Pre-Release

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Security audit clean
- [ ] Performance benchmarks acceptable

#### Release

```bash
# 1. Create release branch
git checkout -b release/v0.2.0

# 2. Update version and changelog
npm version minor
vim CHANGELOG.md

# 3. Final testing
npm test
npm run lint
npm audit

# 4. Merge to main
git checkout main
git merge release/v0.2.0

# 5. Tag and push
git tag v0.2.0
git push origin main --tags

# 6. Create GitHub release
gh release create v0.2.0 --generate-notes

# 7. Publish to NPM
npm publish
```

#### Post-Release

- [ ] Verify NPM package
- [ ] Update documentation site
- [ ] Announce release
- [ ] Monitor for issues

### Automated Release

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "16"
          registry-url: "https://registry.npmjs.org"

      - run: npm ci
      - run: npm test
      - run: npm run build

      - name: Publish to NPM
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
```

## Distribution Strategies

### Full Package Distribution

**Pros:**

- Complete offline functionality
- No additional downloads required
- Consistent performance

**Cons:**

- Large package size (~75MB)
- Slow installation
- Storage overhead

### On-Demand Download

```javascript
// scripts/download-corpus.js
const https = require("https");
const fs = require("fs");
const path = require("path");

async function downloadCorpus() {
  const corpusUrl =
    "https://github.com/michaelpaulukonis/common-corpus/releases/download/v0.1.0/corpus.zip";
  const corpusPath = path.join(__dirname, "../corpus.zip");

  if (!fs.existsSync(corpusPath)) {
    console.log("Downloading corpus...");
    await downloadFile(corpusUrl, corpusPath);
    await extractCorpus(corpusPath);
    console.log("Corpus ready!");
  }
}

if (require.main === module) {
  downloadCorpus().catch(console.error);
}
```

### Selective Installation

```json
{
  "scripts": {
    "install:minimal": "node scripts/install-corpus.js --minimal",
    "install:full": "node scripts/install-corpus.js --full",
    "install:category": "node scripts/install-corpus.js --category"
  }
}
```

### CDN Distribution

```javascript
// Alternative: CDN-based corpus access
class RemoteCorpora {
  constructor(baseUrl = "https://cdn.example.com/common-corpus/") {
    this.baseUrl = baseUrl;
    this.cache = new Map();
  }

  async getText(name) {
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    const response = await fetch(`${this.baseUrl}${name}.txt`);
    const text = await response.text();
    this.cache.set(name, text);
    return text;
  }
}
```

## Integration Patterns

### Node.js Applications

```javascript
// Standard integration
const Corpora = require("common-corpus");
const corpus = new Corpora();

// Express.js API
app.get("/api/texts/:category", (req, res) => {
  const texts = corpus.filter(req.params.category);
  res.json(texts.map((t) => ({ name: t.name })));
});

app.get("/api/text/:name", (req, res) => {
  const text = corpus.filter(req.params.name)[0];
  if (!text) {
    return res.status(404).json({ error: "Text not found" });
  }
  res.json({ content: text.text() });
});
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: "3.8"
services:
  corpus-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - corpus-data:/app/corpus
    restart: unless-stopped

volumes:
  corpus-data:
```

### Serverless Deployment

```javascript
// AWS Lambda function
exports.handler = async (event) => {
  const Corpora = require("common-corpus");
  const corpus = new Corpora();

  const category = event.pathParameters?.category;
  const texts = corpus.filter(category || ".*");

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      category,
      count: texts.length,
      texts: texts.map((t) => t.name),
    }),
  };
};
```

### Microservice Architecture

```yaml
# kubernetes/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: corpus-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: corpus-service
  template:
    metadata:
      labels:
        app: corpus-service
    spec:
      containers:
        - name: corpus-api
          image: corpus-service:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

## Performance Considerations

### Memory Management

```javascript
// Production configuration
const corpus = new Corpora({
  cacheSize: 50, // Limit cached texts
  lazyLoad: true, // Load texts on demand
  compression: true, // Use compressed storage
  streaming: true, // Stream large texts
});
```

### Caching Strategies

```javascript
// Redis caching
const redis = require("redis");
const client = redis.createClient();

class CachedCorpora extends Corpora {
  async getText(name) {
    const cached = await client.get(`text:${name}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const text = super.getText(name);
    await client.setex(`text:${name}`, 3600, JSON.stringify(text));
    return text;
  }
}
```

### Load Balancing

```nginx
# nginx.conf
upstream corpus_backend {
    server corpus-1:3000;
    server corpus-2:3000;
    server corpus-3:3000;
}

server {
    listen 80;

    location /api/ {
        proxy_pass http://corpus_backend;
        proxy_cache corpus_cache;
        proxy_cache_valid 200 1h;
    }
}
```

## Monitoring and Analytics

### Application Monitoring

```javascript
// Monitoring middleware
const prometheus = require("prom-client");

const textAccessCounter = new prometheus.Counter({
  name: "corpus_text_access_total",
  help: "Total number of text accesses",
  labelNames: ["category", "text_name"],
});

const textProcessingDuration = new prometheus.Histogram({
  name: "corpus_text_processing_duration_seconds",
  help: "Time spent processing texts",
  labelNames: ["operation"],
});

// Usage tracking
class MonitoredCorpora extends Corpora {
  getText(name) {
    const timer = textProcessingDuration.startTimer({ operation: "getText" });
    const result = super.getText(name);
    timer();

    textAccessCounter.inc({
      category: this.getCategory(name),
      text_name: name,
    });

    return result;
  }
}
```

### Health Checks

```javascript
// Health check endpoint
app.get("/health", (req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    corpus: {
      loaded: corpus.texts.length,
      categories: corpus.getCategories().length,
    },
  };

  res.json(health);
});
```

### Error Tracking

```javascript
// Error tracking with Sentry
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Error handling middleware
app.use(Sentry.Handlers.errorHandler());
```

### Usage Analytics

```javascript
// Analytics tracking
const analytics = require("./analytics");

class AnalyticsCorpora extends Corpora {
  filter(pattern) {
    analytics.track("corpus.filter", {
      pattern,
      timestamp: Date.now(),
      userId: this.userId,
    });

    return super.filter(pattern);
  }
}
```

---

_For deployment questions or issues, please refer to the [troubleshooting guide](./troubleshooting.md) or create an issue in the project repository._
