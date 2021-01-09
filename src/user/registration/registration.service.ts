import * as bcrypt from 'bcrypt'
import { Injectable } from '@nestjs/common';
import { UserDB, UserDTO, UserCredentials } from "@dto/user/userDTO";
import { IdGenerator } from '@helpers/idGenerator/IdGenerator';
import * as jwt from 'jsonwebtoken'
import { JwtHeader, SignOptions } from "jsonwebtoken";

const advancedSalt = '$2b$10$ZFoe9PCdXWLcOnT46UOYEu'
const tokenSecret = '89bf)(hg47&*83b'

@Injectable()
export class RegistrationService {
    private SALT_ROUNDS = 11

    async prepareUserForDB(user :UserCredentials, roleID: string): Promise<UserDB> {
        const salt = await this._generateSalt()
        const advancedSalt = await this._getAdvancedSaltFromConfig()
        const hashedPassword = await this._hashPassword(user.password, salt, advancedSalt)

        return {
            id: IdGenerator.generate(),
            login: user.login,
            password: hashedPassword,
            created: this._getNowTimeSeconds(),
            nick: null,
            roleID: roleID,
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
            resolve(advancedSalt)
        })
    }

    private _hashPassword = async (password: string, salt: string, advancedSalt: string): Promise<string> => {
        const enc = await bcrypt.hash(password, salt)
        return await bcrypt.hash(enc, advancedSalt)
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
        const hashedInputPassword = await bcrypt.hash(inputPassword, userDB.salt)
        const doubleHashedInputPassword = await bcrypt.hash(hashedInputPassword, advancedSalt)
        return doubleHashedInputPassword === userDB.password
    }

    async generateTokens(user: UserDB) {
        const accessPayload = {
            userId: user.id,
            login: user.login,
            role: user.roleID,
            tokenType: 'access'
        }

        const refreshPayload = {
            ...accessPayload,
            tokenType: 'refresh'
        }

        const accessTokenOptions: SignOptions = {
            expiresIn: "15m",
        }

        const refreshTokenOptions: SignOptions = {
            expiresIn: "30d",
        }

        const accessToken = await this._signToken(accessPayload, accessTokenOptions)
        const refreshToken = await this._signToken(refreshPayload, refreshTokenOptions)

        console.log(accessToken)
        console.log(refreshToken)
    }

    private _signToken = async (payload: any, options: SignOptions): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
            jwt.sign(payload, tokenSecret, options, (err, token) => {
                if (err) {
                    return reject(err)
                }

                return resolve(token)
            })
        })

    }
}
