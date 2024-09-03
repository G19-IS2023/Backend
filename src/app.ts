import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { userRouter } from './routes/userRoutes';
import { bookRouter } from './routes/bookRoutes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json';

// Load environment variables
dotenv.config({path: '../.env'});

// Create the express application
const app = express();

// Setting up CORS
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization']
  };

// Enable CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Enable JSON body parsing
app.use(express.json());

// Setting swagger endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Setting up the routes
app.use('/user', userRouter);
app.use('/book', bookRouter);

export default app;
