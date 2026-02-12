# Validation Test Examples

## Test these in Postman or your API client

### Asset Validation Tests

#### ✅ Valid Asset
POST /api/assets
```json
{
  "assetTag": "LAP001",
  "name": "Dell Latitude 5420",
  "category": "Laptop",
  "brand": "Dell",
  "model": "Latitude 5420",
  "serialNumber": "SN123456789",
  "purchaseDate": "2024-01-15",
  "purchaseCost": 1299.99,
  "warrantyExpiry": "2027-01-15",
  "status": "Available",
  "location": "IT Department",
  "notes": "New laptop for development team"
}
```

#### ❌ Invalid Asset (Multiple Errors)
```json
{
  "assetTag": "A1",
  "name": "L",
  "category": "InvalidCategory",
  "purchaseCost": -100,
  "purchaseDate": "2027-01-01"
}
```
Expected Errors:
- assetTag: must be at least 3 characters
- name: must be at least 2 characters
- category: not a valid category
- purchaseCost: cannot be negative
- purchaseDate: cannot be in the future

---

### Employee Validation Tests

#### ✅ Valid Employee
POST /api/employees
```json
{
  "employeeId": "EMP001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phone": "+1-555-123-4567",
  "department": "IT",
  "designation": "Software Engineer",
  "joiningDate": "2024-01-15",
  "status": "Active"
}
```

#### ❌ Invalid Employee (Multiple Errors)
```json
{
  "employeeId": "E1",
  "firstName": "John123",
  "email": "invalid-email",
  "phone": "123",
  "department": "InvalidDept",
  "joiningDate": "2027-01-01"
}
```
Expected Errors:
- employeeId: must be at least 3 characters
- firstName: can only contain letters
- email: invalid email format
- phone: invalid phone number
- department: not a valid department
- joiningDate: cannot be in the future

---

### Assignment History Validation Tests

#### ✅ Valid Assignment (Format 1: using 'asset' and 'employee')
POST /api/assignments/assign
```json
{
  "asset": "507f1f77bcf86cd799439011",
  "employee": "507f191e810c19729de860ea",
  "assignedDate": "2024-01-15",
  "assignedBy": "Admin User",
  "notes": "Initial laptop assignment"
}
```

#### ✅ Valid Assignment (Format 2: using 'assetId' and 'employeeId')
POST /api/assignments/assign
```json
{
  "assetId": "507f1f77bcf86cd799439011",
  "employeeId": "507f191e810c19729de860ea",
  "assignedDate": "2024-01-15",
  "assignedBy": "Admin User",
  "notes": "Initial laptop assignment"
}
```

> **Note**: Both formats are supported! You can use either `asset`/`employee` or `assetId`/`employeeId` field names.

#### ❌ Invalid Assignment (Multiple Errors)
```json
{
  "asset": "invalid-id",
  "employee": "invalid-id",
  "assignedDate": "2027-01-01",
  "returnedDate": "2024-01-01",
  "returnCondition": "Good"
}
```
Expected Errors:
- asset: invalid asset ID
- employee: invalid employee ID
- assignedDate: cannot be in the future
- returnedDate: must be after assigned date
- returnCondition: can only be set when asset is returned

---

## Available Enum Values

### Asset Categories
- Laptop
- Desktop
- Monitor
- Printer
- Scanner
- Phone
- Tablet
- Server
- Network Equipment
- Accessories
- Software
- Other

### Asset Status
- Available
- Assigned
- Under Repair
- Retired

### Employee Departments
- IT
- HR
- Finance
- Marketing
- Sales
- Operations
- Engineering
- Design
- Customer Support
- Administration
- Other

### Employee Status
- Active
- Inactive

### Return Conditions
- Good
- Fair
- Damaged
- Lost
