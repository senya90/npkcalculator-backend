import { IChemicalDatabaseProvider, IUserDatabaseProvider } from "../databaseProvidersTypes";
import {Database, OPEN_READWRITE} from 'sqlite3'
import { TABLES } from "@services/databaseProviders/tables";
import { ChemicalUnit } from "@models/chemicalUnit";

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

    getChemicals(): Promise<ChemicalUnit[]> {
        return new Promise<ChemicalUnit[]>((resolve, reject) => {
            const sql = `SELECT * FROM ${TABLES.CHEMICAL_UNIT}`

            this.database.all(sql, (error, chemicals: any[]) => {
                if (error) {
                    reject(error)
                    return
                }

                const chemicalUnits: ChemicalUnit[] = chemicals.map(chemical => ({
                    id: chemical.id,
                    name: chemical.name,
                    molar: chemical.molar
                }))

                resolve(chemicalUnits)
            })
        })
    }

    getUser(): Promise<any> {
        return Promise.resolve(undefined);
    }




}