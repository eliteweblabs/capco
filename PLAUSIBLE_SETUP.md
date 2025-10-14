# Self-Hosted Plausible Analytics Setup

This guide will help you set up Plausible Analytics as a self-hosted solution in your workspace.

## 🚀 Quick Start

### 1. Start Plausible Analytics

```bash
./start-plausible.sh
```

### 2. Access the Dashboard

- **URL**: http://localhost:8000
- **Admin Email**: admin@capcofire.com
- **Password**: Check `.env.plausible` file for `ADMIN_USER_PWD`

### 3. Add Your Site

1. Login to Plausible Analytics
2. Click "Add Site"
3. Enter your domain: `capcofire.com`
4. Copy the tracking script

## 📊 Integration with Your App

### Option 1: Direct Integration (Recommended)

Your analytics page now supports both self-hosted and external analytics:

- **Self-Hosted**: Uses your local Plausible instance
- **External**: Uses the original API approach

### Option 2: Embed Plausible Dashboard

You can also embed the Plausible dashboard directly in your analytics page:

```html
<iframe src="http://localhost:8000/capcofire.com" width="100%" height="800px" frameborder="0">
</iframe>
```

## 🔧 Configuration

### Environment Variables

Create a `.env.plausible` file with:

```bash
# Plausible Analytics Configuration
SECRET_KEY_BASE=your_secret_key_here
ADMIN_USER_EMAIL=admin@capcofire.com
ADMIN_USER_NAME=CAPCo Admin
ADMIN_USER_PWD=your_secure_password
BASE_URL=http://localhost:8000
```

### API Integration

To use the API integration, add these to your main `.env`:

```bash
# Self-hosted Plausible API
PLAUSIBLE_URL=http://localhost:8000
PLAUSIBLE_API_KEY=your_api_key_from_plausible
```

## 📈 Features

### Self-Hosted Plausible Includes:

- ✅ **Real-time analytics**
- ✅ **Privacy-focused** (no cookies, GDPR compliant)
- ✅ **Lightweight** (under 1KB tracking script)
- ✅ **Custom dashboard** styling
- ✅ **API access** for custom integrations
- ✅ **Multiple sites** support
- ✅ **Goal tracking**
- ✅ **Custom events**

### Analytics Data Available:

- Page views
- Unique visitors
- Bounce rate
- Visit duration
- Top pages
- Referrers
- Countries
- Devices
- Browsers

## 🛠️ Management Commands

### Start Services

```bash
docker-compose -f docker-compose.plausible.yml up -d
```

### Stop Services

```bash
docker-compose -f docker-compose.plausible.yml down
```

### View Logs

```bash
docker-compose -f docker-compose.plausible.yml logs -f
```

### Restart Services

```bash
docker-compose -f docker-compose.plausible.yml restart
```

### Update Plausible

```bash
docker-compose -f docker-compose.plausible.yml pull
docker-compose -f docker-compose.plausible.yml up -d
```

## 🔒 Security Notes

1. **Change default passwords** in production
2. **Use HTTPS** in production
3. **Backup your data** regularly
4. **Monitor resource usage**
5. **Keep Docker images updated**

## 📊 Production Deployment

For production deployment:

1. **Update BASE_URL** to your domain
2. **Use HTTPS** certificates
3. **Set up proper backups**
4. **Configure monitoring**
5. **Use environment variables** for secrets

## 🆘 Troubleshooting

### Common Issues:

1. **Port conflicts**: Change ports in docker-compose.plausible.yml
2. **Permission issues**: Check Docker permissions
3. **Database errors**: Check PostgreSQL logs
4. **Memory issues**: Increase Docker memory limits

### Logs to Check:

```bash
# Check all services
docker-compose -f docker-compose.plausible.yml logs

# Check specific service
docker-compose -f docker-compose.plausible.yml logs plausible
```

## 📚 Additional Resources

- [Plausible Documentation](https://plausible.io/docs)
- [Self-Hosting Guide](https://plausible.io/docs/self-hosting)
- [API Documentation](https://plausible.io/docs/api)
- [Docker Compose Reference](https://docs.docker.com/compose/)

## 🎯 Next Steps

1. **Start Plausible**: Run `./start-plausible.sh`
2. **Configure your site**: Add capcofire.com to Plausible
3. **Add tracking script**: Include in your app
4. **Test analytics**: Visit your site and check data
5. **Customize dashboard**: Style to match your app
