import { Controller, Get, UseGuards } from "@nestjs/common";
import { HttpResponse } from "@models/httpResponse";
import { DatabaseService } from "@services/database/database.service";
import { Logger } from "@modules/logger/service/logger";
import { HelperResponse } from "@helpers/helperResponse";
import { AuthGuard } from "src/guards/auth.guard";
import { GetUser } from "../../customDecorator/getUser";

@Controller('solution')
export class SolutionController {

    constructor(
        private readonly database: DatabaseService,
        private readonly logger: Logger
    ) {}

    @Get('solutions')
    @UseGuards(AuthGuard)
    async getSolutions(
        @GetUser() userId: string
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                await this.database.chemical.getSolutions(userId)
                return HelperResponse.getSuccessResponse([])
            } catch (err) {

            }
        }

        return HelperResponse.getDBError()

    }
}
