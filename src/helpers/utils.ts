export const getClassName = (instance: any): string => {
    return instance.constructor.name
}

export const getNowTimeSeconds = () => {
    const MILLISECONDS_TO_SECONDS = 1000
    const seconds = new Date().valueOf() / MILLISECONDS_TO_SECONDS
    return Math.trunc(seconds)
}

export const isExist = (value: any) => {
    return value !== undefined && value !== null
}

export const isArray = (value: any) => {
    return isExist(value) && Array.isArray(value)
}

export const notEmptyArray = (value: any) => {
    return isArray(value) && value.length > 0
}