import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { HttpResponse } from "@models/httpResponse";
import { HelperResponse } from "@helpers/helperResponse";
import { DatabaseService } from "@services/database/database.service";
import { Logger } from "@modules/logger/service/logger";
import { AuthGuard } from "../../guards/auth.guard";
import { GetUser } from "../../customDecorator/getUser";
import { getClassName, notEmptyArray } from "@helpers/utils";
import { Fertilizer, FertilizerDTO } from "@dto/fertilizer/fertilizer";
import { SolutionsUsingFertilizer } from "@dto/solution/solutionsUsingFertilizer";
import { DeleteFertilizerResponse } from "./fertilizerControllerTypes";

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
            try {
                this.logger.log(`${getClassName(this)}#addFertilizer. User id: ${userId} fertilizerDTO: ${JSON.stringify(fertilizerDTO)}`)
                const addedFertilizers = await this.database.chemical.addFertilizer([fertilizerDTO], userId)
                this.logger.log(`${getClassName(this)}#addFertilizer. Added: ${JSON.stringify(addedFertilizers.map(fertilizer => fertilizer.name))}`)
                return HelperResponse.getSuccessResponse(fertilizerDTO)
            } catch (err) {
                this.logger.error(`${getClassName(this)}#addFertilizer error: ${JSON.stringify(err)}`)
                console.log(err)
                return HelperResponse.getServerError()
            }
        }

        return HelperResponse.getDBError()
    }

    @Post('delete-fertilizer')
    @UseGuards(AuthGuard)
    async deleteFertilizer(
        @Body('id') fertilizersIds: string[],
        @Body('isConfirmed') isConfirmed: boolean,
        @GetUser() userId: string
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            const solutionsUsingFertilizers = await this.database.chemical.getSolutionsUsingFertilizers(fertilizersIds, userId)

            if (notEmptyArray(solutionsUsingFertilizers) && !isConfirmed) {
                return HelperResponse.getSuccessResponse({
                    needToConfirm: true,
                    solutionsUsingFertilizers,
                    deletedFertilizersIds: []
                } as DeleteFertilizerResponse)
            }

            this.logger.log(`${getClassName(this)}#deleteFertilizer. User id: ${userId} fertilizers: ${JSON.stringify(fertilizersIds)}`)
            const deletedFertilizersIds = await this.database.chemical.deleteFertilizers(fertilizersIds, userId)
            this.logger.log(`${getClassName(this)}#deleteFertilizer. Successfully deleted: ${JSON.stringify(deletedFertilizersIds)}`)
            return HelperResponse.getSuccessResponse({
                needToConfirm: false,
                deletedFertilizersIds,
                solutionsUsingFertilizers
            } as DeleteFertilizerResponse)
        }

        return HelperResponse.getDBError()
    }

    @Post('update-fertilizer')
    @UseGuards(AuthGuard)
    async updateFertilizer(
        @Body('fertilizer') fertilizers: FertilizerDTO[],
        @GetUser() userId: string
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                this.logger.log(`${getClassName(this)}#updateFertilizer. User id: ${userId} fertilizers: ${Fertilizer.getIds(fertilizers)}`)
                const updatedFertilizers = await this.database.chemical.updateFertilizers(fertilizers, userId)
                this.logger.log(`${getClassName(this)}#updateFertilizer. Successfully updated: ${Fertilizer.getIds(updatedFertilizers)}`)
                return HelperResponse.getSuccessResponse(updatedFertilizers)
            } catch (err) {
                return HelperResponse.getServerError()
            }
        }
        return HelperResponse.getDBError()
    }
}
