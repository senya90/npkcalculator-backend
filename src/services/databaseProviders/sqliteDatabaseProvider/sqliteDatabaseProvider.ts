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
import { ChemicalComplex, ChemicalComplexDB, ChemicalComplexDTO } from "@dto/chemical/chemicalComplex";

export class SqliteDatabaseProvider implements IChemicalDatabaseProvider, IUserDatabaseProvider {
    private database: Database

    constructor(private readonly logger: Logger) {
    }

    connect = (databaseName: string, databaseUrl: string): Promise<any> => {
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

    getChemicals = (): Promise<ChemicalUnitDto[]> => {
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

    getUser = (userId: string): Promise<UserDB> => {
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

    registerUser = (user: UserDB): Promise<any> => {
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

    getRoleByName = (roleName: TRole): Promise<RoleDB> => {
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

    getUserByLogin = (login: string): Promise<UserDB | null> => {
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

    saveTokensForUser = (userId: string, tokens: TokensPair): Promise<TokensPair> => {
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

    addComplexes = async (chemicalComplexesDTO: ChemicalComplexDTO[], userId: string): Promise<any> => {
        // await this.deleteComplexes(chemicalComplexesDB.map(complex => complex.id))

        // добавить комплекс (1)
        // добавить агрегации (2)
        // сделать связи комплекс-агрегация (3)
        // добавить атомы (4)
        // добавить связи агрегация - атом (5)

        const chemicalComplexes = ChemicalComplex.dtoToClass(chemicalComplexesDTO)

        const addComplexesPromises = chemicalComplexes.map(async complex => {
            // (1)
            const complexDB = complex.toChemicalComplexDB(userId)
            await this._insertComplex(complexDB)

            // (2)
            const aggregates = complex.chemicalAggregates
        })

        return Promise.all(addComplexesPromises)
    }

    private _insertComplex = (chemicalComplex: ChemicalComplexDB): Promise<any> => {
        return new Promise<any>((resolve, reject) => {
            const sql = `INSERT INTO ${TABLES.CHEMICAL_COMPLEX}(id, name, userID) VALUES (?, ?, ?)`

            this.database.run(sql,
                [chemicalComplex.id, chemicalComplex.name, chemicalComplex.userID],
                function(err, result) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(true)
                })
        })
    }

    deleteComplexes = (chemicalComplexesIds: string[]): Promise<any> => {
        const deleteComplexesPromises = chemicalComplexesIds.map(complexId => {
            return this._deleteComplex(complexId)
        })

        return Promise.all(deleteComplexesPromises)
    }

    private _deleteComplex = (complexId) => {
        // START clear
        // взять айди комплекса
        // по связи комплекс-агрегация найти все агрегации
        // по связи агрегация-атом взять все атомы
        // очистить связи агрегация - атом
        // удалить атомы
        // очистить связи комплекс - агригация
        // удалить агрегации
        // удалить комплекс
        // END clear


        // return new Promise<boolean>((resolve, reject) => {
        //     const sql = `DELETE FROM ${TABLES.CHEMICAL_COMPLEX} WHERE id = ?`
        //
        //     this.database.run(sql,
        //         [complexId],
        //         (err) => {
        //             if (err) {
        //                 return reject(err)
        //             }
        //             return resolve(true)
        //         })
        // })
    }

    private _addAggregates = (chemicalAggregatesDB: ChemicalAggregateDB[]): Promise<any>  =>{
        const addAggregatesPromises = chemicalAggregatesDB.map(aggregate => {
            return this._insertAggregation(aggregate)
        })

        return Promise.all(addAggregatesPromises)
    }

    private _insertAggregation = (chemicalAggregate: ChemicalAggregateDB) => {
        return new Promise<any>((resolve, reject) => {
            const sql = `INSERT INTO ${TABLES.CHEMICAL_AGGREGATE}(id, multiplier, userID) VALUES (?, ?, ?)`

            this.database.run(sql,
                [chemicalAggregate.id, chemicalAggregate.multiplier, chemicalAggregate.userID],
                function(err, result) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(true)
                })
        })
    }

    private _deleteAggregations = (chemicalAggregatesIds: string[]): Promise<any> => {
        const deleteAggregatesPromises = chemicalAggregatesIds.map(id => {
            return this._deleteAggregate(id)
        })

        return Promise.all(deleteAggregatesPromises)

    }

    private _deleteAggregate = (chemicalAggregateId: string): Promise<any> => {
        return new Promise<boolean>((resolve, reject) => {
            const sql = `DELETE FROM ${TABLES.CHEMICAL_AGGREGATE} WHERE id = ?`

            this.database.run(sql,
                [chemicalAggregateId],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(true)
                })
        })
    }


    private _addAtoms = (chemicalAtoms: ChemicalAtomDB[]): Promise<any> => {
        const addAtomsPromises = chemicalAtoms.map(atom => {
            return this._insertAtom(atom)
        })

        return Promise.all(addAtomsPromises)
    }

    private _deleteAtoms = (chemicalAtomsIds: string[]): Promise<any> => {
        const deleteAtomsPromises = chemicalAtomsIds.map(atomId => {
            return this._deleteAtom(atomId)
        })

        return Promise.all(deleteAtomsPromises)
    }

    private _deleteAtom = (id: string) => {
        return new Promise<boolean>((resolve, reject) => {
            const sql = `DELETE FROM ${TABLES.CHEMICAL_ATOM} WHERE id = ?`

            this.database.run(sql,
                [id],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(true)
                })
        })
    }

    private _insertAtom = (chemicalAtom: ChemicalAtomDB): Promise<any> => {
        return new Promise<any>((resolve, reject) => {
            const sql = `INSERT INTO ${TABLES.CHEMICAL_ATOM}(id, chemicalUnitID, atomsCount, userID) VALUES (?, ?, ?, ?)`

            this.database.run(sql,
                [chemicalAtom.id, chemicalAtom.chemicalUnitID, chemicalAtom.atomsCount, chemicalAtom.userID],
                function(err, result) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(true)
                })
        })
    }

}