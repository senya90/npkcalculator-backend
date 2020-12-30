import { Injectable } from '@nestjs/common';
import { IDatabase } from "./DatabaseTypes";
import {
    IChemicalDatabaseProvider,
    IUserDatabaseProvider
} from "../databaseProviders/databaseProvidersTypes";
import { SqliteDatabaseProvider } from "@services/databaseProviders/sqliteDatabaseProvider/sqliteDatabaseProvider";
import { databaseConfig } from 'src/config/databaseConfig';

@Injectable()
export class DatabaseService implements IDatabase {
    chemicalProvider: IChemicalDatabaseProvider
    userProvider: IUserDatabaseProvider

    constructor() {
        const databaseProvider = new SqliteDatabaseProvider()
        this.chemicalProvider = databaseProvider
        this.userProvider = databaseProvider
    }

    connectToDatabases(): Promise<any> {
        return Promise.all([
            this.chemicalProvider.connect(databaseConfig.databaseName, databaseConfig.databaseUrl)
        ])
    }


}
