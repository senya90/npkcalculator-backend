export const getClassName = (instance: any): string => {
    return instance.constructor.name
}

export const getNowTimeSeconds = () => {
    const MILLISECONDS_TO_SECONDS = 1000
    const seconds = new Date().valueOf() / MILLISECONDS_TO_SECONDS
    return Math.trunc(seconds)
}