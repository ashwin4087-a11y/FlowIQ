class ValidationError extends Error {
	status: number;
	errors: { field: string; message: string }[];

	constructor(message: string, errors: { field: string; message: string }[]) {
		super(message);
		this.status = 400;
		this.errors = errors;
	}
}
export default ValidationError;
