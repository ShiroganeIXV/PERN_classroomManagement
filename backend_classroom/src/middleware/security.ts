import {NextFunction, Request, Response} from "express";
import aj from "../config/arcjet.js";
import {ArcjetNodeRequest, slidingWindow} from "@arcjet/node";

const securityMiddleware = async  (req : Request,res : Response,next : NextFunction) => {
    if(process.env.NODE_ENV === "test") return next();

    try{
        const role : RateLimitRole = req.user?.role ?? 'guest';

        let limit : number;
        let message: string;

        switch (role){
            case 'admin':
                limit = 20;
                message = 'Admins are allowed 20 requests per minute';
                break;
            case 'teacher':
                limit = 15;
                message = 'teacher are allowed 1000 requests per minute';
                break
            case 'student':
                limit = 10;
                message = 'Admins are allowed 10 requests per minute';
                break
            default:
                limit = 5;
                message = 'Guests are allowed 5 requests per minute. Please sign in';
                break
        }
        const client = aj.withRule(
            slidingWindow({
                mode: 'LIVE',
                interval: '1m',
                max: limit,
            })
        )

        const arcjetRequest: ArcjetNodeRequest = {
            headers: req.headers,
            method: req.method,
            url: req.originalUrl ?? req.url,
            socket: {remoteAddress: req.socket.remoteAddress ?? req.ip ?? '0.0.0.0'}
        }

        const decision = await client.protect(arcjetRequest);

        if (decision.isDenied() && decision.reason.isBot() ){
            return res.status(403).json({error: "Forbidden", message: 'Bot detected. Automated requests are not allowed'});
        }

        if (decision.isDenied() && decision.reason.isShield() ){
            return res.status(403).json({error: "Forbidden", message: 'Request blocked by security policy'});
        }

        if (decision.isDenied() && decision.reason.isRateLimit() ){
            return res.status(429).json({error: "Too many requests", message});
        }

        next();

    }
    catch(err){
        console.error('Arcjet middleware error:', err);
        res.status(500).json({error: "Internal Server Error", message: 'Something went wrong with security middleware'});
    }

}

export default securityMiddleware;