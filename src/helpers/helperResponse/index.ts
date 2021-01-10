import { HttpResponse } from "@models/httpResponse";
import { ErrorCode, ErrorResponse } from "@models/errorResponse";

export const HelperResponse = {
    getSuccessResponse: (data: any, code = 200) => {
        return new HttpResponse(data, null, code)
    },

    getDBError: (code = 500) => {
        const error = ErrorCode('Lost database connection').lostDBConnection
        return new HttpResponse(
            null,
            new ErrorResponse(error.message, error.code, error.text),
            code
        )
    },

    getServerError: (error?: ErrorResponse, code = 500) => {
        return new HttpResponse(
            null,
            new ErrorResponse(error.message, error.code, error.text),
            code
        )
    },

    getAuthError: (error?: ErrorResponse, code = 401) => {
        return new HttpResponse(
            null,
            new ErrorResponse(error.message, error.code, error.text),
            code
        )
    }
}