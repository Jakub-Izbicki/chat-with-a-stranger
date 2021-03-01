import StatusCodes from 'http-status-codes';
import { Request, Response, Router } from 'express';

const router = Router();
const { OK } = StatusCodes;

router.get('/status', (req: Request, res: Response) => {
    return res.status(OK).json({status: OK, env: process.env.NODE_ENV});
});

export default router;
