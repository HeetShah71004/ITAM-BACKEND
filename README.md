# ITAM Backend API

IT Asset Management Backend - RESTful API for managing IT assets, employees, and asset assignments.

## 🚀 Features

✅ **Asset Management** - Complete CRUD operations for IT assets  
✅ **Employee Management** - Employee lifecycle management  
✅ **Asset Assignment** - Assign/return assets with transaction support  
✅ **Assignment History** - Track complete asset assignment history  
✅ **Dashboard Statistics** - Real-time analytics and insights ⭐ NEW

## 📊 Dashboard API Endpoints

### GET /api/dashboard/stats
Comprehensive dashboard statistics including:
- Asset counts by status and category
- Total and average asset values
- Employee statistics by department
- Assignment tracking
- Recent activity (last 5 assignments)
- Warranty expiry alerts (next 30 days)

### GET /api/dashboard/utilization
Asset utilization metrics:
- Total assets
- Assigned vs available assets
- Utilization rate percentage

### GET /api/dashboard/trends
Monthly assignment trends for the last 6 months

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Environment:** dotenv for configuration

## 📦 Installation

```bash
# Install dependencies
npm install

# Setup environment variables
# Create .env file with:
# MONGODB_URI=your_mongodb_connection_string
# PORT=5000
# NODE_ENV=development

# Run development server
npm run dev

# Run production server
npm start
```

## 🌐 API Endpoints

### Assets
- `GET /api/assets` - Get all assets
- `GET /api/assets/:id` - Get asset by ID
- `POST /api/assets` - Create new asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Assignments
- `POST /api/assignments/assign` - Assign asset to employee
- `POST /api/assignments/return` - Return asset
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/asset/:assetId` - Asset assignment history
- `GET /api/assignments/employee/:employeeId` - Employee assignment history

### Dashboard ⭐ NEW
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/utilization` - Asset utilization
- `GET /api/dashboard/trends` - Assignment trends

## 📝 Testing

Use Postman, cURL, or any HTTP client to test the endpoints.

See [DASHBOARD_API_TESTING.md](./DASHBOARD_API_TESTING.md) for detailed testing guide.

## 🔒 Response Format

All endpoints return consistent JSON responses:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

## 📄 License

ISC
