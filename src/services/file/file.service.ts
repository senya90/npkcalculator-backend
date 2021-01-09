import { Injectable } from '@nestjs/common';
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'


@Injectable()
export class FileService {

    writeToLog(message: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const appPath = path.dirname(require.main.filename);
            const logPath = path.join(appPath, 'log.txt')
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
