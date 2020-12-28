import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseService } from './services/database/database.service';
import { ChemicalsController } from './chemicals/chemicalsController';

@Module({
    imports: [],
    controllers: [AppController, ChemicalsController],
    providers: [AppService, DatabaseService]
})
export class AppModule {
}
