export class ErrorResponse {
    message: string
    code: number

    constructor(message = 'error', code = 500) {
        this.message = message
        this.code = code
    }
}