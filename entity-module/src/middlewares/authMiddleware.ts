import {Request, Response, NextFunction} from 'express';
import { HttpStatus } from '../utils/constants';
import { initMainDbSequelize } from '../config/mainDataSource';

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

const checkUserStatusMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.headers['x_user_id'] as string;
        
        if (!userId) {
            res.status(HttpStatus.BAD_REQUEST).json({
                error: HttpStatus.BAD_REQUEST_MESSAGE,
                message: 'User ID is required in headers'
            });
            return;
        }
        
        const sequelize = await initMainDbSequelize()
        // Use raw query instead of Sequelize model
        const users = await sequelize.query(
            `SELECT status, rid, email FROM public."user" WHERE rid = :userId LIMIT 1`,
            {
                replacements: { userId },
                type: 'SELECT'
            }
        );

        console.log('Query result:', JSON.stringify(users));
        
        // Get the first user from the array
        const user = users[0];
        
        if (typeof user === 'object' && user !== null && 'status' in user && (user as { status: string }).status !== 'active') {
            res.status(HttpStatus.FORBIDDEN).json({
                error: HttpStatus.FORBIDDEN_MESSAGE,
                message: 'User account is inactive. Please contact administrator.'
            });
            return;
        }
        
        next();
    } catch (error) {
        console.error('Error checking user status:', error);
        res.status(HttpStatus.FAILED).json({
            error: HttpStatus.FAILED_MESSAGE,
            message: 'Failed to verify user status'
        });
    }
}

export { authMiddleware, checkUserStatusMiddleware};