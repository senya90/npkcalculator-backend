import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseService } from "./services/database/database.service";
import { ChemicalsController } from "./chemicals/chemicals.controller";
import { UserController } from "./user/user.controller";
import { RegistrationService } from './user/registration/registration.service';

@Module({
    imports: [],
    controllers: [AppController, ChemicalsController, UserController],
    providers: [AppService, DatabaseService, RegistrationService]
})
export class AppModule {
    constructor(private readonly database: DatabaseService) {
        this.database.connectToDatabases()
            .then(() => {
                console.log('App. Successful connection to the database')
            })
            .catch(err => {
                console.error('App has not connected to the database', err)
            })
    }
}
