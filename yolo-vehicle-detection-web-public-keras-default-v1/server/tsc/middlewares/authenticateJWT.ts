import { sign, decode, verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import AppError from "../utils/appError";

dotenv.config();
const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		if (!token) {
			throw new AppError("Access denied. No token provided.", 401);
		}

		try {
			const decoded: any = verify(token, process.env.SECRET_KEY as string);
			req.body.userID = decoded.userId;
			next();
		} catch (error) {
			throw new AppError("token expired.", 400);
		}
	} catch (error) {
		next(error);
	}
};

export default authenticateJWT;
