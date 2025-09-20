/**
 * Example Lambda function using Common Corpus layer
 * 
 * This function demonstrates how to use the Common Corpus library
 * in AWS Lambda with the pre-built layer.
 */

const Corpora = require('/opt/nodejs/node_modules/common-corpus');

// Initialize corpus instance (reused across warm invocations)
let corpus;

/**
 * Lambda handler for Common Corpus API
 * 
 * Supported operations:
 * - GET /texts - List all texts
 * - GET /texts/{category} - Filter texts by category
 * - GET /text/{name} - Get specific text content
 * - GET /health - Health check
 */
exports.handler = async (event, context) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        // Initialize corpus if not already done (cold start)
        if (!corpus) {
            console.log('Cold start: Initializing corpus...');
            const startTime = Date.now();
            
            corpus = new Corpora({
                maxCacheSize: 5  // Limit cache size for Lambda memory constraints
            });
            
            const initTime = Date.now() - startTime;
            console.log(`Corpus initialized in ${initTime}ms with ${corpus.texts.length} texts`);
        }

        // Parse request
        const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'GET';
        const path = event.path || event.rawPath || '/';
        const pathParameters = event.pathParameters || {};
        const queryStringParameters = event.queryStringParameters || {};

        // CORS headers
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, OPTIONS'
        };

        // Handle OPTIONS for CORS
        if (httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: ''
            };
        }

        // Route handling
        if (path === '/health') {
            return handleHealthCheck(headers);
        } else if (path === '/texts' || path.startsWith('/texts/')) {
            return handleTextsRequest(pathParameters, queryStringParameters, headers);
        } else if (path.startsWith('/text/')) {
            return handleTextRequest(pathParameters, queryStringParameters, headers);
        } else {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'Not Found',
                    message: 'Available endpoints: /health, /texts, /texts/{category}, /text/{name}'
                })
            };
        }

    } catch (error) {
        console.error('Handler error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error.message,
                requestId: context.awsRequestId
            })
        };
    }
};

/**
 * Handle health check requests
 */
function handleHealthCheck(headers) {
    const health = corpus.healthCheck();
    const cacheStats = corpus.getCacheStats();
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            ...health,
            cache: cacheStats,
            lambda: {
                memoryUsage: process.memoryUsage(),
                uptime: process.uptime()
            }
        })
    };
}

/**
 * Handle text listing and filtering requests
 */
function handleTextsRequest(pathParameters, queryStringParameters, headers) {
    const category = pathParameters.category || pathParameters.proxy;
    const limit = parseInt(queryStringParameters.limit) || 100;
    const offset = parseInt(queryStringParameters.offset) || 0;
    
    try {
        // Filter texts
        let texts;
        if (category) {
            texts = corpus.filter(category);
            if (texts.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        error: 'Category Not Found',
                        message: `No texts found matching category: ${category}`
                    })
                };
            }
        } else {
            texts = corpus.texts;
        }

        // Apply pagination
        const total = texts.length;
        const paginatedTexts = texts.slice(offset, offset + limit);

        // Build response
        const response = {
            category: category || 'all',
            total,
            offset,
            limit,
            count: paginatedTexts.length,
            texts: paginatedTexts.map(text => ({
                name: text.name,
                // Add basic metadata without loading full text
                hasText: typeof text.text === 'function',
                hasSentences: typeof text.sentences === 'function'
            }))
        };

        // Add pagination links
        if (offset + limit < total) {
            response.nextOffset = offset + limit;
        }
        if (offset > 0) {
            response.prevOffset = Math.max(0, offset - limit);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };

    } catch (error) {
        console.error('Filter error:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Bad Request',
                message: `Invalid filter pattern: ${category}`
            })
        };
    }
}

/**
 * Handle individual text content requests
 */
function handleTextRequest(pathParameters, queryStringParameters, headers) {
    const textName = pathParameters.name || pathParameters.proxy;
    const includeSentences = queryStringParameters.sentences === 'true';
    const maxLength = parseInt(queryStringParameters.maxLength) || 0;
    
    if (!textName) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Bad Request',
                message: 'Text name is required'
            })
        };
    }

    try {
        // Find matching texts
        const matches = corpus.filter(`^${textName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
        
        if (matches.length === 0) {
            // Try partial match
            const partialMatches = corpus.filter(textName);
            if (partialMatches.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        error: 'Text Not Found',
                        message: `No text found matching: ${textName}`
                    })
                };
            } else {
                // Return suggestions
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        error: 'Text Not Found',
                        message: `No exact match for: ${textName}`,
                        suggestions: partialMatches.slice(0, 5).map(t => t.name)
                    })
                };
            }
        }

        const text = matches[0];
        
        // Load text content
        console.log(`Loading text: ${text.name}`);
        const startTime = Date.now();
        
        let content = text.text();
        const loadTime = Date.now() - startTime;
        
        // Apply length limit if specified
        if (maxLength > 0 && content.length > maxLength) {
            content = content.substring(0, maxLength) + '...';
        }

        const response = {
            name: text.name,
            content,
            metadata: {
                length: content.length,
                loadTimeMs: loadTime
            }
        };

        // Include sentences if requested
        if (includeSentences) {
            console.log(`Processing sentences for: ${text.name}`);
            const sentenceStartTime = Date.now();
            
            const sentences = text.sentences();
            const sentenceTime = Date.now() - sentenceStartTime;
            
            response.sentences = sentences;
            response.metadata.sentenceCount = sentences.length;
            response.metadata.sentenceProcessingTimeMs = sentenceTime;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };

    } catch (error) {
        console.error(`Error loading text ${textName}:`, error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Processing Error',
                message: `Failed to load text: ${textName}`,
                details: error.message
            })
        };
    }
}

/**
 * Example usage patterns for different Lambda triggers
 */

// API Gateway REST API handler
exports.restApiHandler = async (event, context) => {
    // Add API Gateway specific processing
    return exports.handler(event, context);
};

// API Gateway HTTP API handler  
exports.httpApiHandler = async (event, context) => {
    // Add HTTP API specific processing
    return exports.handler(event, context);
};

// Direct invocation handler for batch processing
exports.batchHandler = async (event, context) => {
    if (!corpus) {
        corpus = new Corpora({ maxCacheSize: 20 });
    }

    const { operation, parameters } = event;
    
    switch (operation) {
        case 'analyzeTexts':
            return analyzeTexts(parameters);
        case 'extractSentences':
            return extractSentences(parameters);
        case 'getWordFrequencies':
            return getWordFrequencies(parameters);
        default:
            throw new Error(`Unknown operation: ${operation}`);
    }
};

/**
 * Batch operation: Analyze multiple texts
 */
async function analyzeTexts(parameters) {
    const { category, limit = 10 } = parameters;
    const texts = category ? corpus.filter(category) : corpus.texts;
    const selectedTexts = texts.slice(0, limit);
    
    const results = selectedTexts.map(text => {
        try {
            const content = text.text();
            const sentences = text.sentences();
            
            return {
                name: text.name,
                analysis: {
                    characterCount: content.length,
                    wordCount: content.split(/\s+/).length,
                    sentenceCount: sentences.length,
                    avgWordsPerSentence: Math.round(content.split(/\s+/).length / sentences.length)
                }
            };
        } catch (error) {
            return {
                name: text.name,
                error: error.message
            };
        }
    });
    
    return { results };
}

/**
 * Batch operation: Extract sentences from texts
 */
async function extractSentences(parameters) {
    const { textNames, maxSentences = 100 } = parameters;
    const results = {};
    
    for (const textName of textNames) {
        try {
            const matches = corpus.filter(textName);
            if (matches.length > 0) {
                const sentences = matches[0].sentences();
                results[textName] = sentences.slice(0, maxSentences);
            } else {
                results[textName] = { error: 'Text not found' };
            }
        } catch (error) {
            results[textName] = { error: error.message };
        }
    }
    
    return { results };
}

/**
 * Batch operation: Get word frequencies
 */
async function getWordFrequencies(parameters) {
    const { category, topN = 50 } = parameters;
    const textutil = require('/opt/nodejs/node_modules/common-corpus/lib/textutil');
    
    try {
        const texts = category ? corpus.filter(category) : corpus.texts.slice(0, 5);
        const combinedText = texts.map(t => t.text()).join(' ');
        const frequencies = textutil.wordfreqs(combinedText);
        
        return {
            category: category || 'all',
            textCount: texts.length,
            topWords: frequencies.slice(0, topN)
        };
    } catch (error) {
        throw new Error(`Word frequency analysis failed: ${error.message}`);
    }
}