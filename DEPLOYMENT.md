# Hypat.ai Deployment Guide

This guide provides comprehensive instructions for deploying, configuring, and maintaining the Hypat.ai newsletter management system.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Instructions](#installation-instructions)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [Deployment Options](#deployment-options)
6. [Maintenance](#maintenance)
7. [Troubleshooting](#troubleshooting)

## System Requirements

### Hardware Requirements

- **CPU**: 2+ cores recommended for production use
- **RAM**: Minimum 2GB, 4GB+ recommended for production use
- **Storage**: Minimum 1GB for application and dependencies, plus additional space for database storage
  - Database storage requirements depend on the number of newsletters processed (estimate ~10MB per 1,000 newsletters)

### Software Requirements

- **Node.js**: Version 16.x or higher (LTS version recommended)
- **npm**: Version 8.x or higher (comes with Node.js)
- **Database**: SQLite 3.x (included) or PostgreSQL 12+ (optional, for production)
- **Operating System**:
  - Linux (Ubuntu 20.04+, Debian 11+, or similar distributions)
  - macOS 11.0+ (Big Sur or newer)
  - Windows 10/11 with WSL2 recommended for development

### Third-Party Service Requirements

- **Gmail API**:
  - Google Cloud Platform account
  - Gmail API enabled
  - OAuth 2.0 credentials configured
  - Required scopes: `https://www.googleapis.com/auth/gmail.readonly`, `https://www.googleapis.com/auth/gmail.labels`

- **Email Service** (for sending digests):
  - SMTP server credentials
  - OR
  - SendGrid, Mailgun, or similar transactional email service API key

## Installation Instructions

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/hypat.ai.git
cd hypat.ai
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Setup Gmail API Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials
   - Configure the OAuth consent screen
   - Create OAuth client ID (Web application type)
   - Add authorized redirect URIs (e.g., http://localhost:3000/auth/callback)
5. Download the credentials JSON file
6. Save it as `credentials.json` in the root of the project directory

### Step 4: Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/hypat.db
# If using PostgreSQL instead:
# DATABASE_TYPE=postgres
# DATABASE_URL=postgresql://username:password@localhost:5432/hypat

# Gmail MCP
GMAIL_CLIENT_ID=your_client_id_from_credentials.json
GMAIL_CLIENT_SECRET=your_client_secret_from_credentials.json
GMAIL_REDIRECT_URI=http://localhost:3000/auth/callback

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
EMAIL_FROM="Hypat.ai Digests <digests@yourdomain.com>"

# Security
SESSION_SECRET=a_random_secret_string_for_sessions
```

### Step 5: Run Database Migrations

```bash
npm run db:migrate
```

### Step 6: Verify Installation

```bash
npm run verify
```

This command will:
- Check all dependencies
- Verify database connection
- Test Gmail API credentials
- Ensure proper configuration

## Configuration

### Environment Variables Reference

#### Application Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment (`development`, `test`, `production`) | `development` | Yes |
| `PORT` | HTTP port for the web interface | `3000` | No |
| `LOG_LEVEL` | Logging level (`error`, `warn`, `info`, `debug`) | `info` | No |
| `CACHE_ENABLED` | Enable in-memory caching | `true` | No |
| `CACHE_TTL` | Cache time-to-live in seconds | `3600` | No |

#### Database Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_TYPE` | Database type (`sqlite`, `postgres`) | `sqlite` | Yes |
| `DATABASE_PATH` | Path to SQLite database file | `./data/hypat.db` | Only for SQLite |
| `DATABASE_URL` | PostgreSQL connection string | - | Only for PostgreSQL |
| `DATABASE_POOL_MIN` | Minimum pool connections | `2` | No |
| `DATABASE_POOL_MAX` | Maximum pool connections | `10` | No |

#### Gmail API Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GMAIL_CLIENT_ID` | OAuth 2.0 client ID | - | Yes |
| `GMAIL_CLIENT_SECRET` | OAuth 2.0 client secret | - | Yes |
| `GMAIL_REDIRECT_URI` | OAuth 2.0 redirect URI | - | Yes |
| `GMAIL_TOKEN_PATH` | Path to store token data | `./data/token.json` | No |

#### Email Settings (SMTP)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SMTP_HOST` | SMTP server hostname | - | Yes |
| `SMTP_PORT` | SMTP server port | `587` | No |
| `SMTP_SECURE` | Use TLS for SMTP | `false` | No |
| `SMTP_USER` | SMTP authentication username | - | Yes |
| `SMTP_PASS` | SMTP authentication password | - | Yes |
| `EMAIL_FROM` | Default sender address | - | Yes |

#### Security Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SESSION_SECRET` | Secret for session encryption | - | Yes |
| `RATE_LIMIT_WINDOW` | Rate limit window in milliseconds | `60000` | No |
| `RATE_LIMIT_MAX` | Maximum requests per window | `100` | No |

### Configuration Files

#### Email Template Configuration

Hypat.ai uses HTML email templates for digest emails. Templates are located in `src/core/digest/templates`.

Based on our integration test findings, we've simplified the template system to use plain HTML templates instead of MJML for better reliability. You can customize these templates by editing the HTML files directly.

Key templates:
- `daily-standard.html`: Standard daily digest template
- `weekly-standard.html`: Standard weekly digest template
- `verification.html`: Template for newsletter verification emails

#### Category Configuration (Optional)

To pre-configure newsletter categories:

1. Create a `categories.json` file in the `data` directory
2. Use the following format:

```json
[
  {
    "name": "Technology",
    "description": "Technology and computing topics",
    "subcategories": [
      {
        "name": "Software Development",
        "description": "Programming and software engineering"
      },
      {
        "name": "AI & Machine Learning",
        "description": "Artificial intelligence and ML advances"
      }
    ]
  },
  {
    "name": "Finance",
    "description": "Business and financial news",
    "subcategories": [
      {
        "name": "Market Updates",
        "description": "Stock market and investment news"
      }
    ]
  }
]
```

## Running the Application

### Development Mode

Development mode includes hot-reloading and verbose logging:

```bash
npm run dev
```

### Production Mode

For production environments:

```bash
npm run build
npm start
```

### Command-line Options

The application supports the following command-line options:

```bash
# Start with specific port
npm start -- --port=4000

# Use specific log level
npm start -- --log-level=debug

# Specify config file location
npm start -- --config=./custom-config.json
```

### Process Management

For production deployments, we recommend using a process manager:

#### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start npm --name "hypat" -- start

# Monitor the application
pm2 monit

# View logs
pm2 logs hypat

# Configure auto-restart on system boot
pm2 startup
pm2 save
```

#### Using systemd (Linux)

Create a service file `/etc/systemd/system/hypat.service`:

```ini
[Unit]
Description=Hypat.ai Newsletter Management System
After=network.target

[Service]
Type=simple
User=hypat
WorkingDirectory=/path/to/hypat.ai
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production PORT=3000

[Install]
WantedBy=multi-user.target
```

Then enable and start the service:

```bash
sudo systemctl enable hypat
sudo systemctl start hypat
```

### Logging Configuration

Hypat.ai uses a structured logging system. Logs are output to both console and file by default.

#### Log Files

- Log files are stored in the `logs` directory
- Rotation occurs daily and when files reach 10MB
- Default retention period is 14 days

#### Log Format

In production, logs use JSON format for easy parsing by log management tools. In development, a more human-readable format is used.

#### Log Levels

- `error`: Critical errors requiring immediate attention
- `warn`: Warning conditions that should be addressed
- `info`: Informational messages about normal operation (default)
- `debug`: Detailed debugging information

## Deployment Options

### Local Installation for Personal Use

For personal use on a local machine:

1. Follow the standard installation instructions
2. Use SQLite as the database (default)
3. Configure with minimal settings:

```bash
# Minimal .env file for personal use
NODE_ENV=production
DATABASE_TYPE=sqlite
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REDIRECT_URI=http://localhost:3000/auth/callback
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="My Newsletter Digest <your_gmail@gmail.com>"
SESSION_SECRET=any_random_string
```

4. Run the application:

```bash
npm start
```

### Docker Deployment

For containerized deployment:

1. Build the Docker image:

```bash
docker build -t hypat.ai .
```

2. Run the container:

```bash
docker run -d \
  --name hypat \
  -p 3000:3000 \
  -v /path/on/host/data:/app/data \
  -v /path/on/host/logs:/app/logs \
  --env-file .env \
  hypat.ai
```

3. For Docker Compose deployment, create a `docker-compose.yml` file:

```yaml
version: '3'
services:
  hypat:
    build: .
    container_name: hypat
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    env_file:
      - .env
    restart: unless-stopped
```

Then run:

```bash
docker-compose up -d
```

## Maintenance

### Backup and Restore Procedures

#### Database Backup

For SQLite:

```bash
# Create a backup
sqlite3 ./data/hypat.db .dump > backup-$(date +%Y%m%d).sql

# Restore from backup
sqlite3 ./data/hypat.db < backup-20230101.sql
```

For PostgreSQL:

```bash
# Create a backup
pg_dump -U username -d hypat > backup-$(date +%Y%m%d).sql

# Restore from backup
psql -U username -d hypat < backup-20230101.sql
```

#### Configuration Backup

Regularly back up these critical files:

- `.env` file
- `credentials.json` (Gmail API credentials)
- Custom templates in `src/core/digest/templates`
- User token data in `data/token.json`

### Database Maintenance

#### SQLite Maintenance

Perform regular VACUUM operations to optimize the database:

```bash
sqlite3 ./data/hypat.db "VACUUM;"
```

#### PostgreSQL Maintenance

For PostgreSQL, regular VACUUM and ANALYZE operations are recommended:

```bash
psql -U username -d hypat -c "VACUUM ANALYZE;"
```

### Monitoring

#### Key Metrics to Monitor

- API rate limits (Gmail API has quotas)
- Database size and growth
- Memory usage
- Error rates
- Email delivery success rates

#### Health Check Endpoint

The application exposes a health check endpoint at `/health` that returns:

- Application status
- Database connection status
- Gmail API connection status
- System resource usage

Example monitoring command:

```bash
curl http://localhost:3000/health
```

### Upgrading

Follow these steps to upgrade to a new version:

1. Back up your database and configuration
2. Pull the latest changes:

```bash
git pull origin main
```

3. Install dependencies:

```bash
npm install
```

4. Run database migrations:

```bash
npm run db:migrate
```

5. Restart the application:

```bash
npm restart
```

## Troubleshooting

### Common Issues and Solutions

#### Email Template Rendering Errors

**Issue**: Email templates fail to render or display incorrectly in email clients.

**Solution**: Based on our integration test findings, we've simplified the template system. If you encounter problems:

1. Check that the template HTML is valid
2. Avoid complex CSS that may not be supported by email clients
3. Test templates with the built-in testing utility:

```bash
npm run test:templates
```

#### Gmail API Authentication Failures

**Issue**: "Error: Authentication failed" in logs.

**Solution**:

1. Check that your credentials.json file is valid
2. Ensure the OAuth consent screen is properly configured
3. Delete the token.json file and reauthorize:

```bash
rm -f ./data/token.json
npm run auth:gmail
```

#### Database Connection Issues

**Issue**: "Error: Cannot connect to database" in logs.

**Solution**:

1. Verify database configuration in .env file
2. Check database file permissions (SQLite) or server connectivity (PostgreSQL)
3. Run the database diagnostic tool:

```bash
npm run db:diagnose
```

#### Memory Usage Too High

**Issue**: Application uses excessive memory or crashes with "JavaScript heap out of memory" error.

**Solution**:

1. Increase Node.js memory limit:

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm start
```

2. Enable memory management optimization:

```bash
echo "OPTIMIZE_MEMORY=true" >> .env
```

3. Consider implementing database pagination and limiting the number of newsletters processed in parallel.

### Diagnostic Information

When reporting issues, include the following information:

1. Application logs (from the `logs` directory)
2. Output of the diagnostic command:

```bash
npm run diagnose
```

3. Environment information:

```bash
npm run env-info
```

4. Version information:

```bash
npm run version
```

### Getting Support

- **GitHub Issues**: Report bugs and feature requests [GitHub Issues](https://github.com/your-org/hypat.ai/issues)
- **Documentation**: Full documentation is available at [docs.hypat.ai](https://docs.hypat.ai)
- **Community Forum**: Join the discussion at [community.hypat.ai](https://community.hypat.ai)

## Performance Optimization

Based on our integration testing, we've identified several performance optimizations:

### Email Rendering Optimization

We've simplified the email template rendering system to use plain HTML instead of the more complex MJML framework. This change has significantly improved rendering performance and reliability based on our test results.

### Database Query Optimization

For larger newsletter collections, use the following optimizations:

1. Enable the query cache:

```bash
echo "QUERY_CACHE_ENABLED=true" >> .env
```

2. Add appropriate indexes based on your usage patterns:

```bash
npm run db:optimize
```

### Memory Management

The application implements several memory management strategies:

1. Streaming large content instead of loading it all into memory
2. Automatic garbage collection during idle periods
3. Resource pooling for database connections

To enable additional memory optimizations:

```bash
echo "MEMORY_OPTIMIZATION_LEVEL=high" >> .env
```

## Security Considerations

### API Credentials Protection

Gmail API credentials should be treated as sensitive information:

1. Never commit `credentials.json` or `.env` to version control
2. Use environment variables instead of files in production environments
3. Consider using a secrets management service for production deployments

### Data Protection

User email data is sensitive and should be protected:

1. Enable database encryption (PostgreSQL only):

```bash
echo "DATABASE_ENCRYPTION_KEY=your_secure_key" >> .env
```

2. For SQLite, ensure the database file has appropriate permissions:

```bash
chmod 600 ./data/hypat.ai.db
```

3. Implement regular security audits

---

This deployment guide reflects our current understanding of the system based on integration testing. As we continue to develop and refine Hypat.ai, this documentation will be updated to reflect best practices and new features.