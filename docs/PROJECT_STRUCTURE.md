# Project Structure

This document describes the current project structure after cleanup and organization.

## 📁 Directory Structure

```
common-corpus/
├── 📂 corpus/                    # Text collection (75MB)
│   ├── literature/               # Literary works
│   ├── cyberpunk/               # Science fiction
│   ├── filmscripts/             # Movie screenplays
│   ├── computerculture/         # Tech culture texts
│   ├── nasa/                    # Space program docs
│   ├── quotations/              # Quote collections
│   ├── sentences/               # Pre-processed sentences
│   ├── spam/                    # Spam samples
│   ├── western/                 # Western genre
│   └── [individual texts]       # Root-level texts
│
├── 📂 lib/                      # Core utilities
│   ├── debreak.js               # Text paragraph reconstruction
│   └── textutil.js              # Text analysis utilities
│
├── 📂 scripts/                  # Build and deployment scripts
│   └── build-lambda-layer.sh    # Lambda layer builder
│
├── 📂 terraform/                # Infrastructure as Code
│   ├── main.tf                  # Full API infrastructure
│   ├── variables.tf             # Configuration variables
│   ├── outputs.tf               # Deployment outputs
│   ├── versions.tf              # Provider requirements
│   ├── layer-only-clean.tf      # Layer-only configuration
│   ├── deploy-layer-only.sh     # Layer deployment script
│   ├── terraform.tfvars.example # Example configuration
│   └── README.md                # Terraform documentation
│
├── 📂 examples/                 # Usage examples
│   └── lambda-function.js       # Example Lambda function
│
├── 📂 docs/                     # Documentation
│   ├── api/                     # API documentation
│   ├── architecture/            # System design docs
│   ├── deployment/              # Deployment guides
│   │   └── DEPLOYMENT_OPTIONS.md # Deployment options guide
│   ├── requirements/            # Product requirements
│   ├── corpus-guide.md          # Text collection guide
│   ├── PROJECT_STRUCTURE.md     # This file
│   └── REPOSITORY_ANALYSIS.md   # Project analysis
│
├── 📂 test/                     # Test suite
│   └── corpora.provider.tests.js
│
├── 📄 index.js                  # Original library entry point
├── 📄 lambda-index.js           # Lambda-optimized version
├── 📄 util.js                   # CLI interface
├── 📄 package.json              # Project configuration
├── 📄 README.md                 # Main project documentation
├── 📄 CONTRIBUTING.md           # Contribution guidelines
├── 📄 CHANGELOG.md              # Version history
├── 📄 SECURITY.md               # Security policy
└── 📄 LICENSE                   # MIT License
```

## 🗂️ File Categories

### **Core Library Files**

- `index.js` - Original Heroku-optimized version
- `lambda-index.js` - Lambda-optimized version (no zip extraction)
- `util.js` - Command-line interface
- `lib/` - Core text processing utilities

### **Infrastructure & Deployment**

- `scripts/build-lambda-layer.sh` - Builds Lambda layer with pre-extracted texts
- `terraform/` - Complete infrastructure as code for AWS deployment
- `examples/lambda-function.js` - Example Lambda function using the layer

### **Documentation**

- `docs/` - Comprehensive project documentation
- `README.md` - Main project overview
- `PROJECT_STRUCTURE.md` - This file
- Various guides for API, deployment, and architecture

### **Configuration**

- `package.json` - NPM package configuration
- `.eslintrc` - Code linting rules
- `.gitignore` - Git ignore patterns
- `terraform/terraform.tfvars.example` - Infrastructure configuration template

## 🚫 Ignored Artifacts

The following files/directories are generated during build/deployment and are ignored by Git:

### **Build Artifacts**

- `common-corpus-layer.zip` - Built Lambda layer
- `lambda-layer/` - Temporary build directory
- `unzip-temp/` - Text extraction directory

### **Terraform Artifacts**

- `terraform/.terraform/` - Terraform provider cache
- `terraform/.terraform.lock.hcl` - Provider version lock
- `terraform/terraform.tfstate*` - Terraform state files
- `terraform/terraform.tfvars` - User configuration (contains secrets)
- `terraform/tfplan` - Terraform execution plans
- `terraform/layer-only/` - Generated deployment directory
- `terraform/full-api/` - Generated deployment directory

### **Standard Artifacts**

- `node_modules/` - NPM dependencies
- `coverage/` - Test coverage reports
- `*.log` - Log files

## 🎯 Key Entry Points

### **For Library Usage**

```javascript
// Original version (Heroku-optimized)
const Corpora = require("common-corpus");

// Lambda-optimized version
const Corpora = require("./lambda-index.js");
```

### **For CLI Usage**

```bash
node util.js --list
node util.js --filter "cyberpunk"
node util.js --text "neuromancer"
```

### **For Lambda Deployment**

```bash
# Build layer
./scripts/build-lambda-layer.sh

# Deploy layer-only
cd terraform/
./deploy-layer-only.sh

# Deploy full API
cd terraform/
terraform init && terraform apply
```

## 📋 Maintenance Notes

### **Regular Updates Needed**

- `corpus/` - Add new texts as needed
- `docs/` - Keep documentation current
- `terraform/` - Update provider versions
- `package.json` - Update dependencies

### **Build Process**

1. Text changes → Run `./scripts/build-lambda-layer.sh`
2. Code changes → Test with `npm test`
3. Infrastructure changes → Plan with `terraform plan`

### **Version Control**

- All source code and documentation is tracked
- Build artifacts are ignored
- User configuration files are ignored
- Terraform state should be stored remotely for team use

This structure provides a clean separation between source code, documentation, infrastructure, and build artifacts while maintaining ease of use for both development and deployment.
