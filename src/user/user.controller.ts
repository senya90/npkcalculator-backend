import { UserDB, UserDTO, UserRegistration } from "@dto/user/userDTO";
import { HelperResponse } from "@helpers/helperResponse";
import { getClassName } from "@helpers/utils";
import { HttpResponse } from "@models/httpResponse";
import { ROLES } from "@models/role";
import { Body, Post } from "@nestjs/common";
import { Controller } from '@nestjs/common';
import { DatabaseService } from "@services/database/database.service";
import { Logger } from "src/logger/service/logger";
import { RegistrationService } from "./registration/registration.service";

@Controller('user')
export class UserController {

    constructor(
        private readonly database: DatabaseService,
        private readonly registrationService: RegistrationService,
        private readonly logger: Logger
    ) {}

    @Post('registration')
    async registerUser(@Body() user: UserRegistration): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                const role = await this.database.userProvider.getRoleByName(ROLES.USER)
                const userForDB: UserDB = await this.registrationService.prepareUserForDB(user, role.id)
                await this.database.userProvider.registerUser(userForDB)
                const createdUser = await this.database.userProvider.getUserByLogin(user.login)

                if (createdUser) {
                    const userDTO: UserDTO = {
                        id: createdUser.id,
                        login: createdUser.login,
                        roleID: createdUser.roleID,
                        nick: createdUser.nick
                    }

                    this.logger.log(`${getClassName(this)}#registerUser. User created. Login: ${userDTO.login} ID: ${userDTO.id}`)
                    return HelperResponse.getSuccessResponse(userDTO)
                }

                return HelperResponse.getSuccessResponse({})
            } catch (e) {
                this.logger.error(`${getClassName(this)}#registerUser. Registration error: ${e.message}`)
                return HelperResponse.getServerError(`Server user registration error. ${e.message}`)
            }
        }

        return HelperResponse.getDBError()
    }
}
