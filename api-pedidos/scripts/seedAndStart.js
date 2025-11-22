const seedUsers = require('./seedUsers');

(async () => {
  try {
    console.log('🔁 Running DB seed (if needed)');
    await seedUsers();
    console.log('✅ Seed finished, starting server...');
    require('../server');
  } catch (err) {
    console.error('❌ Error during seed:', err);
    process.exit(1);
  }
})();
