import { UserDB, UserDTO, UserCredentials } from "@dto/user/userDTO";
import { HelperResponse } from "@helpers/helperResponse";
import { getClassName } from "@helpers/utils";
import { HttpResponse } from "@models/httpResponse";
import { ROLES } from "@models/role";
import { HttpStatus } from "@nestjs/common";
import { Body, Post } from "@nestjs/common";
import { Controller } from '@nestjs/common';
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
            const userDB = await this.database.userProvider.getUserByLogin(user.login)

            if (!userDB) {
                this.logger.warn(`${getClassName(this)}#loginUser. User ${user.login} is not found`)
                return HelperResponse.getAuthError(ErrorCode('Login user. User is not found').userNotFound)
            }

            const isPasswordMatches: boolean = await this.registrationService.isPasswordMatches(userDB, user.password)

            if (isPasswordMatches) {
                this.logger.log(`${getClassName(this)}#loginUser. User ${userDB.login} ${userDB.id} is logged in`)
                //TODO: generate tokens, send to the client
                await this.registrationService.generateTokens(userDB)
                return HelperResponse.getSuccessResponse('welcome')
            }

            this.logger.warn(`${getClassName(this)}#loginUser. User ${user.login} ${user.password}. Incorrect login or password`)
            return HelperResponse.getAuthError(ErrorCode().incorrectLoginPassword)
        }

        return HelperResponse.getDBError()

    }
}
