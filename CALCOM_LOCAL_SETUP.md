# Cal.com Local Setup Guide

This guide helps you set up Cal.com locally in your workspace so it can share the same database as your main application.

## 🎯 Why Local Cal.com?

- **Shared Database**: Use your existing Supabase database
- **Better Integration**: Seamless data flow between your app and Cal.com
- **Development**: Easier to test and debug
- **Cost Effective**: No separate hosting costs

## 🚀 Quick Setup

### Option 1: Use Your Supabase Database (Recommended)

1. **Run the setup script:**

```bash
./scripts/setup-calcom-local.sh
```

2. **Choose to use Supabase database** when prompted

3. **Run the Cal.com schema in Supabase:**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the contents of `sql-queriers/calcom-schema.sql`

4. **Start Cal.com:**

```bash
docker-compose -f docker-compose.cal.yml up -d
```

### Option 2: Separate PostgreSQL Database

1. **Update environment variables:**

```bash
# Add to your .env file
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://calcom:your_secure_password@localhost:5432/calcom
```

2. **Start Cal.com:**

```bash
docker-compose -f docker-compose.cal.yml up -d
```

## 📁 Files Created

### Docker Configuration

- `docker-compose.cal.yml` - Cal.com Docker setup
- `.env.calcom` - Cal.com environment variables

### Database Schema

- `sql-queriers/calcom-schema.sql` - Complete Cal.com database schema for Supabase

### API Integration

- `src/pages/api/vapi/cal-integration-local.ts` - Local Cal.com API integration

### Scripts

- `scripts/setup-calcom-local.sh` - Automated setup script

## 🔧 Configuration

### Environment Variables

Create a `.env.calcom` file with:

```bash
# Database (choose one)
DATABASE_URL=${SUPABASE_URL}  # For Supabase
# OR
DATABASE_URL=postgresql://calcom:password@localhost:5432/calcom  # For separate DB

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# OAuth (optional)
GOOGLE_CONTACTS_CLIENT_ID=your_GOOGLE_CONTACTS_CLIENT_ID
GOOGLE_CONTACTS_CLIENT_SECRET=your_GOOGLE_CONTACTS_CLIENT_SECRET

# Email (optional)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com

# Webhooks
CAL_WEBHOOK_SECRET=your_webhook_secret
```

### Docker Compose Services

The `docker-compose.cal.yml` includes:

- **Cal.com App**: Main application on port 3000
- **PostgreSQL**: Database (if not using Supabase)
- **Redis**: Caching (optional)

## 🗄️ Database Schema

### Tables Created

| Table          | Purpose                        |
| -------------- | ------------------------------ |
| `users`        | Cal.com users                  |
| `event_types`  | Event types and configurations |
| `bookings`     | Appointments and bookings      |
| `availability` | User availability schedules    |
| `schedules`    | User schedules                 |
| `teams`        | Team management                |
| `team_members` | Team membership                |
| `webhooks`     | Webhook configurations         |

### RLS Policies

All tables have Row Level Security (RLS) enabled with policies for:

- Users can only see their own data
- Team members can see team data
- Proper permission management

## 🔌 API Integration

### Local Cal.com API Endpoints

Your Vapi.ai integration can now use:

```typescript
// Local Cal.com API
const calApiUrl = "http://localhost:3000/api";

// Available endpoints:
// GET /api/bookings - List bookings
// POST /api/bookings - Create booking
// GET /api/bookings/:id - Get specific booking
// DELETE /api/bookings/:id - Delete booking
// GET /api/users - List users
// POST /api/users - Create user
// GET /api/event-types - List event types
// GET /api/availability - Get availability
```

### Updated Vapi.ai Integration

Use `src/pages/api/vapi/cal-integration-local.ts` for local Cal.com:

```typescript
// This handles all Cal.com operations locally
POST / api / vapi / cal - integration - local;
```

## 🧪 Testing

### Test Cal.com is Running

```bash
# Check if Cal.com is accessible
curl http://localhost:3000

# Test API endpoints
curl http://localhost:3000/api/users
```

### Test Integration

```bash
# Test the local integration
node scripts/test-vapi-cal-integration.js
```

## 🔧 Management Commands

### Docker Commands

```bash
# Start Cal.com
docker-compose -f docker-compose.cal.yml up -d

# Stop Cal.com
docker-compose -f docker-compose.cal.yml down

# View logs
docker-compose -f docker-compose.cal.yml logs

# Restart Cal.com
docker-compose -f docker-compose.cal.yml restart

# Update Cal.com
docker-compose -f docker-compose.cal.yml pull
docker-compose -f docker-compose.cal.yml up -d
```

### Database Commands

```bash
# Connect to PostgreSQL (if using separate DB)
docker exec -it calcom-postgres psql -U calcom -d calcom

# Backup database
docker exec calcom-postgres pg_dump -U calcom calcom > backup.sql

# Restore database
docker exec -i calcom-postgres psql -U calcom calcom < backup.sql
```

## 🚨 Troubleshooting

### Common Issues

1. **Cal.com won't start**

   ```bash
   # Check logs
   docker-compose -f docker-compose.cal.yml logs calcom

   # Check if port 3000 is available
   lsof -i :3000
   ```

2. **Database connection errors**

   ```bash
   # Check if database is running
   docker-compose -f docker-compose.cal.yml ps

   # Check database logs
   docker-compose -f docker-compose.cal.yml logs postgres
   ```

3. **Permission errors**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod +x scripts/*.sh
   ```

### Debug Mode

Enable debug logging:

```bash
# Add to .env.calcom
DEBUG=calcom:*
LOG_LEVEL=debug
```

## 📊 Monitoring

### Health Checks

```bash
# Check Cal.com health
curl http://localhost:3000/api/health

# Check database connection
curl http://localhost:3000/api/database/health
```

### Logs

```bash
# View all logs
docker-compose -f docker-compose.cal.yml logs

# View specific service logs
docker-compose -f docker-compose.cal.yml logs calcom
docker-compose -f docker-compose.cal.yml logs postgres
```

## 🔄 Updates

### Update Cal.com

```bash
# Pull latest image
docker-compose -f docker-compose.cal.yml pull

# Restart with new image
docker-compose -f docker-compose.cal.yml up -d
```

### Database Migrations

```bash
# Run migrations (if needed)
docker exec calcom-app npx prisma migrate deploy
```

## 🎉 Next Steps

1. **Access Cal.com**: Go to http://localhost:3000
2. **Complete Setup**: Follow the initial setup wizard
3. **Create Event Types**: Set up your first event types
4. **Test Integration**: Use your Vapi.ai assistant to test appointments
5. **Configure Webhooks**: Set up webhooks for your main application

## 📚 Resources

- [Cal.com Documentation](https://cal.com/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vapi.ai Documentation](https://docs.vapi.ai/)

## 🆘 Support

For issues with this setup:

1. Check the troubleshooting section above
2. Review Docker logs: `docker-compose -f docker-compose.cal.yml logs`
3. Verify environment variables are set correctly
4. Ensure ports 3000 and 5432 are available
5. Check database connectivity

## 🔐 Security Notes

- Change default passwords in production
- Use environment variables for sensitive data
- Enable SSL/TLS for production deployments
- Regularly update Docker images
- Monitor access logs
