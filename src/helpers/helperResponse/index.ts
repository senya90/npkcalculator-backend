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

    getErrorForInfo: (error?: ErrorResponse, code = 200) => {
        if (error) {
            return new HttpResponse(
                null,
                new ErrorResponse(error.message, error.code, error.text),
                code
            )
        }

        const errorCustom = ErrorCode('Server error information').error
        return new HttpResponse(
            null,
            new ErrorResponse(errorCustom.message, errorCustom.code, errorCustom.text),
            code
        )
    },

    getServerError: (error?: ErrorResponse, code = 500) => {
        if (error) {
            return new HttpResponse(
                null,
                new ErrorResponse(error.message, error.code, error.text),
                code
            )
        }

        const errorCustom = ErrorCode('Server error').error
        return new HttpResponse(
            null,
            new ErrorResponse(errorCustom.message, errorCustom.code, errorCustom.text),
            code
        )
    },

    getAuthError: (error?: ErrorResponse, code = 401) => {
        return new HttpResponse(
            null,
            new ErrorResponse(error.message, error.code, error.text),
            code
        )
    },

    getWarning: (data: any, error?: ErrorResponse, code = 200) => {
        return new HttpResponse(
            data,
            new ErrorResponse(error.message, error.code, error.text),
            code
        )
    }
}