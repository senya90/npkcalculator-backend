import { Injectable } from '@nestjs/common';
import { IDatabase } from "./DatabaseTypes";
import {
    IChemicalDatabaseProvider,
    IUserDatabaseProvider
} from "../databaseProviders/databaseProvidersTypes";
import { SqliteDatabaseProvider } from "@services/databaseProviders/sqliteDatabaseProvider/sqliteDatabaseProvider";
import { databaseConfig } from 'src/config/databaseConfig';
import { Logger } from '@modules/logger/service/logger';

@Injectable()
export class DatabaseService implements IDatabase {
    chemical: IChemicalDatabaseProvider
    user: IUserDatabaseProvider
    private isDBConnected = false

    constructor(
        private readonly logger: Logger
    ) {
        const databaseProvider = new SqliteDatabaseProvider(this.logger)
        this.chemical = databaseProvider
        this.user = databaseProvider
    }

    connectToDatabases(): Promise<any> {
        return Promise.all([
            this.chemical.connect(databaseConfig.databaseName, databaseConfig.databaseUrl)
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
