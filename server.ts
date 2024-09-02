import app from './src/app';
import { config } from 'dotenv';

config();

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
