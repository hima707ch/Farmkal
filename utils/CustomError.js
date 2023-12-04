class CustomError extends Error{
    constructor(message,statusCode){
        super(message);
        this.statusCode = statusCode;

        this.status = statusCode<500 ? "Fail" : "Error";

        Error.captureStackTrace(this,this.constructor);

    }
}

module.exports = CustomError;