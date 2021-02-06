import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { SignOptions } from "jsonwebtoken";
import { Injectable } from '@nestjs/common';
import { ConfigService } from "@nestjs/config";
import { UserDB, UserDTO, UserCredentials } from "@dto/user/userDTO";
import { IdGenerator } from '@helpers/idGenerator/IdGenerator';
import { TokensPair } from "@models/tokens";

let advancedSalt;
let tokenSecret;

@Injectable()
export class RegistrationService {
    private SALT_ROUNDS = 11

    constructor(private readonly configService: ConfigService) {

        advancedSalt = this.configService.get('ADVANCED_SALT')
        tokenSecret = this.configService.get('TOKEN_SECRET')
    }

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

    async generateTokens(user: UserDB): Promise<TokensPair> {
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

        return {
            accessToken,
            refreshToken
        }
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

    sanitizeToken = (token: string) => {
        const TOKEN_PREFIX = 'Bearer '
        if (token.indexOf(TOKEN_PREFIX) === 0) {
            return token.replace(TOKEN_PREFIX, '')
        }

        return token
    }

    verifyToken = (token: string): Promise<any> => {
        return new Promise<any>((resolve, reject) => {
            jwt.verify(token, tokenSecret, (err, decode) => {
                if (err) {
                    return reject(err)
                }
                return resolve(decode)
            })
        })
    }
}
