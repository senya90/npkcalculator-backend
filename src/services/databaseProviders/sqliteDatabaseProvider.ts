import { ChemicalUnit } from "@models/chemicalUnit";
import { IChemicalDatabaseProvider, IUserDatabaseProvider } from "./databaseProvidersTypes";
import {Database, OPEN_READWRITE} from 'sqlite3'

export class SqliteDatabaseProvider implements IChemicalDatabaseProvider, IUserDatabaseProvider {
    private database: Database

    connect(databaseName: string, databaseUrl: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const path = `${databaseUrl}/${databaseName}`
            const database = new Database(path, OPEN_READWRITE, (err) => {
                if (err) {
                    console.error('SQLite connection error', err);
                    reject(err)
                    return
                }
                this.database = database
                console.log('SQLite connection success');
                resolve(this.database)
            })
        })
    }

    getChemicals(): Promise<ChemicalUnit> {
        return Promise.resolve(undefined);
    }

    getUser(): Promise<any> {
        return Promise.resolve(undefined);
    }




}