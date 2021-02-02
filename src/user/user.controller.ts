import { UserDB, UserCredentials } from "@dto/user/userDTO";
import { HelperResponse } from "@helpers/helperResponse";
import { getClassName } from "@helpers/utils";
import { HttpResponse } from "@models/httpResponse";
import { ROLES } from "@models/role";
import { Body, Post, Request, Controller } from "@nestjs/common";
import { DatabaseService } from "@services/database/database.service";
import { Logger } from "src/modules/logger/service/logger";
import { RegistrationService } from "./registration/registration.service";
import { ErrorCode } from "@models/errorResponse";

@Controller('user')
export class UserController {

    constructor(
        private readonly database: DatabaseService,
        private readonly registrationService: RegistrationService,
        private readonly logger: Logger
    ) {}

    @Post('registration')
    async registerUser(@Body() user: UserCredentials): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                const role = await this.database.userProvider.getRoleByName(ROLES.USER)
                const userForDB: UserDB = await this.registrationService.prepareUserForDB(user, role.id)
                await this.database.userProvider.registerUser(userForDB)
                const createdUser = await this.database.userProvider.getUserByLogin(user.login)
                const userDTO = this.registrationService.userDbToDto(createdUser)

                if (userDTO) {
                    this.logger.log(`${getClassName(this)}#registerUser. User created. Login: ${userDTO.login} ID: ${userDTO.id}`)
                    return HelperResponse.getSuccessResponse(userDTO)
                }

                return HelperResponse.getSuccessResponse({})
            } catch (e) {
                this.logger.error(`${getClassName(this)}#registerUser. Registration error: ${e.message}`)
                return HelperResponse.getServerError(ErrorCode(`Server user registration error. ${e.message}`).internalServerError)
            }
        }

        return HelperResponse.getDBError()
    }

    @Post('login')
    async loginUser(@Body() user: UserCredentials): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                const userDB = await this.database.userProvider.getUserByLogin(user.login)

                if (!userDB) {
                    this.logger.warn(`${getClassName(this)}#loginUser. User ${user.login} is not found`)
                    return HelperResponse.getAuthError(ErrorCode('Login user. User is not found').userNotFound)
                }

                const isPasswordMatches: boolean = await this.registrationService.isPasswordMatches(userDB, user.password)

                if (isPasswordMatches) {
                    this.logger.log(`${getClassName(this)}#loginUser. User ${userDB.login} ${userDB.id} is logged in`)
                    const tokens = await this.registrationService.generateTokens(userDB)
                    const savedTokens = await this.database.userProvider.saveTokensForUser(userDB.id, tokens)
                    this.logger.log(`${getClassName(this)}#loginUser. savedTokens: ${JSON.stringify(savedTokens)}`)
                    return HelperResponse.getSuccessResponse(savedTokens)
                }

                this.logger.warn(`${getClassName(this)}#loginUser. User ${user.login} ${user.password}. Incorrect login or password`)
                return HelperResponse.getAuthError(ErrorCode().incorrectLoginPassword)
            } catch (err) {
                this.logger.log(`${getClassName(this)}#loginUser. Server error, ${err}`)
                return HelperResponse.getServerError(ErrorCode().internalServerError)
            }
        }

        return HelperResponse.getDBError()
    }

    @Post('update-tokens')
    async updateTokens(@Request() req: any): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                let refreshToken = req.headers.authorization
                if (!refreshToken) {
                    this.logger.error(`${getClassName(this)}#updateTokens. Token not found ${refreshToken}`)
                    return HelperResponse.getAuthError(ErrorCode('Token not found').error)
                }

                refreshToken = this.registrationService.sanitizeToken(refreshToken)
                const parsedToken = await this.registrationService.verifyToken(refreshToken)
                const userDB = await this.database.userProvider.getUser(parsedToken.userId)
                let newTokens = await this.registrationService.generateTokens(userDB)
                newTokens = await this.database.userProvider.saveTokensForUser(userDB.id, newTokens)

                this.logger.log(`${getClassName(this)}#updateTokens. Create tokens for user ${userDB.login} ${userDB.id}`)
                // this.logger.log(`${getClassName(this)}#updateTokens. ${JSON.stringify(newTokens)}`)
                return await HelperResponse.getSuccessResponse(newTokens)
            } catch (err) {
                this.logger.log(`${getClassName(this)}#updateTokens. Server error, ${err}`)
                return HelperResponse.getServerError(ErrorCode().internalServerError)
            }
        }

        return HelperResponse.getDBError()
    }
}
