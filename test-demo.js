console.log("Starting test demo...");

// Import the Config module
import('./src/config/config.js')
  .then(ConfigModule => {
    console.log("Config module imported:", ConfigModule);
    try {
      // Try to initialize the config
      const { Config } = ConfigModule;
      console.log("Config:", Config);
      
      Config.initialize({ path: 'config.demo.json' });
      console.log("Config initialized successfully");
      
      // Get instance and print some values
      const config = Config.getInstance();
      console.log("Got config instance");
      
      const dbConfig = config.get('database');
      console.log("Database config:", dbConfig);
    } catch (error) {
      console.error("Error initializing config:", error);
    }
  })
  .catch(error => {
    console.error("Failed to import Config module:", error);
  });