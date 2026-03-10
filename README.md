# ITAM Backend API

IT Asset Management (ITAM) — A production-ready RESTful API for managing IT assets, vendors, employees, software licenses, maintenance records, and assignments. Features include image uploads, email notifications, role-based access control (RBAC), and automated reporting.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| **Asset Management** | Full CRUD for IT assets with Cloudinary image uploads and QR code scanning. |
| **Vendor Management** | Manage hardware/software vendors with contact details and performance tracking. |
| **Maintenance Records** | Track service history, repair costs, and downtime for specific assets. |
| **Employee Management** | Employee lifecycle tracking with profile image support. |
| **Software Licenses** | License management, assignment, revocation, and compliance tracking. |
| **Asset Assignments** | Track movement of assets with detailed history and return workflows. |
| **RBAC & Security** | Secure endpoints with JWT and Role-Based Access Control (Admin, Manager, Auditor). |
| **Dashboard & Analytics** | Utilization metrics, monthly trends, and automated warranty/expiry alerts. |
| **Activity Log** | Comprehensive audit trail for tracking system-wide changes. |
| **Data Export** | Export reports to Excel/PDF formats for auditing and management. |
| **Public Asset View** | Public-facing asset detail page for quick verification via QR scans. |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js (ESModule) |
| **Framework** | Express.js v5 |
| **Database** | MongoDB + Mongoose v9 |
| **Auth** | JWT (JSON Web Tokens) + Bcrypt |
| **Image Storage** | Cloudinary (Production) / Local Disk (Dev) |
| **File Upload** | Multer |
| **Email** | Nodemailer (Gmail integration) |
| **Scheduler** | node-cron (Automated Alerts) |
| **Reports** | exceljs / PDF generation |

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
JWT_SECRET=your_jwt_secret_key

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

## 🌐 API Reference

### 🔐 Authentication — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Authenticate and receive JWT |
| `POST` | `/api/auth/logout` | Clear authentication session |

### 💻 Assets — `/api/assets`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/assets` | Get all assets (supports pagination/search) |
| `GET` | `/api/assets/:id` | Get asset by ID |
| `POST` | `/api/assets` | Create new asset (supports images) |
| `PUT` | `/api/assets/:id` | Update asset details |
| `DELETE` | `/api/assets/:id` | Remove asset and stored images |

### 🤝 Vendors — `/api/vendors`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/vendors` | List all verified vendors |
| `POST` | `/api/vendors` | Add a new vendor |
| `GET` | `/api/vendors/:id` | Vendor profile & performance |
| `PUT` | `/api/vendors/:id` | Update vendor information |

### 🛠️ Maintenance — `/api/maintenance`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/maintenance/asset/:assetId` | View service history for an asset |
| `POST` | `/api/maintenance` | Log a new maintenance activity |
| `GET` | `/api/maintenance/cost-analysis` | Maintenance cost reports |

### 👤 Employees — `/api/employees`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/employees` | Get all employees |
| `POST` | `/api/employees` | Create new employee (with profile image) |
| `GET` | `/api/employees/:id/history` | Track asset assignment history |

---

## 📁 Project Structure

```
ITAM-BACKEND/
├── config/               # Database, Cloudinary, and Passport configs
├── controllers/          # Business logic for all modules
├── jobs/                 # Cron jobs for automated notifications
├── middleware/           # Auth, JWT, RBAC, and Upload middlewares
├── models/               # Mongoose schemas (Asset, Employee, Vendor, etc.)
├── router/               # Route definitions grouped by module
├── services/             # External service integrations (Email, Cloudinary)
├── utils/                # Pattern helpers (asyncHandler, responseHandler)
├── server/               # Express app initialization
└── .env                  # Environment variables
```

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

---

## 🚢 Deployment

The project is built for easy deployment on platforms like Render or Heroku. Refer to `render.yaml` for configuration details.

---

## 📝 License
ISC
