import { Post } from '@nestjs/common';
import { Controller } from '@nestjs/common';

@Controller('user')
export class UserController {

    @Post('registration')
    registerUser(): string {
        return '1'
    }
}
