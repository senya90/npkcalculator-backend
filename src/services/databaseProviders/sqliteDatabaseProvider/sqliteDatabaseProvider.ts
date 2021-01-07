import { IChemicalDatabaseProvider, IUserDatabaseProvider } from "../databaseProvidersTypes";
import {Database, OPEN_READWRITE} from 'sqlite3'
import { TABLES } from "@services/databaseProviders/tables";
import { ChemicalUnitDto } from "@dto/chemicalUnitDto";
import { UserDB, UserRegistration } from "@dto/userDTO";
import { IdGenerator } from "@helpers/idGenerator/IdGenerator";

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

    getChemicals(): Promise<ChemicalUnitDto[]> {
        return new Promise<ChemicalUnitDto[]>((resolve, reject) => {
            const sql = `SELECT * FROM ${TABLES.CHEMICAL_UNIT}`

            this.database.all(sql, (error, chemicals: any[]) => {
                if (error) {
                    reject(error)
                    return
                }

                const chemicalUnits: ChemicalUnitDto[] = chemicals.map(chemical => ({
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

    registerUser(user: UserDB): Promise<any> {
        return new Promise<any>((resolve, reject) => {


            resolve('1')

        })
    }

    private _getNowTimeSeconds = () => {
        const MILLISECONDS_TO_SECONDS = 1000
        return new Date().valueOf() / MILLISECONDS_TO_SECONDS
    }
}