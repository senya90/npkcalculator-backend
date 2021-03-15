import { Module } from "@nestjs/common";
import {ConfigModule} from "@nestjs/config"
import { AppController } from "./app.controller";
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
import {ServeStaticModule} from '@nestjs/serve-static'
import {join} from 'path'

const SPA_PATH = process.env.FRONTEND_INDEXHTML_PATH ?
    join(process.env.FRONTEND_INDEXHTML_PATH.trim())
    :
    join(__dirname, '..', '..', 'npkcalculator', 'build')

@Module({
    imports: [
        LoggerModule,
        ConfigModule.forRoot({
            envFilePath: join(__dirname, '..', '..', '.config')
        }),
        ServeStaticModule.forRoot({
            rootPath: SPA_PATH,
        }),
    ],
    controllers: [AppController, ChemicalsController, UserController, FertilizerController, SolutionController, AgricultureController],
    providers: [DatabaseService, RegistrationService, TokenService]
})
export class AppModule {
    constructor(
        private readonly database: DatabaseService,
        private readonly logger: Logger,

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
