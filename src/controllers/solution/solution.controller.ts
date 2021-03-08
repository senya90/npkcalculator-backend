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
                await this.database.chemical.getSolutions(userId)
                return HelperResponse.getSuccessResponse([])
            } catch (err) {

            }
        }

        return HelperResponse.getDBError()

    }

    @Post('add-solution')
    @UseGuards(AuthGuard)
    async addSolution(
        @Body('solution') solutionsDTO: SolutionDTO[],
        @GetUser() userId: string
    ) {
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
}
