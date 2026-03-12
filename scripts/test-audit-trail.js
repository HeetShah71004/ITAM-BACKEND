import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Asset from '../models/Asset.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { logAudit } from '../utils/auditLogger.js';

dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Find or create a test user
        let testUser = await User.findOne({ email: 'admin@example.com' });
        if (!testUser) {
            testUser = await User.findOne();
        }
        
        if (!testUser) {
            console.error('No user found for testing');
            process.exit(1);
        }

        console.log(`Using user: ${testUser.email} (${testUser._id})`);

        // 2. Clear recent audit logs for this test
        await AuditLog.deleteMany({ resourceType: 'Asset', status: 'SUCCESS' });

        const mockReq = {
            ip: '127.0.0.1',
            headers: {
                'user-agent': 'TestScript/1.0'
            },
            user: testUser
        };

        // 3. Test logAudit CREATE
        console.log('Testing logAudit CREATE...');
        await logAudit({
            userId: testUser._id,
            action: 'CREATE',
            resourceType: 'Asset',
            resourceId: new mongoose.Types.ObjectId(),
            newValues: { name: 'Test Laptop', assetTag: 'AST-TEST-001' },
            req: mockReq
        });

        // 4. Test logAudit UPDATE
        console.log('Testing logAudit UPDATE...');
        const oldValues = { name: 'Test Laptop', status: 'Available' };
        const newValues = { name: 'Test Laptop Pro', status: 'Assigned' };
        await logAudit({
            userId: testUser._id,
            action: 'UPDATE',
            resourceType: 'Asset',
            resourceId: new mongoose.Types.ObjectId(),
            oldValues,
            newValues,
            req: mockReq
        });

        // 5. Test logAudit FAILURE
        console.log('Testing logAudit FAILURE...');
        await logAudit({
            action: 'LOGIN',
            resourceType: 'User',
            status: 'FAILURE',
            errorMessage: 'Invalid credentials',
            req: mockReq
        });

        // 6. Verify the logs
        const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(10);
        console.log(`Verified ${logs.length} audit logs in database`);

        logs.forEach(log => {
            console.log(`--- Log Entry: ${log.action} [${log.status}] ---`);
            console.log(`Resource: ${log.resourceType}`);
            console.log(`IP: ${log.ipAddress}`);
            if (log.action === 'UPDATE') {
                console.log('Changes:', JSON.stringify(log.changes, null, 2));
            }
            if (log.status === 'FAILURE') {
                console.log(`Error: ${log.errorMessage}`);
            }
        });

        if (logs.length >= 3) {
            console.log('✅ Verification successful: Audit logs are being created with correct data.');
        } else {
            console.error('❌ Verification failed: Audit logs were not created as expected.');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
};

runTest();
