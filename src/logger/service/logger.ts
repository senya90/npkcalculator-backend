import { LoggerService } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Logger implements LoggerService {
    debug(message: any, context?: string): any {

    }

    error(message: any, trace?: string, context?: string): any {
    }

    log(message: any, context?: string): any {
        console.log(message)
        this.getFormattedRow()
    }

    verbose(message: any, context?: string): any {
    }

    warn(message: any, context?: string): any {
    }

    getFormattedRow = (message?: any): string => {
        const date: Date = new Date()
        const dateFormatted = this._formatDate(date)

        return dateFormatted

    }

    private _formatDate = (date: Date) => {
        const dateString = this._getDateString(date)
        const timeString = this._getTimeString(date)

        return `[${dateString} ${timeString}]`
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
