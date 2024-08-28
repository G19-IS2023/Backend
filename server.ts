import app from './src/app';
import { config } from 'dotenv';

config();

const PORT = (process.env.PORT || 5050) as number;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
