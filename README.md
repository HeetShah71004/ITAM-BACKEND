# ITAM Backend API

IT Asset Management (ITAM) — RESTful API for managing IT assets, employees, software licenses, and asset assignments, with image uploads, email notifications, and scheduled jobs.

---

## 🚀 Features

| Feature | Description |
|---|---|
| **Asset Management** | Full CRUD for IT assets with Cloudinary image uploads |
| **Employee Management** | Employee lifecycle with profile image support |
| **Software Licenses** | License CRUD, assignment, revocation & compliance tracking |
| **Asset Assignments** | Assign / return assets with full history |
| **Dashboard Analytics** | Real-time stats, utilization metrics & monthly trends |
| **Image Uploads** | Cloudinary (production) / local disk (development) |
| **Email Notifications** | Automated emails via Nodemailer + Gmail |
| **Scheduled Jobs** | Cron jobs for warranty & license expiry alerts |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESModule) |
| Framework | Express.js v5 |
| Database | MongoDB + Mongoose v9 |
| Image Storage | Cloudinary (prod) / Local disk (dev) |
| File Upload | Multer + multer-storage-cloudinary |
| Email | Nodemailer |
| Scheduler | node-cron |
| Config | dotenv |
| Dev Tool | nodemon |

---

## 📦 Installation

```bash
# 1. Clone the repository
git clone https://github.com/HeetShah71004/ITAM-BACKEND.git
cd ITAM-BACKEND

# 2. Install dependencies
npm install

# 3. Create and configure environment variables
cp .env.example .env
# Then fill in the values (see Environment Variables section below)

# 4. Run the development server
npm run dev

# 5. Run the production server
npm start
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root with the following keys:

```env
# Server
PORT=5000
NODE_ENV=development          # "development" | "production"

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/ITAM_BACKEND

# Email (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
ADMIN_EMAIL=admin@gmail.com

# Cloudinary (required in production for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note:** In `development` mode images are saved locally under `uploads/`. In `production` mode they are streamed directly to Cloudinary.

---

## 🌐 API Endpoints

### Assets — `/api/assets`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/assets` | Get all assets |
| `GET` | `/api/assets/:id` | Get asset by ID |
| `POST` | `/api/assets` | Create new asset (supports `multipart/form-data` with `image` field) |
| `PUT` | `/api/assets/:id` | Update asset (supports image replacement) |
| `DELETE` | `/api/assets/:id` | Delete asset (deletes image from storage) |
| `POST` | `/api/assets/:id/image` | Upload / replace asset image only |

---

### Employees — `/api/employees`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/employees` | Get all employees |
| `GET` | `/api/employees/:id` | Get employee by ID |
| `POST` | `/api/employees` | Create new employee (supports `multipart/form-data` with `profileImage` field) |
| `PUT` | `/api/employees/:id` | Update employee (supports profile image replacement) |
| `DELETE` | `/api/employees/:id` | Delete employee (deletes profile image & assigned asset images) |
| `POST` | `/api/employees/:id/image` | Upload / replace employee profile image only |

---

### Software Licenses — `/api/licenses`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/licenses` | Get all licenses |
| `GET` | `/api/licenses/:id` | Get license by ID |
| `POST` | `/api/licenses` | Create new license |
| `PUT` | `/api/licenses/:id` | Update license |
| `DELETE` | `/api/licenses/:id` | Delete license |
| `POST` | `/api/licenses/assign` | Assign license to employee |
| `POST` | `/api/licenses/revoke` | Revoke license from employee |
| `GET` | `/api/licenses/expiring` | Get licenses expiring soon |
| `GET` | `/api/licenses/compliance` | Get license compliance report |

---

### Assignments — `/api/assignments`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/assignments` | Get all assignments |
| `POST` | `/api/assignments/assign` | Assign asset to employee |
| `POST` | `/api/assignments/return` | Return an asset |
| `GET` | `/api/assignments/asset/:assetId` | Asset assignment history |
| `GET` | `/api/assignments/employee/:employeeId` | Employee assignment history |

---

### Dashboard — `/api/dashboard`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Overall stats (assets, employees, assignments, warranty alerts) |
| `GET` | `/api/dashboard/utilization` | Asset utilization rate |
| `GET` | `/api/dashboard/trends` | Monthly assignment trends (last 6 months) |

---

## 📁 Project Structure

```
ITAM-BACKEND/
├── config/               # DB & Cloudinary configuration
├── controllers/          # Route handler logic
│   ├── asset.controller.js
│   ├── assignment.controller.js
│   ├── dashboard.controller.js
│   ├── employee.controller.js
│   └── license.controller.js
├── jobs/                 # Scheduled cron jobs (warranty/license alerts)
├── middleware/
│   └── upload.middleware.js   # Multer + Cloudinary/local upload logic
├── models/               # Mongoose schemas
│   ├── Asset.js
│   ├── AssignmentHistory.js
│   ├── Employee.js
│   ├── SoftwareLicense.js
│   └── User.js
├── router/               # Express route definitions
├── server/               # App entry point
├── uploads/              # Local image storage (development only)
├── utils/
│   ├── asyncHandler.js
│   ├── emailService.js
│   └── responseHandler.js
├── .env                  # Environment variables (not committed)
├── render.yaml           # Render.com deployment config
└── package.json
```

---

## 📤 Image Upload Notes

- **Field names:**
  - Assets → `image`
  - Employees → `profileImage`
- **Accepted formats:** JPEG, PNG, WebP (max **5 MB**)
- **Development:** files saved to `uploads/<assets|employees>/`
- **Production:** files streamed to Cloudinary under `itam/<assets|employees>/`
- Send `multipart/form-data` to trigger upload; send `application/json` (with an image URL) to skip Multer and store the URL directly.

---

## 🔒 Response Format

All endpoints return a consistent JSON envelope:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

Error responses include an appropriate HTTP status code and a descriptive `message`.

---

## 🚢 Deployment (Render)

The `render.yaml` file configures automatic deployment to [Render.com](https://render.com):

```yaml
buildCommand: npm install
startCommand: npm start
envVars:
  - NODE_ENV: production
  - PORT: 10000
  - MONGO_URI: <set in Render dashboard>
```

Set `MONGO_URI`, `CLOUDINARY_*`, and `EMAIL_*` variables securely in the Render dashboard.

---

## 📝 Testing

Use **Postman**, **cURL**, or any HTTP client to test endpoints.

Example — create an employee with a profile image:

```bash
curl -X POST http://localhost:5000/api/employees \
  -F "name=Jane Doe" \
  -F "department=Engineering" \
  -F "profileImage=@/path/to/photo.jpg"
```

---

## 📄 License

ISC
