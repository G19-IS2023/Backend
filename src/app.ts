import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { userRouter } from './routes/userRoutes';
import { bookRouter } from './routes/bookRoutes';

dotenv.config({path: '../.env'});

const app = express();

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization']
  };

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

app.use('/user', userRouter);
app.use('/book', bookRouter);

export default app;