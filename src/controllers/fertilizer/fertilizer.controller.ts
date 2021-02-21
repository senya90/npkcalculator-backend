import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { HttpResponse } from "@models/httpResponse";
import { HelperResponse } from "@helpers/helperResponse";
import { DatabaseService } from "@services/database/database.service";
import { Logger } from "@modules/logger/service/logger";
import { AuthGuard } from "../../guards/auth.guard";
import { GetUser } from "../../customDecorator/getUser";
import { getClassName } from "@helpers/utils";
import { Fertilizer, FertilizerDTO } from "@dto/fertilizer/fertilizer";

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
            const fertilizersDTO = await this.database.chemical.getFertilizers(userId)
            this.logger.debug(`${getClassName(this)}#getFertilizers. User id: ${userId}. Length ${fertilizersDTO.length}`)
            return HelperResponse.getSuccessResponse(fertilizersDTO)
        }

        return HelperResponse.getDBError()
    }

    @Post('fertilizer')
    @UseGuards(AuthGuard)
    async addFertilizer(
        @Body() fertilizerDTO: FertilizerDTO,
        @GetUser() userId: string
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            this.logger.log(`${getClassName(this)}#addFertilizer. User id: ${userId} fertilizerDTO: ${JSON.stringify(fertilizerDTO)}`)
            const fertilizer = new Fertilizer(fertilizerDTO)
            const addedFertilizers = await this.database.chemical.addFertilizer([fertilizer], userId)
            this.logger.log(`${getClassName(this)}#addFertilizer. Added: ${JSON.stringify(addedFertilizers.map(fertilizer => fertilizer.name))}`)
            return HelperResponse.getSuccessResponse(addedFertilizers)
        }

        return HelperResponse.getDBError()
    }
}
