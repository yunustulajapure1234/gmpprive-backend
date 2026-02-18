const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');
const Service = require('../models/Service');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const seedData = async () => {
  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Admin.deleteMany();
    await Service.deleteMany();

    // Create super admin
    console.log('👤 Creating super admin...');
    const admin = await Admin.create({
      name: 'Super Admin',
      email: process.env.ADMIN_EMAIL || 'admin@gmpprive.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'super-admin'
    });

    console.log(`✅ Super Admin created: ${admin.email}`);

    // Create sample women services
    console.log('💄 Creating women services...');
    const womenServices = await Service.insertMany([
      {
        name: 'Haircut & Styling',
        nameAr: 'قص وتصفيف الشعر',
        description: 'Professional haircut with styling',
        descriptionAr: 'قص شعر احترافي مع التصفيف',
        price: 150,
        duration: '60 min',
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500',
        category: 'Hair Services',
        categoryAr: 'خدمات الشعر',
        gender: 'women',
        createdBy: admin._id
      },
      {
        name: 'Hair Spa Treatment',
        nameAr: 'علاج سبا الشعر',
        description: 'Deep conditioning and nourishment',
        descriptionAr: 'ترطيب عميق وتغذية',
        price: 250,
        duration: '90 min',
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500',
        category: 'Spa & Massage',
        categoryAr: 'سبا وتدليك',
        gender: 'women',
        createdBy: admin._id
      },
      {
        name: 'Hair Coloring',
        nameAr: 'صبغ الشعر',
        description: 'Full color or highlights',
        descriptionAr: 'لون كامل أو خصل',
        price: 350,
        duration: '120 min',
        image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500',
        category: 'Hair Services',
        categoryAr: 'خدمات الشعر',
        gender: 'women',
        createdBy: admin._id
      },
      {
        name: 'Manicure & Pedicure',
        nameAr: 'مانيكير وباديكير',
        description: 'Complete nail care and polish',
        descriptionAr: 'عناية كاملة بالأظافر والطلاء',
        price: 120,
        duration: '75 min',
        image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500',
        category: 'Nail Services',
        categoryAr: 'خدمات الأظافر',
        gender: 'women',
        createdBy: admin._id
      },
      {
        name: 'Facial Treatment',
        nameAr: 'علاج الوجه',
        description: 'Deep cleansing and rejuvenation',
        descriptionAr: 'تنظيف عميق وتجديد',
        price: 200,
        duration: '60 min',
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500',
        category: 'Beauty Services',
        categoryAr: 'خدمات التجميل',
        gender: 'women',
        createdBy: admin._id
      }
    ]);

    console.log(`✅ Created ${womenServices.length} women services`);

    // Create sample men services
    console.log('✂️  Creating men services...');
    const menServices = await Service.insertMany([
      {
        name: 'Classic Haircut',
        nameAr: 'قصة شعر كلاسيكية',
        description: 'Professional men haircut',
        descriptionAr: 'قص شعر احترافي للرجال',
        price: 100,
        duration: '45 min',
        image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500',
        category: 'Hair Services',
        categoryAr: 'خدمات الشعر',
        gender: 'men',
        createdBy: admin._id
      },
      {
        name: 'Beard Grooming',
        nameAr: 'تهذيب اللحية',
        description: 'Professional beard styling',
        descriptionAr: 'تصفيف احترافي للحية',
        price: 80,
        duration: '30 min',
        image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500',
        category: 'Men Grooming',
        categoryAr: 'عناية الرجال',
        gender: 'men',
        createdBy: admin._id
      },
      {
        name: 'Hair & Beard Combo',
        nameAr: 'باقة الشعر واللحية',
        description: 'Complete haircut and beard styling',
        descriptionAr: 'قصة شعر كاملة وتصفيف اللحية',
        price: 150,
        duration: '60 min',
        image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500',
        category: 'Men Grooming',
        categoryAr: 'عناية الرجال',
        gender: 'men',
        createdBy: admin._id
      },
      {
        name: 'Massage Therapy',
        nameAr: 'علاج بالتدليك',
        description: 'Relaxing full body massage',
        descriptionAr: 'تدليك مريح للجسم بالكامل',
        price: 200,
        duration: '90 min',
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500',
        category: 'Spa & Massage',
        categoryAr: 'سبا وتدليك',
        gender: 'men',
        createdBy: admin._id
      },
      {
        name: 'Hair Color & Style',
        nameAr: 'لون الشعر والتصفيف',
        description: 'Hair coloring with professional styling',
        descriptionAr: 'صبغ الشعر مع تصفيف احترافي',
        price: 250,
        duration: '90 min',
        image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=500',
        category: 'Hair Services',
        categoryAr: 'خدمات الشعر',
        gender: 'men',
        createdBy: admin._id
      }
    ]);

    console.log(`✅ Created ${menServices.length} men services`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
