// Simple demo script that doesn't require compilation
import fs from 'fs';
import path from 'path';

async function runSimpleDemo() {
  console.log('Starting Simple Hypat.ai Demo');
  console.log('-----------------------------');

  try {
    // Ensure data directory exists
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data');
      console.log('Created data directory');
    }

    // Create a mock database file
    const demoDbPath = './data/demo-database.sqlite';
    if (!fs.existsSync(demoDbPath)) {
      fs.writeFileSync(demoDbPath, '');
      console.log('Created mock database file');
    }

    // Load configuration
    const configPath = './config.demo.json';
    if (!fs.existsSync(configPath)) {
      console.error(`Config file not found: ${configPath}`);
      process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('Loaded configuration:', JSON.stringify(config, null, 2));

    // Display demo information
    console.log('\nHypat.ai Demo Information');
    console.log('------------------------');
    console.log('Environment:', config.environment);
    console.log('Database:', config.database.type, config.database.filename);
    console.log('Email transport:', config.email.transport);
    console.log('MCP enabled:', !!config.mcp);

    console.log('\nDemo features:');
    const demoConfig = config.demo || {};
    console.log('- Number of users:', (demoConfig.users || []).length);
    console.log('- Newsletter count:', demoConfig.newsletterCount || 0);
    console.log('- Generate categories for all:', demoConfig.generateCategoriesForAllNewsletters || false);
    console.log('- Run full workflow:', demoConfig.runFullWorkflow || false);

    console.log('\nSimple demo completed successfully');

  } catch (error) {
    console.error('Error running demo:', error);
    process.exit(1);
  }
}

runSimpleDemo().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});