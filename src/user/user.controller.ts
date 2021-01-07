import { UserDB, UserRegistration } from "@dto/user/userDTO";
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
    async registerUser(@Body() body: UserRegistration): Promise<string> {
        if (this.database.isReady()) {
            try {
                const role = await this.database.userProvider.getRoleByName(ROLES.USER)
                if (!role || !role.id) {
                    throw new Error('Registration role error')
                }

                const userForDB: UserDB = await this.registrationService.prepareUserForDB(body, role.id)
                return await this.database.userProvider.registerUser(userForDB)
            } catch (e) {
                // TODO: error object {error:{}, data: {}, status: 000}
                console.log(e.message)
                return ':('
            }
        }

        return ':('
    }
}
