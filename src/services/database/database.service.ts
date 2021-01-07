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
    private isDBConnected = false

    constructor() {
        const databaseProvider = new SqliteDatabaseProvider()
        this.chemicalProvider = databaseProvider
        this.userProvider = databaseProvider
    }

    connectToDatabases(): Promise<any> {
        return Promise.all([
            this.chemicalProvider.connect(databaseConfig.databaseName, databaseConfig.databaseUrl)
        ])
            .then(connects => {
                this.isDBConnected = true
                return connects
            })
            .catch(err => {
                this.isDBConnected = false
                console.error('Database connection error', err);
                return err
            })
    }

    isReady(): boolean {
        return this.isDBConnected
    }


}
