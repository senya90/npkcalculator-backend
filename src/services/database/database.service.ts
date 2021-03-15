import { Injectable } from '@nestjs/common';
import { IDatabase } from "./DatabaseTypes";
import {
    IChemicalDatabaseProvider,
    IUserDatabaseProvider
} from "../databaseProviders/databaseProvidersTypes";
import { SqliteDatabaseProvider } from "@services/databaseProviders/sqliteDatabaseProvider/sqliteDatabaseProvider";
import { Logger } from '@modules/logger/service/logger';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class DatabaseService implements IDatabase {
    chemical: IChemicalDatabaseProvider
    user: IUserDatabaseProvider
    private isDBConnected = false

    constructor(
        private readonly logger: Logger,
        private readonly configService: ConfigService
    ) {
        const databaseProvider = new SqliteDatabaseProvider(this.logger)
        this.chemical = databaseProvider
        this.user = databaseProvider
    }

    connectToDatabases(): Promise<any> {
        const dbName = this.configService.get('DATABASE_NAME')
        const dbPath = this.configService.get('DATABASE_PATH')

        return Promise.all([
            this.chemical.connect(dbName, dbPath)
        ])
            .then(connects => {
                this.isDBConnected = true
                return connects
            })
            .catch(err => {
                this.isDBConnected = false
                this.logger.error(`Database connection error ${err}`, )
                throw err
            })
    }

    isReady(): boolean {
        return this.isDBConnected
    }


}
