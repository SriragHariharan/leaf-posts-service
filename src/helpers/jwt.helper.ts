import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

//re open the Request interface and add user object to it;
declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export function validateAccessToken(req: Request, _res: Response, next: NextFunction): void {
    try {
        console.log(req.headers, "token comming from client");
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return next(createHttpError.Unauthorized("Unauthorized request, authorization header is required."));
        }
    
        const bearerToken = authHeader.split(' ');
        const token = bearerToken[1];
        if (!token) {
            return next(createHttpError.Unauthorized("Unauthorized request, token is required."));
        }
        const resp = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!)
        req.user = resp;
        next(); 
    } catch (error) {
        console.log("axt validation error ::: ", error)
        return next(createHttpError.Unauthorized("Unauthorized request" + error));
    }
}
