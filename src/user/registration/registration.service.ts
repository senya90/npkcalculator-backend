import * as bcrypt from 'bcrypt'
import { Injectable } from '@nestjs/common';
import { UserDB, UserRegistration } from "@dto/userDTO";
import { IdGenerator } from '@helpers/idGenerator/IdGenerator';


@Injectable()
export class RegistrationService {
    private SALT_ROUNDS = 11

    async prepareUserForDB(user :UserRegistration): Promise<UserDB> {
        const salt = await this._generateSalt()
        const advancedSalt = await this._getAdvancedSaltFromConfig()
        const hashedPassword = await this._hashPassword(user.password, salt, advancedSalt)

        return {
            id: IdGenerator.generate(),
            login: user.login,
            password: hashedPassword,
            created: this._getNowTimeSeconds(),
            nick: null,
            roleID: '22e44944-d3d2-4830-b819-c095e846fed7',
            salt: salt
        }
    }

    private _getNowTimeSeconds = () => {
        const MILLISECONDS_TO_SECONDS = 1000
        const seconds = new Date().valueOf() / MILLISECONDS_TO_SECONDS
        return Math.trunc(seconds)
    }

    private _generateSalt = (): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
            bcrypt.genSalt(this.SALT_ROUNDS, (err, salt) => {
                if (err) {
                    return reject(err)
                }

                return resolve(salt)

            })
        })
    }

    private _getAdvancedSaltFromConfig = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            // TODO: read config file
            resolve('')
        })
    }

    private _hashPassword = (password: string, salt: string, advancedSalt: string): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
            bcrypt.hash(password, salt + advancedSalt, (err, encrypted: string) => {
                if (err) {
                    return reject(err)
                }

                return resolve(encrypted)
            })
        })

    }
}
