import { Controller, Get } from "@nestjs/common";
import { DatabaseService } from "@services/database/database.service";

@Controller('chemicals')
export class ChemicalsController {

    private areAllDBReady = false

    constructor(private readonly database: DatabaseService) {
        this.initDB()
    }

    initDB = async () => {
        try {
            await this.database.connectToDatabases()
            this.areAllDBReady = true
        } catch (e) {
            this.areAllDBReady = false
        }
    }

    private areDBReady = () => {
        if (!this.areAllDBReady) {
            console.error(` Databases aren't ready`)
        }
        return this.areAllDBReady
    }

    @Get()
    getChemicals(): any {
        if (this.areDBReady()) {
            return this.database.chemicalProvider.getChemicals()

        }

        // TODO: make errors handlers
        return ':('
    }
}
