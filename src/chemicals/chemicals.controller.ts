import { Body, Controller, Get, Post } from "@nestjs/common";
import { DatabaseService } from "@services/database/database.service";
import { HttpResponse } from "@models/httpResponse";
import { HelperResponse } from "@helpers/helperResponse";

@Controller('chemicals')
export class ChemicalsController {

    constructor(private readonly database: DatabaseService) {
    }

    @Get()
    async getChemicals(): Promise<HttpResponse> {
        if (this.database.isReady()) {
            const chemicals = await this.database.chemicalProvider.getChemicals()
            return HelperResponse.getSuccessResponse(chemicals)
        }

        return HelperResponse.getDBError()
    }

    @Post('chemical-complex')
    async addNewComplex(@Body() chemicalComplex: any): Promise<HttpResponse> {
        if (this.database.isReady()) {
            console.log('chemicalComplex', chemicalComplex)
            return HelperResponse.getSuccessResponse({})
        }

        return HelperResponse.getDBError()
    }
}
