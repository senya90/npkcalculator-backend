import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseService } from "./services/database/database.service";
import { ChemicalsController } from "./chemicals/chemicals.controller";
import { UserController } from "./user/user.controller";
import { RegistrationService } from './user/registration/registration.service';
import { LoggerModule } from './modules/logger/logger.module';
import { Logger } from "./modules/logger/service/logger";

@Module({
    imports: [LoggerModule],
    controllers: [AppController, ChemicalsController, UserController],
    providers: [AppService, DatabaseService, RegistrationService]
})
export class AppModule {
    constructor(
        private readonly database: DatabaseService,
        private readonly logger: Logger
    ) {
        this.database.connectToDatabases()
            .then(() => {
                this.logger.log('App. Successful connection to the database')
            })
            .catch(err => {
                this.logger.error('App has not connected to the database', err)
            })
    }
}
