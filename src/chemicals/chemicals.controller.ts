import { Controller, Get } from "@nestjs/common";
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
}
