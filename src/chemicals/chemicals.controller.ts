import { Body, Controller, Get, Post, Request } from "@nestjs/common";
import { DatabaseService } from "@services/database/database.service";
import { HttpResponse } from "@models/httpResponse";
import { HelperResponse } from "@helpers/helperResponse";
import { ChemicalComplex, ChemicalComplexDTO } from "@dto/chemical/chemicalComplex";
import { RegistrationService } from "../user/registration/registration.service";
import { getClassName } from "@helpers/utils";
import { Logger } from "@modules/logger/service/logger";

@Controller('chemicals')
export class ChemicalsController {

    constructor(
        private readonly database: DatabaseService,
        private readonly registrationService: RegistrationService,
        private readonly logger: Logger
    ) {}

    @Get()
    async getChemicals(): Promise<HttpResponse> {
        if (this.database.isReady()) {
            const chemicals = await this.database.chemicalProvider.getChemicals()
            return HelperResponse.getSuccessResponse(chemicals)
        }

        return HelperResponse.getDBError()
    }

    @Post('chemical-complex')
    async addNewComplex(@Body() chemicalComplexDTO: ChemicalComplexDTO, @Request() req: any): Promise<HttpResponse> {
        // !!!TODO: CHECK AUTH before handle complex

        const chemicalComplex = new ChemicalComplex(chemicalComplexDTO)

        if (this.database.isReady()) {
            try {

                let accessToken = req.headers.authorization
                accessToken = this.registrationService.sanitizeToken(accessToken)
                const decodeToken = await this.registrationService.verifyToken(accessToken)
                const userId = decodeToken.userId

                await this.database.chemicalProvider.addComplexes([chemicalComplex], userId)
                this.logger.log(`${getClassName(this)}#addNewComplex. ${chemicalComplex.name} ${chemicalComplex.id}. User: ${userId}`)
                return HelperResponse.getSuccessResponse({})
            } catch (err) {
                console.log('CATCH err', err)
                return HelperResponse.getServerError()
            }

        }

        return HelperResponse.getDBError()
    }
}
