import { Module } from "@nestjs/common";
import {ConfigModule} from "@nestjs/config"
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseService } from "./services/database/database.service";
import { ChemicalsController } from "./controllers/chemicals/chemicals.controller";
import { UserController } from "./controllers/user/user.controller";
import { RegistrationService } from './controllers/user/registration/registration.service';
import { LoggerModule } from './modules/logger/logger.module';
import { Logger } from "./modules/logger/service/logger";
import { TokenService } from './controllers/user/token/token.service';
import { FertilizerController } from './controllers/fertilizer/fertilizer.controller';
import { getClassName } from "@helpers/utils";
import { SolutionController } from './controllers/solution/solution.controller';
import { AgricultureController } from './controllers/agriculture/agriculture.controller';

@Module({
    imports: [LoggerModule, ConfigModule.forRoot()],
    controllers: [AppController, ChemicalsController, UserController, FertilizerController, SolutionController, AgricultureController],
    providers: [AppService, DatabaseService, RegistrationService, TokenService]
})
export class AppModule {
    constructor(
        private readonly database: DatabaseService,
        private readonly logger: Logger
    ) {
        this.database.connectToDatabases()
            .then(() => {
                this.logger.log(`${getClassName(this)} App. Successful connection to the database`)
            })
            .catch(err => {
                this.logger.error(`${getClassName(this)} App has not connected to the database. ${JSON.stringify(err)}`)
            })
    }
}
