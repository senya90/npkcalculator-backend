import { UserDB, UserRegistration } from "@dto/user/userDTO";
import { HelperResponse } from "@helpers/helperResponse";
import { HttpResponse } from "@models/httpResponse";
import { ROLES } from "@models/role";
import { Body, Post } from "@nestjs/common";
import { Controller } from '@nestjs/common';
import { DatabaseService } from "@services/database/database.service";
import { RegistrationService } from "./registration/registration.service";

@Controller('user')
export class UserController {

    constructor(
        private readonly database: DatabaseService,
        private readonly registrationService: RegistrationService) {
    }

    @Post('registration')
    async registerUser(@Body() user: UserRegistration): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                const role = await this.database.userProvider.getRoleByName(ROLES.USER)
                const userForDB: UserDB = await this.registrationService.prepareUserForDB(user, role.id)
                const result = await this.database.userProvider.registerUser(userForDB)
                return HelperResponse.getSuccessResponse(result)
            } catch (e) {
                console.log(`Registration error: ${e.message}`)
                return HelperResponse.getServerError(`Server user registration error. ${e.message}`)
            }
        }

        return HelperResponse.getDBError()
    }
}
