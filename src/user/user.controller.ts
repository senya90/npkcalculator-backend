import { Post } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { DatabaseService } from "@services/database/database.service";

@Controller('user')
export class UserController {

    constructor(private readonly database: DatabaseService) {
    }

    @Post('registration')
    registerUser(): string {
        if (this.database.isReady()) {
            this.database.userProvider.registerUser()
            return 'ok'
        }

        return ':('
    }
}
