import { Injectable } from '@nestjs/common';
import { UserDB } from "@dto/user/userDTO";
import { TokensPair } from "@models/tokens";
import { SignOptions } from "jsonwebtoken";
import * as jwt from "jsonwebtoken";
import { ConfigService } from "@nestjs/config";

let tokenSecret;

@Injectable()
export class TokenService {

    constructor(private readonly configService: ConfigService) {
        tokenSecret = this.configService.get('TOKEN_SECRET')
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

    decodeToken = (token: string): Promise<any> => {
        const sanitizedToken = this.sanitizeToken(token)

        return new Promise<any>((resolve, reject) => {
            jwt.verify(sanitizedToken, tokenSecret, (err, decode) => {
                if (err) {
                    return reject(err)
                }
                return resolve(decode)
            })
        })
    }

    verifyToken = (clearedToken: string): Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
            jwt.verify(clearedToken, tokenSecret, (err) => {
                if (err) {
                    return resolve(false)
                }
                return resolve(true)
            })
        })
    }
}
