import { Body, Get, Post, UseGuards } from "@nestjs/common";
import { Controller } from '@nestjs/common';
import { AuthGuard } from "src/guards/auth.guard";
import { GetUser } from "../../customDecorator/getUser";
import { DatabaseService } from "@services/database/database.service";
import { Logger } from "@modules/logger/service/logger";
import { HttpResponse } from "@models/httpResponse";
import { HelperResponse } from "@helpers/helperResponse";
import { getClassName } from "@helpers/utils";
import { AgricultureDTO } from "@dto/agriculture/agriculture";

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
                const agriculturesDTO = await this.database.chemical.getAllAgricultures(userId)
                this.logger.debug(`${getClassName(this)}#getAgricultures for user: ${userId}. Length: ${agriculturesDTO.length}`)
                return HelperResponse.getSuccessResponse(agriculturesDTO)
            } catch (err) {
                this.logger.error(`${getClassName(this)}#getAgricultures error: ${JSON.stringify(err)}`)
                console.log(err)
                return HelperResponse.getServerError()
            }

        }

        return HelperResponse.getDBError()
    }


    @Post('add-agriculture')
    @UseGuards(AuthGuard)
    async addAgricultures(
        @Body('agriculture') agriculturesDTO: AgricultureDTO[],
        @GetUser() userId: string
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                this.logger.log(`${getClassName(this)}#addAgricultures. Need to add: ${agriculturesDTO.map(a => a.id)}`)
                const addedAgricultures = await this.database.chemical.addAgricultures(agriculturesDTO, userId)
                this.logger.log(`${getClassName(this)}#addAgricultures. Added: ${JSON.stringify(addedAgricultures)}`)
                return HelperResponse.getSuccessResponse(addedAgricultures)
            } catch (err) {
                this.logger.error(`${getClassName(this)}#addAgricultures error: ${JSON.stringify(err)}`)
                console.log(err)
                return HelperResponse.getServerError()
            }
        }

        return HelperResponse.getDBError()
    }

    @Post('delete-agriculture')
    @UseGuards(AuthGuard)
    async deleteAgricultures(
        @Body('ids') agriculturesIds: string[],
        @GetUser() userId: string
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                this.logger.log(`${getClassName(this)}#deleteSolution. UserID: ${userId} Delete: ${agriculturesIds}`)
                const deletedAgriculturesIds = await this.database.chemical.deleteAgricultures(agriculturesIds, userId)
                this.logger.log(`${getClassName(this)}#deleteAgricultures. Deleted: ${deletedAgriculturesIds}`)
                return HelperResponse.getSuccessResponse(deletedAgriculturesIds)

            } catch (err) {
                this.logger.error(`${getClassName(this)}#deleteAgricultures error: ${JSON.stringify(err)}`)
                console.log(err)
                return HelperResponse.getServerError()
            }
        }

        return HelperResponse.getDBError()
    }

    @Post('update-agriculture')
    @UseGuards(AuthGuard)
    async updateAgricultures(
        @Body('agriculture') agriculturesDTO: AgricultureDTO[],
        @GetUser() userId: string
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                this.logger.log(`${getClassName(this)}#updateAgricultures. UserID: ${userId} Need to update: ${JSON.stringify(agriculturesDTO)}`)
                const updatedAgricultures = await this.database.chemical.updateAgricultures(agriculturesDTO, userId)
                this.logger.log(`${getClassName(this)}#updateAgricultures. Updated: ${JSON.stringify(updatedAgricultures)}`)
                return HelperResponse.getSuccessResponse(updatedAgricultures)
                
            } catch (err) {
                this.logger.error(`${getClassName(this)}#updateAgricultures error: ${JSON.stringify(err)}`)
                console.log(err)
                return HelperResponse.getServerError()
            }
        }

        return HelperResponse.getDBError()
    }
}
