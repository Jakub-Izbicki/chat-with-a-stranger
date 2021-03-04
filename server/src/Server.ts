import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

import express, { NextFunction, Request, Response } from 'express';
import http from 'http'
import StatusCodes from 'http-status-codes';
import 'express-async-errors';

import StatusRouter from './routes/Status';
import logger from '@shared/Logger';
import useWebsocket from "./socket/Socket";

const app = express();
const server = http.createServer(app);

const { BAD_REQUEST } = StatusCodes;

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
    app.use(express.static(__dirname + "/public/"));
    app.get(/^(?!\/api\/).*$/, (request, response) =>
        response.sendFile(__dirname + "/public/index.html"));
} else {
    app.use(morgan('dev'));
    app.use(cors());
}

// Add APIs
app.use('/api', StatusRouter);
useWebsocket(server);

// Print API errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.err(err, true);
    return res.status(BAD_REQUEST).json({
        error: err.message,
    });
});


export default server;
