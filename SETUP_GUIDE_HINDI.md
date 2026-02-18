# 🚀 Backend Setup Guide (Hindi/Urdu)

## ✅ Kya Banaya Hai?

Complete **REST API Backend** with:
- ✅ **MongoDB Database** - Data storage
- ✅ **JWT Authentication** - Secure login
- ✅ **Admin Management** - Multiple admins
- ✅ **Service CRUD** - Add/Edit/Delete services
- ✅ **Booking System** - Customer bookings
- ✅ **Security** - Rate limiting, helmet, CORS

---

## 📦 Installation Steps

### Step 1: MongoDB Install Karo

**Option A: Local MongoDB**
1. Download: https://www.mongodb.com/try/download/community
2. Install karo
3. Start karo:
```bash
# Mac
brew services start mongodb-community

# Windows
net start MongoDB

# Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud - Recommended)**
1. Account banao: https://www.mongodb.com/cloud/atlas
2. Free cluster banao
3. Connection string copy karo
4. `.env` mein paste karo

### Step 2: Backend Setup
```bash
cd backend
npm install
```

### Step 3: Environment Variables Setup
```bash
# Copy example file
cp .env.example .env

# Edit .env file
nano .env  # ya koi bhi editor use karo
```

**Important Settings:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gmp-prive
# Ya Atlas URI: mongodb+srv://username:password@cluster.mongodb.net/gmp-prive

JWT_SECRET=koi_bhi_random_secure_string_yahan_daalo_12345
ADMIN_EMAIL=admin@gmpprive.com
ADMIN_PASSWORD=admin123
FRONTEND_URL=http://localhost:3000
```

### Step 4: Database Seed Karo
```bash
npm run seed
```

Yeh create karega:
- 1 Super Admin account
- 5 Women services
- 5 Men services

### Step 5: Server Start Karo
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

Server chalu ho jayega: `http://localhost:5000`

---

## 🧪 Testing Kaise Karein?

### Option 1: Postman Use Karo

#### 1. Login Request
```
POST http://localhost:5000/api/admin/login
Content-Type: application/json

{
  "email": "admin@gmpprive.com",
  "password": "admin123"
}
```

Response mein **token** milega - isko copy karo!

#### 2. Get Services (Public)
```
GET http://localhost:5000/api/services
```

#### 3. Create Service (Admin - Token Required)
```
POST http://localhost:5000/api/services
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "name": "New Service",
  "nameAr": "خدمة جديدة",
  "description": "Service description",
  "descriptionAr": "وصف الخدمة",
  "price": 200,
  "duration": "60 min",
  "image": "https://images.unsplash.com/...",
  "category": "Hair Services",
  "categoryAr": "خدمات الشعر",
  "gender": "women"
}
```

### Option 2: Browser Se Test (Simple Routes)

1. Health Check:
   - Open: `http://localhost:5000/health`

2. Get All Services:
   - Open: `http://localhost:5000/api/services`

3. Get Women Services:
   - Open: `http://localhost:5000/api/services/gender/women`

---

## 🔗 Frontend Se Connect Karna

### Frontend mein API Base URL Set Karo

**Option 1: Environment Variable**
Frontend ke `.env` mein:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

**Option 2: Config File**
```javascript
// src/config/api.js
export const API_BASE_URL = 'http://localhost:5000/api';
```

### API Calls Example

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  // Store token
  localStorage.setItem('token', data.data.token);
  return data;
};

// Get Services
const getServices = async (gender) => {
  const response = await fetch(`http://localhost:5000/api/services/gender/${gender}`);
  const data = await response.json();
  return data.data;
};

// Create Service (with auth)
const createService = async (serviceData) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/services', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(serviceData)
  });
  
  return await response.json();
};

// Create Booking
const createBooking = async (bookingData) => {
  const response = await fetch('http://localhost:5000/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bookingData)
  });
  
  return await response.json();
};
```

---

## 📊 Available API Endpoints

### **Public Routes** (No Token Required)
```
GET  /health                          - Health check
GET  /api/services                    - All services
GET  /api/services/gender/:gender     - Services by gender
GET  /api/services/:id                - Single service
GET  /api/services/categories/:gender - Categories
POST /api/admin/login                 - Admin login
POST /api/bookings                    - Create booking
```

### **Protected Routes** (Token Required)
```
// Admin Management
GET    /api/admin/me                  - Current admin
PUT    /api/admin/update-profile      - Update profile
PUT    /api/admin/change-password     - Change password
POST   /api/admin/register            - Register admin (Super Admin)
GET    /api/admin/all                 - All admins (Super Admin)
DELETE /api/admin/:id                 - Delete admin (Super Admin)

// Service Management
POST   /api/services                  - Create service
PUT    /api/services/:id              - Update service
DELETE /api/services/:id              - Delete service
PATCH  /api/services/:id/toggle-active - Toggle status

// Booking Management
GET    /api/bookings                  - All bookings
GET    /api/bookings/stats            - Statistics
GET    /api/bookings/:id              - Single booking
PUT    /api/bookings/:id/status       - Update status
DELETE /api/bookings/:id              - Delete booking
```

---

## 🔐 Admin Credentials (Default)

After running `npm run seed`:
```
Email: admin@gmpprive.com
Password: admin123
Role: super-admin
```

⚠️ **Production mein yeh credentials change kar dena!**

---

## 🐛 Common Problems & Solutions

### 1. "MongoDB connection error"
**Solution:**
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
# Mac: brew services start mongodb-community
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod
```

### 2. "Port 5000 already in use"
**Solution:**
```bash
# Kill process on port 5000
# Mac/Linux:
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID [PID_NUMBER] /F

# Ya .env mein PORT change karo
PORT=5001
```

### 3. "npm install" mein error
**Solution:**
```bash
# Node version check karo (14+ chahiye)
node --version

# npm update karo
npm install -g npm@latest

# node_modules delete karke re-install
rm -rf node_modules package-lock.json
npm install
```

### 4. "JWT token invalid"
**Solution:**
- Token expire ho gaya hoga
- Re-login karo aur naya token lo
- JWT_SECRET `.env` mein sahi hai check karo

### 5. Services dikhai nahi de rahi
**Solution:**
```bash
# Database seed dobara run karo
npm run seed

# MongoDB mein manually check karo
# MongoDB Compass use karo ya
mongosh
use gmp-prive
db.services.find()
```

---

## 📱 Testing Flow

### Complete Testing Sequence:

1. **Start Backend**
```bash
cd backend
npm run dev
```

2. **Login (Postman)**
```
POST /api/admin/login
Body: { "email": "admin@gmpprive.com", "password": "admin123" }
```

3. **Copy Token from Response**

4. **Test Protected Route**
```
GET /api/admin/me
Header: Authorization: Bearer YOUR_TOKEN
```

5. **Create Service**
```
POST /api/services
Header: Authorization: Bearer YOUR_TOKEN
Body: { service data }
```

6. **Test Public Routes**
```
GET /api/services
GET /api/services/gender/women
```

7. **Create Booking**
```
POST /api/bookings
Body: { booking data }
```

---

## 🚀 Production Deployment

### Heroku Pe Deploy Karna

```bash
# Heroku CLI install karo
npm install -g heroku

# Login
heroku login

# App banao
heroku create gmp-prive-api

# MongoDB Atlas URI set karo
heroku config:set MONGODB_URI="your_atlas_uri"
heroku config:set JWT_SECRET="random_secure_string"
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Seed database
heroku run npm run seed

# Logs check karo
heroku logs --tail
```

---

## 📞 Help Chahiye?

1. Error console mein dekho
2. MongoDB running hai check karo
3. Environment variables sahi hai verify karo
4. README.md detail se padho

---

**🎉 Backend ready hai! Ab frontend se connect karo aur test karo!**
