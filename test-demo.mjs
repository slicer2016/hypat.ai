console.log("Starting test demo...");

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

async function runTestDemo() {
  console.log("Running test demo");
  console.log("UUID test:", uuidv4());
  
  try {
    const data = await fs.mkdir('./data', { recursive: true });
    console.log("Created data directory:", data);
    
    await fs.writeFile('./data/test.txt', 'This is a test file');
    console.log("Wrote test file");
    
    const content = await fs.readFile('./data/test.txt', 'utf8');
    console.log("Read test file content:", content);
  } catch (error) {
    console.error("Error:", error);
  }
  
  console.log("Test demo completed");
}

runTestDemo().catch(error => {
  console.error("Fatal error:", error);
});