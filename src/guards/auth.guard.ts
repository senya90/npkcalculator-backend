import { Logger } from "@modules/logger/service/logger";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { RegistrationService } from "../user/registration/registration.service";
import { getClassName } from "@helpers/utils";

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(
        private readonly registrationService: RegistrationService,
        private readonly logger: Logger
    ) {
    }

    canActivate(
        context: ExecutionContext
    ): boolean | Promise<boolean> | Observable<boolean> {
        const req = context.switchToHttp().getRequest()
        const token = req.headers.authorization
        if (!token) {
            this.logger.warn(`${getClassName(this)}#canActive. Tokes not found`)
            return false
        }

        const clearedToken = this.registrationService.sanitizeToken(token)
        return this.registrationService.isOK(clearedToken)
    }
}
