import app from './src/app';
import { config } from 'dotenv';

// Load environment variables
config();

// Define the port
const PORT = process.env.PORT || 5050;

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
