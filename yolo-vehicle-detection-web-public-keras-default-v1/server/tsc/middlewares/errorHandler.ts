import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import ValidationError from "../utils/ValidationError";
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error(err);
	if (err instanceof AppError) {
		res.status(err.status).json({ Error: { code: err.status, message: err.message } });
		return;
	}
	if (err instanceof ValidationError) {
		res.status(err.status).json({ Error: { code: err.status, message: err.errors } });
		return;
	}
	res.status(500).json({ Error: { code: 500, message: "Internal Server Error" } });
};

export default errorHandler;
