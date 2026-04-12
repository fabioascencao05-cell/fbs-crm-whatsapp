const axios = require('axios');

async function testDelete() {
    try {
        const url = 'http://localhost:3000/api/conversas/delete';
        const idToDelete = 'TEST_ID_REPLACE_ME'; // I will manually run this on the VPS next or locally if the backend is up.
        
        console.log(`Testing delete endpoint for ID: ${idToDelete}...`);
        
        const response = await axios.post(url, { id: idToDelete });
        console.log('Response:', response.data);
    } catch (err) {
        if (err.response) {
            console.error('Error response:', err.response.data);
        } else {
            console.error('Error message:', err.message);
        }
    }
}

testDelete();
