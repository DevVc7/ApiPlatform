const bcrypt = require('bcryptjs');

async function generateHash() {
    try {
        const password = 'abc123';
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Hash generado:', hash);
    } catch (error) {
        console.error('Error:', error);
    }
}

generateHash();
