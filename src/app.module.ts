import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseService } from "./services/database/database.service";
import { ChemicalsController } from "./chemicals/chemicals.controller";
import { UserController } from "./user/user.controller";

@Module({
    imports: [],
    controllers: [AppController, ChemicalsController, UserController],
    providers: [AppService, DatabaseService]
})
export class AppModule {
}
