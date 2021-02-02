import { IChemicalDatabaseProvider, IUserDatabaseProvider } from "../databaseProvidersTypes";
import { Database, OPEN_READWRITE } from "sqlite3";
import { TABLES } from "@services/databaseProviders/tables";
import { ChemicalUnitDto } from "@dto/chemicalUnitDto";
import { UserDB } from "@dto/user/userDTO";
import { TRole } from "@models/role";
import { RoleDB } from "@dto/user/roleDTO";
import { Logger } from "@modules/logger/service/logger";
import { TokensPair } from "@models/tokens";
import { IdGenerator } from "@helpers/idGenerator/IdGenerator";
import { ChemicalAggregateDB } from "@dto/chemical/chemicalAggregateDTO";
import { ChemicalAtomDB } from "@dto/chemical/chemicalAtomDTO";
import { ChemicalComplexDB } from "@dto/chemical/chemicalComplexDTO";

export class SqliteDatabaseProvider implements IChemicalDatabaseProvider, IUserDatabaseProvider {
    private database: Database

    constructor(private readonly logger: Logger) {
    }

    connect(databaseName: string, databaseUrl: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const path = `${databaseUrl}/${databaseName}`
            const database = new Database(path, OPEN_READWRITE, (err) => {
                if (err) {
                    this.logger.error(`SQLite connection error, ${err}`)
                    return reject(err)
                }
                this.database = database
                this.logger.log(`SQLite connection success`)
                resolve(this.database)
            })
        })
    }

    getChemicals(): Promise<ChemicalUnitDto[]> {
        return new Promise<ChemicalUnitDto[]>((resolve, reject) => {
            const sql = `SELECT * FROM ${TABLES.CHEMICAL_UNIT}`

            this.database.all(sql, (error, chemicals: any[]) => {
                if (error) {
                    return reject(error)
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

    getUser(userId: string): Promise<UserDB> {
        return new Promise<UserDB>((resolve, reject) => {
            const sql = `SELECT * FROM ${TABLES.USER} WHERE id = ?`

            this.database.get(sql,
                [userId],
                (err, user) => {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(user)
                })
        })
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

            this.database.get(sql, [roleName], (err, role) => {
                if (err) {
                    return reject(err)
                }

                if (!role || !role.id) {
                    return reject({message: 'role not found'})
                }

                const foundROle: RoleDB = {
                    id: role.id,
                    name: role.name
                }

                return resolve(foundROle)
            })
        })
    }

    getUserByLogin(login: string): Promise<UserDB | null> {
        return new Promise<UserDB | null>((resolve, reject) => {
            const sql = `SELECT * from ${TABLES.USER} WHERE login = ?`

            this.database.get(sql, [login], (err, user) => {
                if (err) {
                    return reject(err)
                }

                if (!user) {
                    return resolve(null)
                }

                const userDB: UserDB = {
                    ...user
                }

                return resolve(userDB)
            })

        })
    }

    saveTokensForUser(userId: string, tokens: TokensPair): Promise<TokensPair> {
        return new Promise<any>(async (resolve, reject) => {
            try {
                const sql = `INSERT INTO ${TABLES.TOKEN}(id, userID, accessToken, refreshToken) VALUES (?, ?, ?, ?)`
                const id = IdGenerator.generate()
                await this.clearTokenForUser(userId)

                return this.database.run(sql,
                    [id, userId, tokens.accessToken, tokens.refreshToken],
                    (err) => {
                        if (err) {
                            return reject(err)
                        }

                        return resolve(tokens)
                    })
            } catch (err) {
                return reject(err)
            }
        })
    }

    clearTokenForUser = (userID: string): Promise<boolean> => {
        return new Promise<boolean>((resolve, reject) => {
            const sql = `DELETE FROM ${TABLES.TOKEN} WHERE userID = ?`

            this.database.run(sql,
                [userID],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(true)
                })
        })
    }

    addComplex(chemicalComplexDB: ChemicalComplexDB): void {
    }

    addAggregate(chemicalAggregateDB: ChemicalAggregateDB): void {
    }

    addAtom(chemicalAtom: ChemicalAtomDB): void {
    }

}