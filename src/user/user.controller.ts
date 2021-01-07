import { UserRegistration } from "@dto/userDTO";
import { Body, Post } from "@nestjs/common";
import { Controller } from '@nestjs/common';
import { DatabaseService } from "@services/database/database.service";

@Controller('user')
export class UserController {

    constructor(private readonly database: DatabaseService) {
    }

    @Post('registration')
    registerUser(@Body() body: UserRegistration): string {
        console.log('body', body)
        if (this.database.isReady()) {
            // const userForDB: UserDB = {
            //     id: IdGenerator.generate(),
            //     ...user,
            //     created: this._getNowTimeSeconds(),
            //     nick: null,
            //     roleID: '22e44944-d3d2-4830-b819-c095e846fed7',
            //     salt: 'generatedSalt'
            // }
            this.database.userProvider.registerUser(body)
            return 'ok'
        }

        return ':('
    }
}
