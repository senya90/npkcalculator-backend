import * as bcrypt from 'bcrypt'
import { Injectable } from '@nestjs/common';
import { ConfigService } from "@nestjs/config";
import { UserDB, UserDTO, UserCredentials } from "@dto/user/userDTO";
import { IdGenerator } from '@helpers/idGenerator/IdGenerator';
import { getNowTimeSeconds } from '@helpers/utils';

let advancedSalt;

@Injectable()
export class RegistrationService {
    private SALT_ROUNDS = 11

    constructor(private readonly configService: ConfigService) {
        advancedSalt = this.configService.get('ADVANCED_SALT')
    }

    async prepareUserForDB(user :UserCredentials, roleID: string): Promise<UserDB> {
        const salt = await this._generateSalt()
        const advancedSalt = await this._getAdvancedSaltFromConfig()
        const hashedPassword = await this._hashPassword(user.password, salt, advancedSalt)

        return {
            id: IdGenerator.generate(),
            login: user.login,
            password: hashedPassword,
            created: getNowTimeSeconds(),
            nick: null,
            roleID: roleID,
            salt: salt
        }
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
            resolve(advancedSalt)
        })
    }

    private _hashPassword = async (password: string, salt: string, advancedSalt: string): Promise<string> => {
        const enc = await bcrypt.hash(password, advancedSalt)
        return await bcrypt.hash(enc, salt)
    }

    userDbToDto(user: UserDB): undefined | UserDTO {
        if (user && user.id) {
            return {
                id: user.id,
                login: user.login,
                roleID: user.roleID,
                nick: user.nick
            }
        }

        return undefined
    }

    async isPasswordMatches(userDB: UserDB, inputPassword: string): Promise<boolean> {
        const advancedSalt = await this._getAdvancedSaltFromConfig()
        const hashFromInputPassword = await this._hashPassword(inputPassword, userDB.salt, advancedSalt)
        return hashFromInputPassword === userDB.password
    }
}
