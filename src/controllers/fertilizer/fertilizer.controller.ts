import { Controller, Get, UseGuards } from "@nestjs/common";
import { HttpResponse } from "@models/httpResponse";
import { HelperResponse } from "@helpers/helperResponse";
import { DatabaseService } from "@services/database/database.service";
import { Logger } from "@modules/logger/service/logger";
import { AuthGuard } from "../../guards/auth.guard";
import { GetUser } from "../../customDecorator/getUser";
import { getClassName } from "@helpers/utils";

@Controller('fertilizer')
export class FertilizerController {

    constructor(
        private readonly database: DatabaseService,
        private readonly logger: Logger
    ) {}

    @Get('fertilizers')
    @UseGuards(AuthGuard)
    async getFertilizers(
        @GetUser() userId: string,
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            this.logger.log(`${getClassName(this)}#getFertilizers. User id: ${userId}`)
            const fertilizersDTO = await this.database.chemical.getFertilizers(userId)
            return HelperResponse.getSuccessResponse(fertilizersDTO)
        }

        return HelperResponse.getDBError()
    }
}
