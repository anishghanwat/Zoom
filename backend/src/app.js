import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { connectToSocket } from './controllers/socketManager.js';
import userRoutes from './routes/users.routes.js'

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.use(cors());
app.use(express.json({ limit: '40kb' }));
app.use(express.urlencoded({ limit: '40kb', extended: true }));

const PORT = process.env.PORT || 8080;

app.use("/api/v1/users", userRoutes);

const start = async () => {
    const connctionDb = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected DB Host: ${connctionDb.connection.host}`);
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

start();