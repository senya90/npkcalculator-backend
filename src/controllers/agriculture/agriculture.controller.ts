import { Get, UseGuards } from "@nestjs/common";
import { Controller } from '@nestjs/common';
import { AuthGuard } from "src/guards/auth.guard";
import { GetUser } from "../../customDecorator/getUser";
import { DatabaseService } from "@services/database/database.service";
import { Logger } from "@modules/logger/service/logger";
import { HttpResponse } from "@models/httpResponse";
import { HelperResponse } from "@helpers/helperResponse";
import { getClassName } from "@helpers/utils";

@Controller('agriculture')
export class AgricultureController {

    constructor(
        private readonly database: DatabaseService,
        private readonly logger: Logger
    ) {}

    @Get('agricultures')
    @UseGuards(AuthGuard)
    async getAgricultures(
        @GetUser() userId: string
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                return HelperResponse.getSuccessResponse([])
            } catch (err) {
                this.logger.error(`${getClassName(this)}#getAgricultures error: ${JSON.stringify(err)}`)
                console.log(err)
                return HelperResponse.getServerError()
            }

        }

        return HelperResponse.getDBError()
    }

}
