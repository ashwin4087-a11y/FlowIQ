class AppError extends Error {
	constructor(message: string = "Internal Server Error", public status: number = 500) {
		super(message);
		this.status = status;
		Error.captureStackTrace(this, this.constructor);
	}
}

export default AppError;
