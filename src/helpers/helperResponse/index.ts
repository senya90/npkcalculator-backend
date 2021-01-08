import { HttpResponse } from "@models/httpResponse";
import { ErrorResponse } from "@models/errorResponse";

export const HelperResponse = {
    getDBError: (message = 'Lost database connection', code = 500) => {
        return new HttpResponse(null, new ErrorResponse(message, code), code)
    },

    getServerError: (message?: string, code = 500) => {
        return new HttpResponse(null, new ErrorResponse(message, code), code)
    },

    getSuccessResponse: (data: any, code = 200) => {
        return new HttpResponse(data, null, code)
    }
}