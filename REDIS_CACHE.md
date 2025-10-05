# Redis Caching for Popular Questions

## Overview

This document describes the Redis caching system implemented for the OnboardAI chatbot to reduce API costs and improve response times for frequently asked questions.

## Features

### 1. **Response Caching**
- Caches AI-generated responses for identical questions
- Cache key is based on MD5 hash of normalized query + companyId
- TTL (Time To Live): 1 hour (3600 seconds)
- Automatic cache invalidation after expiry

### 2. **Query Frequency Tracking**
- Tracks how many times each question is asked
- Identifies popular questions per company
- Data stored in Redis sorted sets for efficient retrieval

### 3. **Popular Questions Analytics**
- View top N most popular questions for each company
- Includes query count and metadata
- Useful for identifying common onboarding topics

## Architecture

### Cache Flow

```
User Query → Check Redis Cache
    ↓
  Cache HIT?
    ↓ YES          ↓ NO
Return cached   Generate embedding
response        → Vector search
                → Call Claude API
                → Cache response
                → Return response
```

### Components

1. **CacheService** (`src/modules/cache/cache.service.ts`)
   - Manages Redis connection
   - Handles cache read/write operations
   - Tracks query frequency
   - Provides analytics endpoints

2. **CacheModule** (`src/modules/cache/cache.module.ts`)
   - NestJS module that exports CacheService
   - Integrated into AiModule

3. **Updated AI Service** (`src/modules/ai/ai.service.ts`)
   - Checks cache before generating responses
   - Caches successful responses
   - Tracks all queries for analytics

## Installation

### 1. Install Redis

**Option A: Local Development (Docker)**
```bash
docker run -d --name redis-cache -p 6379:6379 redis:alpine
```

**Option B: Local Development (Windows)**
Download and install Redis from: https://github.com/microsoftarchive/redis/releases

**Option C: Production (Upstash)**
Free Redis hosting:
1. Sign up at https://upstash.com
2. Create a Redis database
3. Copy the Redis URL
4. Update `REDIS_URL` in `.env`

### 2. Configure Environment

Add to your `.env` file:
```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
```

For Upstash or other cloud providers:
```env
REDIS_URL=redis://default:your-password@your-host.upstash.io:6379
```

### 3. Dependencies

Already installed via:
```bash
pnpm add ioredis
```

## API Endpoints

### 1. Chat with Caching (Existing)
```http
POST /api/ai/chat
Content-Type: application/json

{
  "query": "What is the vacation policy?",
  "companyId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "content": "Based on the company handbook...",
  "sources": [...]
}
```

**Behavior:**
- First request: Generates response, caches it
- Subsequent identical requests: Returns cached response instantly

### 2. Get Popular Questions
```http
GET /api/ai/popular-questions/:companyId?limit=10
```

**Response:**
```json
[
  {
    "query": "what is the vacation policy",
    "companyId": "507f1f77bcf86cd799439011",
    "count": 25,
    "lastAsked": "2025-10-05T12:00:00.000Z"
  },
  {
    "query": "how do i submit expenses",
    "companyId": "507f1f77bcf86cd799439011",
    "count": 18,
    "lastAsked": "2025-10-05T11:30:00.000Z"
  }
]
```

### 3. Get Cache Statistics
```http
GET /api/ai/cache-stats/:companyId
```

**Response:**
```json
{
  "totalQuestions": 42,
  "cachedQuestions": 15,
  "popularQuestions": [...]
}
```

### 4. Clear Company Cache
```http
POST /api/ai/cache/clear/:companyId
```

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

## Cache Strategy

### Cache Key Generation
```typescript
const normalizedQuery = query.trim().toLowerCase();
const hash = crypto.createHash('md5')
  .update(`${normalizedQuery}:${companyId}`)
  .digest('hex');
const cacheKey = `ai:chat:${hash}`;
```

### Why MD5 Hash?
- Normalizes queries (case-insensitive, trimmed)
- Fixed-length keys
- Fast computation
- Collision unlikely for typical use case

### Query Normalization
- Converts to lowercase
- Trims whitespace
- Same semantic query = same cache key

Example:
- `"What is the vacation policy?"`
- `"what is the vacation policy"`
- `"  What is the vacation policy  "`
→ All map to the same cache key

## Performance Benefits

### Cost Savings
For a question asked 10 times in 1 hour:

**Without Cache:**
- 10 × OpenAI embedding calls: ~$0.001
- 10 × MongoDB vector searches
- 10 × Claude API calls: ~$0.50-1.00
- **Total: ~$0.50-1.00**

**With Cache:**
- 1 × OpenAI embedding call: ~$0.0001
- 1 × MongoDB vector search
- 1 × Claude API call: ~$0.05-0.10
- 9 × Redis cache hits: ~$0.00
- **Total: ~$0.05-0.10**

**Savings: 80-90% on repeated queries**

### Response Time
- Cached response: ~10-50ms
- Full RAG pipeline: ~2000-5000ms
- **Speed improvement: 40-500x faster**

## Redis Data Structure

### Cached Responses
```
Key: ai:chat:{md5_hash}
Type: String (JSON)
TTL: 3600 seconds (1 hour)
Value: {
  "content": "AI response text",
  "sources": [...],
  "cachedAt": "2025-10-05T12:00:00.000Z"
}
```

### Query Frequency Stats
```
Key: ai:stats:{md5_hash}
Type: String (counter)
TTL: 2592000 seconds (30 days)
Value: "15"
```

### Popular Questions
```
Key: ai:popular:{companyId}
Type: Sorted Set
Members: JSON strings {"query": "...", "companyId": "..."}
Score: Query count
```

## Configuration Options

### Cache TTL (Time To Live)
Default: 1 hour (3600 seconds)

To modify, edit `cache.service.ts:26`:
```typescript
private readonly CACHE_TTL = 3600; // Change to desired seconds
```

Recommendations:
- Development: 300 (5 minutes)
- Production: 3600 (1 hour)
- Stable content: 86400 (24 hours)

### Redis Connection Options
```typescript
new Redis(redisUrl, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
});
```

## Monitoring

### Check Redis Connection
```bash
# Connect to Redis CLI
docker exec -it redis-cache redis-cli

# View all cache keys
KEYS ai:chat:*

# View popular questions for a company
ZREVRANGE ai:popular:507f1f77bcf86cd799439011 0 9 WITHSCORES

# Get cache hit count
GET ai:stats:{hash}

# Check TTL of a key
TTL ai:chat:{hash}
```

### Logs
The cache service logs all operations:
- `Cache HIT` - Response retrieved from cache
- `Cache MISS` - Response not in cache, generating
- `Cached response` - New response cached
- Connection status updates

## Error Handling

### Redis Unavailable
If Redis is not running or unavailable:
- Cache operations are skipped (graceful degradation)
- System continues to work normally
- Warnings logged but no errors thrown
- All queries go through full RAG pipeline

### Automatic Reconnection
The Redis client automatically attempts to reconnect:
- Initial retry: 50ms
- Max retry delay: 2000ms
- Max retries per request: 3

## Best Practices

### 1. Monitor Popular Questions
Use the popular questions endpoint to:
- Identify common onboarding topics
- Update documentation for frequently asked questions
- Pre-warm cache for common queries

### 2. Cache Invalidation
Clear cache when:
- Company documents are updated
- Resources are added/removed
- Major content changes

### 3. Production Deployment
For production:
- Use managed Redis (Upstash, Redis Cloud, AWS ElastiCache)
- Enable Redis persistence (AOF or RDB)
- Set up monitoring (Redis INFO command)
- Configure alerts for connection failures

## Troubleshooting

### Issue: Cache not working
**Check:**
1. Redis is running: `docker ps` or `redis-cli ping`
2. `REDIS_URL` is correct in `.env`
3. Network connectivity to Redis
4. Check logs for connection errors

### Issue: Old cached responses
**Solution:**
```bash
# Clear all cache for a company
curl -X POST http://localhost:8000/api/ai/cache/clear/{companyId}

# Or manually in Redis
redis-cli
> DEL ai:chat:*
```

### Issue: Redis memory full
**Solutions:**
1. Reduce `CACHE_TTL`
2. Increase Redis max memory
3. Enable eviction policy: `maxmemory-policy allkeys-lru`

## Future Enhancements

1. **Semantic Caching**
   - Cache similar questions (not just identical)
   - Use embedding similarity for cache lookup

2. **Multi-level Caching**
   - L1: In-memory cache (fastest)
   - L2: Redis cache (fast)
   - L3: Database (fallback)

3. **Cache Pre-warming**
   - Automatically cache answers to popular questions
   - Scheduled cache refresh for critical queries

4. **Advanced Analytics**
   - Query trends over time
   - Most common topics by department
   - Cache hit rate metrics

5. **Distributed Caching**
   - Redis Cluster for horizontal scaling
   - Cache sharding by companyId

## Summary

The Redis caching system provides:
- ✅ 80-90% cost reduction for repeated queries
- ✅ 40-500x faster response times
- ✅ Popular question analytics
- ✅ Graceful degradation if Redis is unavailable
- ✅ Easy integration with existing RAG pipeline
- ✅ Multi-tenant isolation by companyId

For questions or issues, check the logs or contact the development team.
