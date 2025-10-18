# Ninja Invoice Self-Hosted Deployment

This directory contains the Docker configuration for self-hosting Ninja Invoice.

## Quick Start

1. **Clone Ninja Invoice Repository**:

   ```bash
   git clone https://github.com/invoiceninja/invoiceninja.git ninja-invoice
   cd ninja-invoice
   ```

2. **Copy Docker Configuration**:

   ```bash
   cp -r ../docker/ninja-invoice/* .
   ```

3. **Configure Environment**:

   ```bash
   cp env.example .env
   # Edit .env with your settings
   ```

4. **Deploy with Docker Compose**:

   ```bash
   docker-compose up -d
   ```

5. **Initialize Database**:
   ```bash
   docker-compose exec ninja-invoice php artisan migrate
   docker-compose exec ninja-invoice php artisan db:seed
   ```

## Configuration

### Environment Variables

Update your `.env` file with:

```bash
APP_URL=https://your-ninja-invoice-instance.com
DB_DATABASE=ninja_invoice
DB_USERNAME=ninja_user
DB_PASSWORD=your_secure_password
API_SECRET=your-api-secret-key-here
```

### Fire Protection System Integration

Add these to your main `.env` file:

```bash
NINJA_INVOICE_URL=https://your-ninja-invoice-instance.com
NINJA_INVOICE_API_URL=https://your-ninja-invoice-instance.com/api
NINJA_INVOICE_API_KEY=your_api_key_here
```

## Services

- **ninja-invoice**: Main application (Port 8080)
- **mysql**: Database server
- **redis**: Cache and session storage

## Access

- **Application**: http://localhost:8080
- **Admin Panel**: http://localhost:8080/admin
- **API**: http://localhost:8080/api

## Troubleshooting

### Common Issues

1. **Permission Errors**:

   ```bash
   docker-compose exec ninja-invoice chown -R www-data:www-data /var/www
   ```

2. **Database Connection**:

   ```bash
   docker-compose exec ninja-invoice php artisan migrate:status
   ```

3. **Cache Issues**:
   ```bash
   docker-compose exec ninja-invoice php artisan cache:clear
   ```

### Logs

```bash
# Application logs
docker-compose logs ninja-invoice

# Database logs
docker-compose logs mysql

# All services
docker-compose logs
```

## Security

- Change default passwords
- Use HTTPS in production
- Configure firewall rules
- Regular backups
- Keep updated

## Backup

```bash
# Database backup
docker-compose exec mysql mysqldump -u ninja_user -p ninja_invoice > backup.sql

# Full backup
docker-compose down
tar -czf ninja-backup.tar.gz ninja-invoice/
```
