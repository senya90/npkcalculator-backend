import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { HttpResponse } from "@models/httpResponse";
import { DatabaseService } from "@services/database/database.service";
import { Logger } from "@modules/logger/service/logger";
import { HelperResponse } from "@helpers/helperResponse";
import { AuthGuard } from "src/guards/auth.guard";
import { GetUser } from "../../customDecorator/getUser";
import { SolutionDTO } from "@dto/solution/solution";
import { getClassName } from "@helpers/utils";

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
                const solutionsDTO: SolutionDTO[] = await this.database.chemical.getSolutions(userId)
                this.logger.debug(`${getClassName(this)}#getSolutions for user: ${userId}. Length: ${solutionsDTO.length}`)
                return HelperResponse.getSuccessResponse(solutionsDTO)
            } catch (err) {
                this.logger.error(`${getClassName(this)}#getSolutions error: ${JSON.stringify(err)}`)
                console.log(err)
                return HelperResponse.getServerError()
            }
        }

        return HelperResponse.getDBError()
    }

    @Post('add-solution')
    @UseGuards(AuthGuard)
    async addSolution(
        @Body('solution') solutionsDTO: SolutionDTO[],
        @GetUser() userId: string
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                const addedSolutionsDB = await this.database.chemical.addSolutions(solutionsDTO, userId)
                this.logger.log(`${getClassName(this)}#addSolution. Added: ${JSON.stringify(addedSolutionsDB.map(solution => solution.id))}`)
                return HelperResponse.getSuccessResponse(addedSolutionsDB.map(solution => solution.id))

            } catch (err) {
                this.logger.error(`${getClassName(this)}#addSolution error: ${JSON.stringify(err)}`)
                console.log(err)
                return HelperResponse.getServerError()
            }
        }

        return HelperResponse.getDBError()
    }

    @Post('delete-solution')
    @UseGuards(AuthGuard)
    async deleteSolution(
        @Body('id') solutionsIds: string[],
        @GetUser() userId: string
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                const deletedSolutionsIds: string[] = await this.database.chemical.deleteSolutions(solutionsIds, userId)
                this.logger.log(`${getClassName(this)}#deleteSolution. Deleted: ${deletedSolutionsIds}`)
                return HelperResponse.getSuccessResponse(deletedSolutionsIds)

            } catch (err) {
                this.logger.error(`${getClassName(this)}#deleteSolution error: ${JSON.stringify(err)}`)
                console.log(err)
                return HelperResponse.getServerError()
            }
        }

        return HelperResponse.getDBError()
    }

    @Post('update-solution')
    @UseGuards(AuthGuard)
    async updateSolution(
        @Body('solution') solutionsDTO: SolutionDTO[],
        @GetUser() userId: string
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            console.log('solutionsDTO', solutionsDTO)
            const updatedSolutions = await this.database.chemical.updateSolutions(solutionsDTO, userId)
            const ids = updatedSolutions.map(solution => solution.id)
            this.logger.log(`${getClassName(this)}#updateSolution. Updated: ${ids}`)
            return HelperResponse.getSuccessResponse(ids)
        }

        return HelperResponse.getDBError()
    }
}
