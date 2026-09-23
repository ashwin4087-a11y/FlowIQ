import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";
import ValidationError from "../utils/ValidationError";

const reqValidator = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
	try {
		const parsed = schema.safeParse(req.body.data);

		if (!parsed.success) {
			const formattedErrors = parsed.error.issues.map((issue) => ({
				field: issue.path.length > 0 ? issue.path.join(".") : "payload",
				message: issue.message,
			}));
			throw new ValidationError("Validation failed", formattedErrors);
		}

		//req.body.data = parsed.data; // Ensures only validated data is passed to the route handler
		next();
	} catch (error) {
		next(error);
	}
};
export default reqValidator;
