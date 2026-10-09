import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/db.js';

const port = Number(process.env.PORT) || 5000;

try {
  await connectDatabase(process.env.MONGODB_URI);
  app.listen(port, () => console.log(`Task API listening at http://localhost:${port}`));
} catch (error) {
  console.error(`Could not start the API: ${error.message}`);
  process.exitCode = 1;
}
