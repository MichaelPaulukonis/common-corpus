#!/bin/bash

# Build Lambda Layer for Common Corpus
# This script creates a Lambda layer with pre-extracted texts to avoid runtime zip extraction

set -e

echo "🚀 Building Lambda layer for Common Corpus..."

# Configuration
LAYER_NAME="common-corpus"
LAYER_DIR="lambda-layer"
OUTPUT_ZIP="common-corpus-layer.zip"
MAX_SIZE_BYTES=262144000  # 250MB Lambda layer limit

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf "$LAYER_DIR" "$OUTPUT_ZIP"

# Create layer directory structure
echo "📁 Creating layer structure..."
mkdir -p "$LAYER_DIR/nodejs/node_modules/common-corpus"

# Copy core application files
echo "📋 Copying source files..."
cp lambda-index.js "$LAYER_DIR/nodejs/node_modules/common-corpus/index.js"
cp -r lib "$LAYER_DIR/nodejs/node_modules/common-corpus/"
cp package.json "$LAYER_DIR/nodejs/node_modules/common-corpus/"

# Create extracted corpus directory
echo "📚 Setting up corpus extraction..."
mkdir -p "$LAYER_DIR/nodejs/node_modules/common-corpus/corpus-extracted"

# Function to extract and copy texts from a directory
extract_texts() {
    local source_dir="$1"
    local target_dir="$2"
    
    echo "  Processing: $source_dir"
    
    # Create target directory if it doesn't exist
    mkdir -p "$target_dir"
    
    # Extract zip files
    find "$source_dir" -name "*.zip" -print0 | while IFS= read -r -d '' zipfile; do
        echo "    Extracting: $(basename "$zipfile")"
        unzip -o "$zipfile" -d "$target_dir" >/dev/null 2>&1 || {
            echo "    ⚠️  Warning: Failed to extract $zipfile"
        }
    done
    
    # Extract 7z files
    find "$source_dir" -name "*.7z" -print0 | while IFS= read -r -d '' sevenzfile; do
        echo "    Extracting: $(basename "$sevenzfile")"
        7z x "$sevenzfile" -o"$target_dir" -y >/dev/null 2>&1 || {
            echo "    ⚠️  Warning: Failed to extract $sevenzfile (7z not available?)"
        }
    done
    
    # Copy text files directly
    find "$source_dir" -maxdepth 1 -name "*.txt" -exec cp {} "$target_dir/" \; 2>/dev/null || true
    
    # Copy JavaScript sentence files
    find "$source_dir" -maxdepth 1 -name "*.js" -exec cp {} "$target_dir/" \; 2>/dev/null || true
}

# Process corpus directory
if [ -d "corpus" ]; then
    echo "📖 Extracting corpus texts..."
    
    # Process each subdirectory
    for category_dir in corpus/*/; do
        if [ -d "$category_dir" ]; then
            category=$(basename "$category_dir")
            echo "  📂 Processing category: $category"
            extract_texts "$category_dir" "$LAYER_DIR/nodejs/node_modules/common-corpus/corpus-extracted/$category"
        fi
    done
    
    # Process root-level texts
    echo "  📂 Processing root-level texts"
    extract_texts "corpus" "$LAYER_DIR/nodejs/node_modules/common-corpus/corpus-extracted"
    
else
    echo "❌ Error: corpus directory not found!"
    exit 1
fi

# Install production dependencies
echo "📦 Installing dependencies..."
cd "$LAYER_DIR/nodejs/node_modules/common-corpus"
npm install --production --no-optional --silent
cd - >/dev/null

# Remove unnecessary files to reduce size
echo "🗑️  Removing unnecessary files..."
find "$LAYER_DIR" -name "*.md" -delete
find "$LAYER_DIR" -name "*.test.js" -delete
find "$LAYER_DIR" -name "test" -type d -exec rm -rf {} + 2>/dev/null || true
find "$LAYER_DIR" -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true
find "$LAYER_DIR" -name ".git*" -delete 2>/dev/null || true
find "$LAYER_DIR" -name "*.DS_Store" -delete 2>/dev/null || true
find "$LAYER_DIR" -name "node_modules/.cache" -type d -exec rm -rf {} + 2>/dev/null || true

# Create layer zip
echo "📦 Creating layer zip..."
cd "$LAYER_DIR"
zip -r "../$OUTPUT_ZIP" . -x "*.DS_Store*" >/dev/null
cd - >/dev/null

# Check layer size
LAYER_SIZE=$(stat -f%z "$OUTPUT_ZIP" 2>/dev/null || stat -c%s "$OUTPUT_ZIP")
LAYER_SIZE_MB=$((LAYER_SIZE / 1024 / 1024))

echo "📊 Layer Statistics:"
echo "  Size: ${LAYER_SIZE_MB}MB ($(numfmt --to=iec-i --suffix=B $LAYER_SIZE))"
echo "  Limit: 250MB"

if [ $LAYER_SIZE -gt $MAX_SIZE_BYTES ]; then
    echo "❌ ERROR: Layer exceeds 250MB limit!"
    echo "   Current size: ${LAYER_SIZE_MB}MB"
    echo "   Consider removing some texts or using S3-based approach"
    exit 1
fi

# Count extracted texts
TEXT_COUNT=$(find "$LAYER_DIR/nodejs/node_modules/common-corpus/corpus-extracted" -name "*.txt" -o -name "*.js" | wc -l)
echo "  Texts: $TEXT_COUNT files extracted"

echo "✅ Lambda layer ready: $OUTPUT_ZIP"

# Optional: Deploy to AWS
if [ "$1" = "deploy" ]; then
    echo "🚀 Deploying to AWS Lambda..."
    
    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI not found. Please install AWS CLI to deploy."
        exit 1
    fi
    
    # Deploy layer
    LAYER_VERSION=$(aws lambda publish-layer-version \
        --layer-name "$LAYER_NAME" \
        --description "Common Corpus text collection for NLP/NLG (${LAYER_SIZE_MB}MB, $TEXT_COUNT texts)" \
        --zip-file "fileb://$OUTPUT_ZIP" \
        --compatible-runtimes nodejs14.x nodejs16.x nodejs18.x nodejs20.x \
        --query 'Version' \
        --output text)
    
    if [ $? -eq 0 ]; then
        echo "✅ Layer deployed successfully!"
        echo "   Layer Name: $LAYER_NAME"
        echo "   Version: $LAYER_VERSION"
        echo "   ARN: arn:aws:lambda:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):layer:$LAYER_NAME:$LAYER_VERSION"
        echo ""
        echo "📝 To use in your Lambda function:"
        echo "   Add layer ARN to your function configuration"
        echo "   Use: const Corpora = require('/opt/nodejs/node_modules/common-corpus');"
    else
        echo "❌ Failed to deploy layer"
        exit 1
    fi
fi

echo ""
echo "🎉 Build complete!"
echo "   Layer file: $OUTPUT_ZIP"
echo "   Size: ${LAYER_SIZE_MB}MB"
echo "   Texts: $TEXT_COUNT"
echo ""
echo "Next steps:"
echo "1. Upload $OUTPUT_ZIP as a Lambda layer"
echo "2. Add layer to your Lambda function"
echo "3. Use: const Corpora = require('/opt/nodejs/node_modules/common-corpus');"