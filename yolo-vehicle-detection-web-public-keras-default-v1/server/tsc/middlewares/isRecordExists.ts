import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import db2 from "../config/db2";

const isRecordExists = (model: any) => async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;
		const record = await model.findUnique({ where: { id: id } });
		if (record) {
			next();
			return;
		}
		throw new AppError("Not Found", 404);
	} catch (error) {
		next(error);
	}
};
export default isRecordExists;
