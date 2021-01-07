import { Controller, Get } from "@nestjs/common";
import { DatabaseService } from "@services/database/database.service";

@Controller('chemicals')
export class ChemicalsController {

    constructor(private readonly database: DatabaseService) {
    }

    @Get()
    getChemicals(): any {
        if (this.database.isReady()) {
            return this.database.chemicalProvider.getChemicals()
        }

        // TODO: make errors handlers
        return ':('
    }
}
