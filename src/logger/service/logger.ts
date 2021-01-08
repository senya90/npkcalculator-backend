import { LoggerService } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Logger implements LoggerService {

    private MESSAGE_TYPE = {
        DEBUG: 'DEBUG',
        ERROR: 'ERROR',
        LOG: 'LOG',
        VERBOSE: 'VERBOSE',
        WARN: 'WARN'
    }

    debug(message: any, context?: string): any {
        this._print(this._getFormattedRow(this.MESSAGE_TYPE.DEBUG, message), this.MESSAGE_TYPE.DEBUG)
    }

    error(message: any, trace?: string, context?: string): any {
        this._print(this._getFormattedRow(this.MESSAGE_TYPE.ERROR, message), this.MESSAGE_TYPE.ERROR)
    }

    log(message: any, context?: string): any {
        this._print(this._getFormattedRow(this.MESSAGE_TYPE.LOG, message), this.MESSAGE_TYPE.LOG)
    }

    verbose(message: any, context?: string): any {
        this._print(this._getFormattedRow(this.MESSAGE_TYPE.VERBOSE, message), this.MESSAGE_TYPE.VERBOSE)
    }

    warn(message: any, context?: string): any {
        this._print(this._getFormattedRow(this.MESSAGE_TYPE.WARN, message), this.MESSAGE_TYPE.WARN)
    }

    private _print = (logRaw: string, messageType: string) => {
        //  TODO: write to file
        if (messageType === 'ERROR') {
            console.error(logRaw)
            return
        }

        if (messageType === 'WARN') {
            console.warn(logRaw)
            return
        }

        console.log(logRaw)
    }

    private _getFormattedRow = (messageType: string, message?: any, ): string => {
        const date: Date = new Date()
        const dateFormatted = this._formatDate(date)

        return `[${dateFormatted}][${messageType}] ${message}`

    }

    private _formatDate = (date: Date) => {
        const dateString = this._getDateString(date)
        const timeString = this._getTimeString(date)

        return `${dateString} ${timeString}`
    }

    private _getTimeString = (date: Date): string => {
        const hours = this._addZero(date.getHours())
        const minutes = this._addZero(date.getMinutes())
        const seconds = this._addZero(date.getSeconds())

        return `${hours}:${minutes}:${seconds}`
    }

    private _getDateString = (date: Date): string => {
        const day = this._addZero(date.getDate())
        const month = this._addZero(date.getMonth() + 1)
        const year = this._addZero(date.getFullYear())

        return `${day}.${month}.${year.slice(2)}`
    }

    private _addZero = (value: number) => {
        const stringValue = String(value)
        if (stringValue.length <= 1) {
            return `0${stringValue}`
        }

        return stringValue
    }

}
