import { IChemicalDatabaseProvider, IUserDatabaseProvider } from "../databaseProvidersTypes";
import { Database, OPEN_READWRITE } from "sqlite3";
import { TABLES } from "@services/databaseProviders/tables";
import { ChemicalUnitDto } from "@dto/chemicalUnitDto";
import { UserDB } from "@dto/user/userDTO";
import { TRole } from "@models/role";
import { RoleDB } from "@dto/user/roleDTO";

export class SqliteDatabaseProvider implements IChemicalDatabaseProvider, IUserDatabaseProvider {
    private database: Database

    connect(databaseName: string, databaseUrl: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const path = `${databaseUrl}/${databaseName}`
            const database = new Database(path, OPEN_READWRITE, (err) => {
                if (err) {
                    console.error("SQLite connection error", err)
                    reject(err)
                    return
                }
                this.database = database
                console.log("SQLite connection success")
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
            const sql = `INSERT INTO ${TABLES.USER}(id, login, password, created, roleID, salt, nick) VALUES (?, ?, ?, ?, ?, ?, ?)`

            this.database.run(sql,
                [user.id, user.login, user.password, user.created, user.roleID, user.salt, user.nick],
                function(err, result) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(result)
                })
        })
    }

    getRoleByName(roleName: TRole): Promise<RoleDB> {
        return new Promise<any>((resolve, reject) => {
            const sql = `SELECT id, name FROM ${TABLES.ROLE} WHERE name = ?`

            this.database.get(sql, [roleName], (err, row) => {
                if (err) {
                    return reject(err)
                }
                const role: RoleDB = {
                    id: row.id,
                    name: row.name
                }

                return resolve(role)
            })
        })
    }


}