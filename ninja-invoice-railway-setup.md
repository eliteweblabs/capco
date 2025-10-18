# Ninja Invoice Railway Deployment

## 🚀 Railway Deployment Guide

### Prerequisites

1. **Railway Account** - Sign up at [railway.app](https://railway.app)
2. **GitHub Repository** - Fork or clone [Ninja Invoice](https://github.com/invoiceninja/invoiceninja)
3. **Railway CLI** - Install from [railway.app/docs](https://railway.app/docs)

### Step 1: Prepare Repository

```bash
# Clone Ninja Invoice
git clone https://github.com/invoiceninja/invoiceninja.git
cd invoiceninja

# Copy Railway configuration
cp railway-ninja-invoice.json railway.json
```

### Step 2: Railway Deployment

```bash
# Login to Railway
railway login

# Create new project
railway new

# Deploy from GitHub
railway up
```

### Step 3: Environment Variables

Set these in Railway dashboard:

```bash
# App Configuration
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-ninja-invoice.railway.app

# Database (Auto-configured by Railway)
DB_CONNECTION=mysql
DB_HOST=${{MYSQL_HOST}}
DB_PORT=${{MYSQL_PORT}}
DB_DATABASE=${{MYSQL_DATABASE}}
DB_USERNAME=${{MYSQL_USER}}
DB_PASSWORD=${{MYSQL_PASSWORD}}

# Redis (Auto-configured by Railway)
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=${{REDIS_HOST}}
REDIS_PORT=${{REDIS_PORT}}

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host.com
MAIL_PORT=587
MAIL_USERNAME=your-email@domain.com
MAIL_PASSWORD=your-email-password
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="Ninja Invoice"

# API Configuration
API_SECRET=your-secure-api-key-here
```

### Step 4: Database Setup

```bash
# Connect to Railway service
railway connect

# Run migrations
php artisan migrate

# Seed database
php artisan db:seed

# Create admin user
php artisan ninja:create-user
```

### Step 5: Fire Protection System Integration

Update your main project's `.env`:

```bash
# Ninja Invoice Integration
NINJA_INVOICE_URL=https://your-ninja-invoice.railway.app
NINJA_INVOICE_API_URL=https://your-ninja-invoice.railway.app/api
NINJA_INVOICE_API_KEY=your-api-key-from-ninja-invoice
```

### Step 6: Custom Domain (Optional)

1. Go to Railway dashboard
2. Select your Ninja Invoice service
3. Go to Settings → Domains
4. Add your custom domain
5. Update DNS records as instructed

### Step 7: SSL Certificate

Railway automatically provides SSL certificates for:

- `*.railway.app` domains
- Custom domains (after DNS setup)

## 🔧 Railway-Specific Configuration

### Buildpack Detection

Railway will automatically detect:

- **PHP** - Laravel application
- **MySQL** - Database service
- **Redis** - Cache service

### Environment Variables

Railway provides these automatically:

- `${{MYSQL_HOST}}` - Database host
- `${{MYSQL_PORT}}` - Database port
- `${{MYSQL_DATABASE}}` - Database name
- `${{MYSQL_USER}}` - Database user
- `${{MYSQL_PASSWORD}}` - Database password
- `${{REDIS_HOST}}` - Redis host
- `${{REDIS_PORT}}` - Redis port
- `${{RAILWAY_PUBLIC_DOMAIN}}` - Public domain

### Monitoring

Railway provides:

- **Logs** - Real-time application logs
- **Metrics** - CPU, memory, network usage
- **Health Checks** - Automatic service monitoring

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:

   ```bash
   # Check build logs
   railway logs

   # Restart deployment
   railway redeploy
   ```

2. **Database Connection**:

   ```bash
   # Check database status
   railway status

   # Test connection
   railway run php artisan migrate:status
   ```

3. **Environment Variables**:

   ```bash
   # List all variables
   railway variables

   # Set new variable
   railway variables:set KEY=value
   ```

### Logs and Debugging

```bash
# View logs
railway logs

# Connect to service
railway connect

# Run commands
railway run php artisan cache:clear
railway run php artisan config:cache
```

## 🔒 Security

### Production Checklist

- [ ] Change default passwords
- [ ] Set `APP_DEBUG=false`
- [ ] Configure proper mail settings
- [ ] Set secure `API_SECRET`
- [ ] Enable HTTPS (automatic on Railway)
- [ ] Configure firewall rules
- [ ] Regular backups

### Backup Strategy

```bash
# Database backup
railway run mysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > backup.sql

# File backup
railway run tar -czf storage-backup.tar.gz storage/
```

## 📊 Monitoring

### Railway Dashboard

- **Deployments** - View deployment history
- **Metrics** - CPU, memory, network usage
- **Logs** - Real-time application logs
- **Variables** - Environment configuration

### Health Checks

Railway automatically monitors:

- Service availability
- Database connectivity
- Redis connectivity
- Application health

## 🎯 Integration with Fire Protection System

Once deployed, update your main system:

1. **Get Ninja Invoice URL** from Railway dashboard
2. **Create API key** in Ninja Invoice admin
3. **Update environment variables** in your main project
4. **Test integration** via the demo page

The integration will automatically:

- Create invoices from project data
- Sync with your fire protection system
- Handle all invoicing complexity
- Provide admin access via sidebar
