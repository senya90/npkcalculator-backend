import { ErrorResponse } from "@models/errorResponse";

export class HttpResponse {
    data: any
    error: ErrorResponse
    status: number

    constructor(data: any, error: ErrorResponse = null, status = 200) {
        this.data = data
        this.error = error
        this.status = status
    }
}