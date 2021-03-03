export class ErrorResponse {
    message: string
    code: number
    text: string

    constructor(message = 'error', code = 3, text = '') {
        this.message = message
        this.code = code
        this.text = text
    }
}

export const ErrorCode = (text = '') => {
    return {
        error: {
            code: 5,
            message: 'Internal server error',
            text
        },
        userNotFound: {
            code: 1,
            message: 'User is not found',
            text
        },
        incorrectLoginPassword: {
            code: 2,
            message: 'Incorrect login or password',
            text
        },
        internalServerError: {
            code: 3,
            message: 'Internal server error',
            text
        },
        lostDBConnection: {
            code: 4,
            message: 'Internal server error',
            text
        },
        warningIncludeFertilizer: {
            code: 6,
            message: 'Complexes used in fertilizers',
            text
        }
    }
}

export type TErrorCode = {
    code: number,
    message: string
}