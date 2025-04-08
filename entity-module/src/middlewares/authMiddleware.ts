import {Request, Response, NextFunction} from 'express';
import { HttpStatus } from '../utils/constants';

const authMiddleware = (req: Request, res: Response, next: NextFunction):void => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(!token) {
        res.status(HttpStatus.UNAUTHORIZED).json({
            error: HttpStatus.UNAUTHORIZED_MESSAGE,
            message : 'Invalid token'
        })

        return;
    }

    next();
}

export default authMiddleware;