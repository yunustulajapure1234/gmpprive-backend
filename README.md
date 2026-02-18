# 🚀 GMP Privé - Backend API

Complete REST API for GMP Privé Salon & Spa booking system with MongoDB, Express.js, JWT authentication, and admin management.

## 📋 Features

### ✅ Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Admin & Super Admin)
- Protected routes with middleware

### ✅ Admin Management
- Admin registration (Super Admin only)
- Admin login with JWT
- Profile management
- Password change
- View all admins (Super Admin only)

### ✅ Service Management
- CRUD operations for services
- Separate management for Men & Women services
- Bilingual support (English & Arabic)
- Category management
- Active/Inactive status toggle
- Search functionality

### ✅ Booking Management
- Create bookings (Public)
- View all bookings (Admin)
- Update booking status
- Booking statistics
- WhatsApp integration tracking
- Filter by date, status, phone

### ✅ Security
- Helmet.js for security headers
- Rate limiting
- CORS configuration
- Input validation
- Error handling

---

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing

---

## 📦 Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Environment Variables
Create `.env` file in root:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/gmp-prive
JWT_SECRET=your_super_secret_jwt_key_12345
JWT_EXPIRE=30d
ADMIN_EMAIL=admin@gmpprive.com
ADMIN_PASSWORD=admin123
FRONTEND_URL=http://localhost:3000
```

### Step 3: Start MongoDB
```bash
# Local MongoDB
mongod

# OR use MongoDB Atlas (cloud)
# Just update MONGODB_URI in .env
```

### Step 4: Seed Database (Optional but Recommended)
```bash
npm run seed
```

This will create:
- 1 Super Admin account
- 5 Women services
- 5 Men services

### Step 5: Start Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will run at: `http://localhost:5000`

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Most endpoints require JWT token in header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 Admin Routes

### 1. Login
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@gmpprive.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "id": "...",
      "name": "Super Admin",
      "email": "admin@gmpprive.com",
      "role": "super-admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Register Admin (Super Admin Only)
```http
POST /api/admin/register
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "New Admin",
  "email": "newadmin@gmpprive.com",
  "password": "password123",
  "role": "admin"
}
```

### 3. Get Current Admin
```http
GET /api/admin/me
Authorization: Bearer YOUR_JWT_TOKEN
```

### 4. Update Profile
```http
PUT /api/admin/update-profile
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@gmpprive.com"
}
```

### 5. Change Password
```http
PUT /api/admin/change-password
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

### 6. Get All Admins (Super Admin Only)
```http
GET /api/admin/all
Authorization: Bearer YOUR_JWT_TOKEN
```

### 7. Delete Admin (Super Admin Only)
```http
DELETE /api/admin/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 💇 Service Routes

### 1. Get All Services (Public)
```http
GET /api/services
GET /api/services?gender=women
GET /api/services?category=Hair Services
GET /api/services?search=haircut
```

### 2. Get Services by Gender (Public)
```http
GET /api/services/gender/women
GET /api/services/gender/men
```

### 3. Get Single Service (Public)
```http
GET /api/services/:id
```

### 4. Get Categories by Gender (Public)
```http
GET /api/services/categories/women
GET /api/services/categories/men
```

### 5. Create Service (Admin)
```http
POST /api/services
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Professional Haircut",
  "nameAr": "قص شعر احترافي",
  "description": "Expert haircut with styling",
  "descriptionAr": "قص شعر خبير مع التصفيف",
  "price": 150,
  "duration": "60 min",
  "image": "https://images.unsplash.com/...",
  "category": "Hair Services",
  "categoryAr": "خدمات الشعر",
  "gender": "women"
}
```

### 6. Update Service (Admin)
```http
PUT /api/services/:id
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Updated Service Name",
  "price": 200
}
```

### 7. Delete Service (Admin)
```http
DELETE /api/services/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

### 8. Toggle Service Status (Admin)
```http
PATCH /api/services/:id/toggle-active
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📅 Booking Routes

### 1. Create Booking (Public)
```http
POST /api/bookings
Content-Type: application/json

{
  "customerName": "John Doe",
  "phone": "+971501234567",
  "email": "john@example.com",
  "date": "2024-02-15",
  "time": "14:00",
  "address": "Dubai Marina, Tower A, Apt 1234",
  "services": [
    {
      "serviceId": "65abc123...",
      "quantity": 1
    },
    {
      "serviceId": "65abc456...",
      "quantity": 2
    }
  ],
  "notes": "Please bring all equipment"
}
```

### 2. Get All Bookings (Admin)
```http
GET /api/bookings
GET /api/bookings?status=pending
GET /api/bookings?date=2024-02-15
GET /api/bookings?phone=971501234567
GET /api/bookings?page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

### 3. Get Single Booking (Admin)
```http
GET /api/bookings/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

### 4. Update Booking Status (Admin)
```http
PUT /api/bookings/:id/status
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "status": "confirmed"
}
```

Status options: `pending`, `confirmed`, `in-progress`, `completed`, `cancelled`

### 5. Mark WhatsApp Sent (Public)
```http
PUT /api/bookings/:id/whatsapp-sent
```

### 6. Get Booking Statistics (Admin)
```http
GET /api/bookings/stats
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBookings": 150,
    "pendingBookings": 10,
    "confirmedBookings": 20,
    "completedBookings": 100,
    "cancelledBookings": 20,
    "todayBookings": 5,
    "totalRevenue": 45000
  }
}
```

### 7. Delete Booking (Admin)
```http
DELETE /api/bookings/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🗄️ Database Schema

### Admin Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'admin' | 'super-admin',
  isActive: Boolean,
  lastLogin: Date,
  timestamps: true
}
```

### Service Schema
```javascript
{
  name: String,
  nameAr: String,
  description: String,
  descriptionAr: String,
  price: Number,
  duration: String,
  image: String,
  category: String,
  categoryAr: String,
  gender: 'women' | 'men',
  isActive: Boolean,
  createdBy: ObjectId (Admin),
  timestamps: true
}
```

### Booking Schema
```javascript
{
  customerName: String,
  phone: String,
  email: String,
  date: Date,
  time: String,
  address: String,
  services: [{
    serviceId: ObjectId,
    serviceName: String,
    serviceNameAr: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number,
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled',
  notes: String,
  whatsappSent: Boolean,
  whatsappSentAt: Date,
  timestamps: true
}
```

---

## 🧪 Testing with Postman

### 1. Import Collection
Create a new collection in Postman

### 2. Set Environment Variables
```
base_url: http://localhost:5000/api
token: (will be set after login)
```

### 3. Test Flow
1. Login → Get token
2. Use token for protected routes
3. Test CRUD operations

---

## 🔒 Security Best Practices

1. **Change Default Credentials**
   - Update `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`

2. **Use Strong JWT Secret**
   - Generate random string for `JWT_SECRET`

3. **Enable HTTPS in Production**
   - Use SSL certificate

4. **Rate Limiting**
   - Already configured (100 requests per 10 minutes)

5. **Input Validation**
   - Validate all inputs on routes

---

## 🚀 Deployment

### Deploy to Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create gmp-prive-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set JWT_SECRET=your_secret

# Deploy
git push heroku main

# Seed database
heroku run npm run seed
```

### Deploy to Render/Railway/DigitalOcean
- Connect GitHub repository
- Set environment variables
- Deploy automatically

---

## 📝 Scripts

```bash
# Start server
npm start

# Development mode (auto-reload)
npm run dev

# Seed database
npm run seed
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service
# Mac: brew services start mongodb-community
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod
```

### Port Already in Use
```bash
# Find process using port 5000
# Mac/Linux: lsof -ti:5000 | xargs kill -9
# Windows: netstat -ano | findstr :5000
```

### JWT Token Issues
- Check if token is valid
- Verify JWT_SECRET matches
- Token might be expired

---

## 📞 Support

For issues or questions, contact the development team.

---

**Made with ❤️ for GMP Privé**
