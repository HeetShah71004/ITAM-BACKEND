import axios from 'axios';

const testRegistration = async () => {
    const url = 'http://localhost:5000/api/auth/register';
    const email = `test_auditor_${Date.now()}@example.com`;
    const payload = {
        fullName: 'Test Auditor',
        email: email,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'Auditor'
    };

    try {
        console.log(`Attempting to register user with role: ${payload.role}...`);
        const response = await axios.post(url, payload);
        console.log('Registration Response:', JSON.stringify(response.data, null, 2));

        if (response.data.role === 'Auditor') {
            console.log('SUCCESS: User registered with Auditor role.');
        } else {
            console.error(`FAILURE: Expected role Auditor, but got ${response.data.role}`);
        }
    } catch (error) {
        console.error('Registration failed:', error.response?.data || error.message);
    }
};

testRegistration();
