import StatusCodes from 'http-status-codes';
import { Request, Response, Router } from 'express';
import logger from "@shared/Logger";

const router = Router();
const { OK } = StatusCodes;

router.get('/status', (req: Request, res: Response) => {
    logger.info("getting status")
    return res.status(OK).json({status: OK});
});

export default router;
