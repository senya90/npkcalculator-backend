import { Controller, Get } from "@nestjs/common";
import { DatabaseService } from "@services/database/database.service";

@Controller('chemicals')
export class ChemicalsController {

    constructor(private readonly database: DatabaseService) {
        this.database.initProviders()
        this.database.connectToDatabases()
            .then(result => {
            })
            .catch((err) => {
            })
    }

    @Get()
    getChemicals(): string {
        return 'all chemicals'
    }
}
