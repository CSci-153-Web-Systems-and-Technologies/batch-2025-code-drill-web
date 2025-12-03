# Judge0 Self-Hosted Setup

This directory contains the configuration for running Judge0 locally using Docker.

## Prerequisites

- Docker Desktop installed and running
- At least 4GB of RAM available
- 10GB of free disk space

## Quick Start

1. **Start Judge0 services:**
   ```bash
   cd judge0-self-hosted
   docker-compose up -d
   ```

2. **Wait for services to initialize (30-60 seconds):**
   ```bash
   docker-compose logs -f judge0-server
   ```
   Wait until you see "Listening on tcp://0.0.0.0:2358"

3. **Test the connection:**
   ```bash
   curl http://localhost:2358/languages
   ```

4. **Update your `.env.local` in the project root:**
   ```env
   JUDGE0_API_URL=http://localhost:2358
   # Remove or comment out JUDGE0_API_KEY
   ```

5. **Restart your Next.js dev server:**
   ```bash
   npm run dev
   ```

## Management Commands

### Check service status:
```bash
docker-compose ps
```

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f judge0-server
docker-compose logs -f judge0-workers
```

### Stop services:
```bash
docker-compose down
```

### Stop and remove all data:
```bash
docker-compose down -v
```

### Restart services:
```bash
docker-compose restart
```

## Configuration

Edit `judge0.conf` to customize:
- Resource limits (CPU, memory, time)
- Number of workers
- Security settings
- Language restrictions

After changing configuration:
```bash
docker-compose restart
```

## Troubleshooting

### Service won't start:
```bash
# Check logs
docker-compose logs judge0-server

# Reset everything
docker-compose down -v
docker-compose up -d
```

### Port 2358 already in use:
Edit `docker-compose.yml` and change:
```yaml
ports:
  - "2359:2358"  # Use different external port
```

Then update `.env.local`:
```env
JUDGE0_API_URL=http://localhost:2359
```

### Out of memory:
Reduce worker count in `judge0.conf`:
```
WORKERS_COUNT=2
```

## Security Notes

**IMPORTANT:** The default passwords in this setup are for development only!

For production use:
1. Change all passwords in `docker-compose.yml` and `judge0.conf`
2. Enable authentication in `judge0.conf`
3. Use a reverse proxy (nginx) with SSL
4. Restrict network access
5. Regular backups of PostgreSQL data

## Performance Tuning

### For better performance:
1. Increase `WORKERS_COUNT` in `judge0.conf` (based on CPU cores)
2. Adjust `MAX_CPU_TIME_LIMIT` for faster/slower execution
3. Increase `RAILS_MAX_THREADS` for more concurrent requests

### Recommended settings by CPU:
- 2 cores: `WORKERS_COUNT=2`
- 4 cores: `WORKERS_COUNT=4`
- 8+ cores: `WORKERS_COUNT=8`

## Monitoring

### Resource usage:
```bash
docker stats
```

### Submission queue:
```bash
curl http://localhost:2358/statistics
```

## Updating Judge0

```bash
docker-compose pull
docker-compose up -d
```

## Uninstall

```bash
# Remove containers and volumes
docker-compose down -v

# Remove images
docker rmi judge0/judge0:1.13.0 postgres:13-alpine redis:7-alpine
```

## Benefits vs RapidAPI

✅ **No rate limits** - Execute unlimited submissions
✅ **No API costs** - Free to run locally
✅ **Lower latency** - No network overhead to external API
✅ **Full control** - Customize resource limits and languages
✅ **Privacy** - Code never leaves your machine

## Limitations

❌ Requires Docker and system resources
❌ Manual updates needed
❌ Development machine only (not for production)
❌ No automatic scaling

## Next Steps

1. Test with a simple submission from your app
2. Monitor resource usage with `docker stats`
3. Adjust worker count based on performance
4. Consider hosting on a dedicated server for production
