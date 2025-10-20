# Ninja Invoice Local Setup with Railway Database

## 🏗️ **Architecture Overview**

```
Your Astro App (Railway)     Ninja Invoice (Local)     Railway Database Services
├── Fire Protection System   ├── Invoice Management     ├── MySQL Database
├── Project Management       ├── Payment Processing     ├── Redis Cache
├── User Interface          ├── Email Templates        └── File Storage
└── API Integration         └── Admin Interface
```

## 🚀 **Setup Steps**

### **Step 1: Deploy Database Services to Railway**

```bash
# Create Railway project for database services
railway new --name "ninja-invoice-database"

# Deploy database services
railway up
```

### **Step 2: Install Ninja Invoice Locally**

```bash
# Clone Ninja Invoice to a separate directory
cd ~/Desktop
git clone https://github.com/invoiceninja/invoiceninja.git
cd invoiceninja

# Install dependencies
composer install

# Copy environment file
cp .env.example .env
```

### **Step 3: Configure Local Environment**

Update `~/Desktop/invoiceninja/.env`:

```bash
# Database (Railway MySQL)
DB_CONNECTION=mysql
DB_HOST=your-railway-mysql-host.railway.app
DB_PORT=3306
DB_DATABASE=ninja_invoice
DB_USERNAME=root
DB_PASSWORD=your-railway-mysql-password

# Redis (Railway Redis)
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=your-railway-redis-host.railway.app
REDIS_PORT=6379

# App Configuration
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
```

### **Step 4: Initialize Database**

```bash
# Run migrations
php artisan migrate

# Seed database
php artisan db:seed

# Create admin user
php artisan ninja:create-user
```

### **Step 5: Start Local Development**

```bash
# Start Ninja Invoice locally
php artisan serve --port=8000
```

### **Step 6: Update Your Astro App**

Update your main project's `.env`:

```bash
# Ninja Invoice Integration
NINJA_INVOICE_URL=http://localhost:8000
NINJA_INVOICE_API_URL=http://localhost:8000/api
NINJA_INVOICE_API_KEY=your-api-key-from-ninja-invoice
```

## 🔧 **Development Workflow**

### **Local Development**

1. **Start your Astro app**: `npm run dev`
2. **Start Ninja Invoice**: `php artisan serve --port=8000`
3. **Both apps run locally** and communicate via API

### **Production Deployment**

1. **Deploy your Astro app** to Railway (as usual)
2. **Deploy Ninja Invoice** to a separate Railway service
3. **Connect them** via Railway's internal networking

## 📊 **Benefits of This Approach**

### **✅ Development Benefits**

- **Local development** - Fast iteration
- **No deployment issues** - Test locally first
- **Full control** - Customize Ninja Invoice as needed
- **Easy debugging** - See logs and errors locally

### **✅ Production Benefits**

- **Separate services** - Independent scaling
- **Database isolation** - Secure data separation
- **API integration** - Clean communication
- **Easy maintenance** - Update services independently

## 🎯 **Integration Points**

### **Your Astro App → Ninja Invoice**

```javascript
// Create invoice
const response = await fetch("/api/ninja-invoice/create", {
  method: "POST",
  body: JSON.stringify({
    projectId: 123,
    clientData: project.client,
    lineItems: fireProtectionLineItems,
  }),
});
```

### **Ninja Invoice → Your Astro App**

```javascript
// Webhook for status updates
app.post("/api/ninja-invoice/webhook", (req, res) => {
  const { invoiceId, status, projectId } = req.body;

  // Update your project status
  updateProject(projectId, { invoiceStatus: status });
});
```

## 🔒 **Security Considerations**

- **API Keys** - Secure communication between services
- **Database Access** - Railway handles security
- **CORS** - Configure for local development
- **Authentication** - Shared user sessions

## 📋 **Next Steps**

1. **Deploy database services** to Railway
2. **Install Ninja Invoice locally**
3. **Configure environment**
4. **Test integration**
5. **Deploy to production** when ready

This approach gives you the best of both worlds - local development speed with production-ready architecture! 🚀
