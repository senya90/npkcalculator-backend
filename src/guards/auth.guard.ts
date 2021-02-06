import { Logger } from "@modules/logger/service/logger";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { getClassName } from "@helpers/utils";
import { TokenService } from "../user/token/token.service";

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(
        private readonly tokenService: TokenService,
        private readonly logger: Logger
    ) {
    }

    canActivate(
        context: ExecutionContext
    ): boolean | Promise<boolean> | Observable<boolean> {
        const req = context.switchToHttp().getRequest()
        const token = req.headers.authorization
        if (!token) {
            this.logger.warn(`${getClassName(this)}#canActive. Tokens not found`)
            return false
        }

        const clearedToken = this.tokenService.sanitizeToken(token)
        return this.tokenService.verifyToken(clearedToken)
    }
}
