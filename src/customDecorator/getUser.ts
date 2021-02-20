import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenService } from "../controllers/user/token/token.service";
import { ConfigService } from "@nestjs/config";

export const GetUser = createParamDecorator(
    async (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const accessToken = request.headers.authorization

        if (!accessToken) {
            return
        }

        const configService = new ConfigService()
        const tokenService = new TokenService(configService)

        const decodeToken = await tokenService.decodeToken(accessToken)
        return decodeToken.userId
    },
);