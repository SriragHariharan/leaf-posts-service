import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import logger from './logger';

// Reopen the Request interface and add user object to it
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/* Validate access token from the request header */
export function validateAccessToken(req: Request, _res: Response, next: NextFunction): void {
    logger.debug(`Entering validateAccessToken method.`, { method: "validateAccessToken", layer: "middleware" });
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            logger.error(`Unauthorized request: Authorization header is missing.`, { layer: "middleware" });
            return next(createHttpError.Unauthorized("Unauthorized request, authorization header is required."));
        }

        const bearerToken = authHeader.split(' ');
        const token = bearerToken[1];
        if (!token) {
            logger.error(`Unauthorized request: Token is missing.`, { layer: "middleware" });
            return next(createHttpError.Unauthorized("Unauthorized request, token is required."));
        }

        const resp = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
        req.user = resp;

        logger.info(`Access token validated successfully for user: ${resp}`, { layer: "middleware" });
        next();
    } catch (error) {
        logger.error(`Error validating access token: ${error}`, { error, layer: "middleware" });
        console.log("axt validation error ::: ", error);
        return next(createHttpError.Unauthorized("Unauthorized request: " + error));
    } finally {
        logger.debug(`Exiting validateAccessToken method.`, { method: "validateAccessToken", layer: "middleware" });
    }
}

/* Validate admin token from the request header */
export async function validateAdminToken(req: Request, _res: Response, next: NextFunction): Promise<void> {
    logger.debug(`Entering validateAdminToken method.`, { method: "validateAdminToken", layer: "middleware" });
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            logger.error(`Unauthorized request: Authorization header is missing.`, { layer: "middleware" });
            return next(createHttpError.Unauthorized("Unauthorized request, authorization header is required."));
        }

        const bearerToken = authHeader.split(' ');
        const token = bearerToken[1];
        if (!token) {
            logger.error(`Unauthorized request: Token is missing.`, { layer: "middleware" });
            return next(createHttpError.Unauthorized("Unauthorized request, token is required."));
        }

        jwt.verify(token, process.env.ADMIN_TOKEN_SECRET!);

        logger.info(`Admin token validated successfully.`, { layer: "middleware" });
        next();
    } catch (error) {
        logger.error(`Error validating admin token: ${error}`, { error, layer: "middleware" });
        console.log("axt validation error ::: ", error);
        return next(createHttpError.Unauthorized("Unauthorized request: " + error));
    } finally {
        logger.debug(`Exiting validateAdminToken method.`, { method: "validateAdminToken", layer: "middleware" });
    }
}