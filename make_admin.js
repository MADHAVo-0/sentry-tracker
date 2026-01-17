const { db } = require('./server/src/db/setup');

async function makeAdmin() {
    try {
        await db('users').where({ username: 'testuser' }).update({ role: 'admin' });
        console.log('User updated to admin');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

makeAdmin();
