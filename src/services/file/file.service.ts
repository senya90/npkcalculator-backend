import { Injectable } from '@nestjs/common';
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { ConfigService } from "@nestjs/config";


@Injectable()
export class FileService {

    constructor(private readonly configService: ConfigService) {
    }

    writeToLog(message: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const logfilePath = this.configService.get('LOGFILE_PATH')
            const logfileName = this.configService.get('LOGFILE_NAME')
            const logPath = path.join(logfilePath, logfileName)
            const messageWithEndOfLine = `${message}${os.EOL}`

            fs.appendFile(logPath, messageWithEndOfLine, (err) => {
                if (err) {
                    return reject(err)
                }

                return resolve(true)
            })
        })
    }
}
