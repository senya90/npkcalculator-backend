import { IChemicalDatabaseProvider, IUserDatabaseProvider } from "../databaseProvidersTypes";
import { Database, OPEN_READWRITE } from "sqlite3";
import { TABLES } from "@services/databaseProviders/tables";
import { ChemicalUnitDto } from "@dto/chemicalUnitDto";
import { UserDB } from "@dto/user/userDTO";
import { RoleDB, TRole } from "@models/role";
import { Logger } from "@modules/logger/service/logger";
import { TokensPair } from "@models/tokens";
import { IdGenerator } from "@helpers/idGenerator/IdGenerator";
import { ChemicalAggregate, ChemicalAggregateDB } from "@dto/chemical/chemicalAggregate";
import { ChemicalAtom, ChemicalAtomDB } from "@dto/chemical/chemicalAtom";
import {
    ChemicalComplex,
    ChemicalComplexDB,
    ChemicalComplexDTO,
    ChemicalComplexTextDB
} from "@dto/chemical/chemicalComplex";
import { AggregateAtomRelation, ComplexAggregateRelation } from "@dto/chemical/chemicalRelations";
import { getClassName } from "@helpers/utils";

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

    getRole(roleId: string): Promise<RoleDB> {
        return new Promise<RoleDB>((resolve, reject) => {
            const sql = `SELECT * from ${TABLES.ROLE} WHERE id = ?`

            this.database.get(sql,
                [roleId],
                (err, role: RoleDB) => {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(role)
                })
        })
    }

    async getAllAdminUsers(): Promise<UserDB[]> {
        const adminRole = await this.getRoleByName("admin")
        return await this._selectUsersByRole(adminRole.id)
    }

    private _selectUsersByRole = (roleId: string): Promise<UserDB[]> => {
        return new Promise<UserDB[]>((resolve, reject) => {
            const sql = `SELECT * FROM ${TABLES.USER} WHERE roleID = ?`

            this.database.all(sql,
                [roleId],
                function(err, users) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(users)
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

    async getUserChemicalComplexes(usersIds: string[]): Promise<ChemicalComplexDTO[]> {
        const selectComplexesPromises = usersIds.map(async userId => {
            const complexes = await this._selectComplexesByUser(userId)
            if (!complexes) {
                return []
            }

            return complexes.map(complex => {
                return {
                    id: complex.id,
                    name: complex.name,
                    chemicalAggregates: JSON.parse(complex.chemicalAggregates),
                    userId: complex.userID
                }
            })
        })

        const arrayComplexes = await Promise.all(selectComplexesPromises)
        const allComplexes: ChemicalComplexDTO[] = []
        arrayComplexes.forEach(complexes => {
            allComplexes.push(...complexes)
        })

        return allComplexes
    }

    private _selectComplexesByUser = (userId: string): Promise<ChemicalComplexTextDB[]> => {
        return new Promise<any>((resolve, reject) => {
            const sql = `SELECT * FROM ${TABLES.CHEMICAL_COMPLEX_TEXT} WHERE userID = ?`

            this.database.all(sql,
                [userId],
                function(err, chemicalComplexes) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(chemicalComplexes)
                })
        })
    }

    addComplexesAsText(chemicalComplexes: ChemicalComplex[], userId: string): Promise<ChemicalComplex[]> {
        const addComplexesPromises = chemicalComplexes.map(async complex => {
            try {
                const complexAsTextDB = complex.toChemicalComplexTextDB(userId)
                await this._insertComplexAsText(complexAsTextDB)
                return Promise.resolve(complex)
            } catch (err) {
                throw (err)
            }
        })

        return Promise.all(addComplexesPromises)
    }

    private _insertComplexAsText(chemicalComplex: ChemicalComplexTextDB): Promise<ChemicalComplexTextDB> {
        return new Promise<any>((resolve, reject) => {
            const sql = `INSERT INTO ${TABLES.CHEMICAL_COMPLEX_TEXT}(id, name, chemicalAggregates, userID) VALUES (?, ?, ?, ?)`

            this.database.run(sql,
                [chemicalComplex.id, chemicalComplex.name, chemicalComplex.chemicalAggregates, chemicalComplex.userID],
                function(err) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(chemicalComplex)
                })
        })
    }

    deleteComplexesAsText(chemicalComplexesIds: string[]): Promise<string[]> {
        const deleteComplexesPromises = chemicalComplexesIds.map(async complexId => {
            try {
                return await this._deleteComplexText(complexId)
            } catch (err) {
                throw err
            }
        })

        return Promise.all(deleteComplexesPromises)
    }

    private _deleteComplexText = (complexId: string): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
            const sql = `DELETE FROM ${TABLES.CHEMICAL_COMPLEX_TEXT} WHERE id = ?`

            this.database.run(sql,
                [complexId],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(complexId)
                })
        })
    }

    deleteComplexesAsTextForUser(chemicalComplexesIds: string[], userId: string): Promise<string[]> {
        const deleteComplexesForUserPromises = chemicalComplexesIds.map(async complexId => {
            try {
                return await this._deleteComplexTextForUser(complexId, userId)
            } catch (err) {
                throw err
            }
        })

        return Promise.all(deleteComplexesForUserPromises)
    }

    private _deleteComplexTextForUser = (complexId: string, userId: string): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
            const sql = `DELETE FROM ${TABLES.CHEMICAL_COMPLEX_TEXT} WHERE id = ? AND userID = ?`

            this.database.run(sql,
                [complexId, userId],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(complexId)
                })
        })
    }

    deleteComplexesAsTextOnlyAdmin(chemicalComplexesIds: string[]): Promise<string[]> {
        const deletedComplexesPromises = chemicalComplexesIds.filter(async (complexId): Promise<string> => {
                const adminRole = await this.getRoleByName('admin')
                const complexDB = await this._selectComplex(complexId)
                const complexOwner = await this.getUser(complexDB.userID)

                if (complexOwner.roleID === adminRole.id) {
                    const isDeleted = await this._deleteComplex(complexId)
                    if (isDeleted) {
                        return complexId
                    }

                    return undefined
                }
                return undefined
            })


        return Promise.all(deletedComplexesPromises)
    }

    private _selectComplex(complexId: string): Promise<ChemicalComplexTextDB> {
        return new Promise<any>((resolve, reject) => {
            const sql = `SELECT * FROM ${TABLES.CHEMICAL_COMPLEX_TEXT} WHERE id = ?`

            this.database.get(sql,
                [complexId],
                function(err, chemicalComplexes) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(chemicalComplexes)
                })
        })
    }

    addComplexes = async (chemicalComplexes: ChemicalComplex[], userId: string): Promise<any> => {
        await this.deleteComplexes(chemicalComplexes.map(complex => complex.id))
        this.logger.debug(`${getClassName(this)}#addComplexes. Clear complexes`)

        const addComplexesPromises = chemicalComplexes.map(async complex => {
            const complexDB = complex.toChemicalComplexDB(userId)
            const aggregates = [...complex.chemicalAggregates]
            await this._insertComplex(complexDB)
            await this._addAggregates(aggregates, userId)
            return await this._addComplexAggregatesRelations(complex, aggregates)

        })

        return Promise.all(addComplexesPromises)
    }

    private _insertComplex = (chemicalComplex: ChemicalComplexDB): Promise<any> => {
        return new Promise<any>((resolve, reject) => {
            const sql = `INSERT INTO ${TABLES.CHEMICAL_COMPLEX}(id, name, userID) VALUES (?, ?, ?)`

            this.database.run(sql,
                [chemicalComplex.id, chemicalComplex.name, chemicalComplex.userID],
                function(err) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(true)
                })
        })
    }

    private _addComplexAggregatesRelations = (complex: ChemicalComplex, aggregates: ChemicalAggregate[]) => {
        const addRelationsPromises = aggregates.map(aggregate => {
            return this._insertComplexAggregateRelation(complex, aggregate)
        })

        return Promise.all(addRelationsPromises)
    }

    private _insertComplexAggregateRelation = (complex: ChemicalComplex, aggregate: ChemicalAggregate) => {
        return new Promise<any>((resolve, reject) => {
            const sql = `INSERT INTO ${TABLES.CHEMICAL_COMPLEX__CHEMICAL_AGGREGATE}(id, chemicalComplexID, chemicalAggregateID) VALUES (?, ?, ?)`

            this.database.run(sql,
                [IdGenerator.generate(), complex.id, aggregate.id],
                function(err) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(true)
                })
        })
    }

    deleteComplexes = (chemicalComplexesIds: string[]): Promise<any> => {
        const deleteComplexesPromises = chemicalComplexesIds.map(async complexId => {
            const relations: ComplexAggregateRelation[] = await this._selectComplexAggregateRelations(complexId)
            const usedAggregates = relations.map(relation => relation.chemicalAggregateID)
            await this._deleteComplexAggregateRelations(complexId)
            await this._deleteAggregations(usedAggregates)
            return await this._deleteComplex(complexId)
        })

        return Promise.all(deleteComplexesPromises)
    }

    private _deleteComplexAggregateRelations = (complexId): Promise<any> => {
        return new Promise<boolean>((resolve, reject) => {
            const sql = `DELETE FROM ${TABLES.CHEMICAL_COMPLEX__CHEMICAL_AGGREGATE} WHERE chemicalComplexID = ?`

            this.database.run(sql,
                [complexId],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(true)
                })
        })
    }

    private _selectComplexAggregateRelations = (complexId: string): Promise<ComplexAggregateRelation[]> => {
        return new Promise<ComplexAggregateRelation[]>((resolve, reject) => {
            const sql = `SELECT * FROM ${TABLES.CHEMICAL_COMPLEX__CHEMICAL_AGGREGATE} WHERE chemicalComplexID = ?`

            this.database.all(sql,
                [complexId],
                (error, relations: ComplexAggregateRelation[]) => {
                if (error) {
                    return reject(error)
                }

                resolve(relations)
            })
        })
    }

    private _deleteComplex = (complexId) => {
        return new Promise<boolean>((resolve, reject) => {
            const sql = `DELETE FROM ${TABLES.CHEMICAL_COMPLEX} WHERE id = ?`

            this.database.run(sql,
                [complexId],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(true)
                })
        })
    }

    private _addAggregates = (chemicalAggregates: ChemicalAggregate[], userId: string): Promise<any>  =>{
        const addAggregatesPromises = chemicalAggregates.map(async aggregate => {
            const aggregateDB = aggregate.toChemicalAggregateDB(userId)
            const atoms = [...aggregate.atoms]
            await this._insertAggregation(aggregateDB)
            await this._addAtoms(atoms, userId)
            await this._addAggregateAtomsRelations(aggregate, atoms)
        })

        return Promise.all(addAggregatesPromises)
    }

    private _addAggregateAtomsRelations = (aggregate: ChemicalAggregate, atoms: ChemicalAtom[]) => {
        const addRelationsPromises = atoms.map(atom => {
            return this._insertAggregateAtomRelation(aggregate, atom)
        })

        return Promise.all(addRelationsPromises)
    }

    private _insertAggregateAtomRelation = (aggregate: ChemicalAggregate, atom: ChemicalAtom) => {
        return new Promise<any>((resolve, reject) => {
            const sql = `INSERT INTO ${TABLES.CHEMICAL_AGGREGATE__CHEMICAL_ATOM}(id, chemicalAggregateID, chemicalAtomID) VALUES (?, ?, ?)`

            this.database.run(sql,
                [IdGenerator.generate(), aggregate.id, atom.id],
                function(err) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(true)
                })
        })
    }

    private _insertAggregation = (chemicalAggregate: ChemicalAggregateDB) => {
        return new Promise<any>((resolve, reject) => {
            const sql = `INSERT INTO ${TABLES.CHEMICAL_AGGREGATE}(id, multiplier, userID) VALUES (?, ?, ?)`

            this.database.run(sql,
                [chemicalAggregate.id, chemicalAggregate.multiplier, chemicalAggregate.userID],
                function(err) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(true)
                })
        })
    }

    private _deleteAggregations = (chemicalAggregatesIds: string[]): Promise<any> => {
        const deleteAggregatesPromises = chemicalAggregatesIds.map(async aggregateId => {
            const relations = await this._selectAggregateAtomRelations(aggregateId)
            const userAtomsIds = relations.map(relation => relation.chemicalAtomID)
            await this._deleteAggregateAtomRelations(aggregateId)
            await this._deleteAtoms(userAtomsIds)
            return this._deleteAggregate(aggregateId)
        })

        return Promise.all(deleteAggregatesPromises)

    }

    private _deleteAggregateAtomRelations = (aggregateId: string): Promise<any> => {
        return new Promise<boolean>((resolve, reject) => {
            const sql = `DELETE FROM ${TABLES.CHEMICAL_AGGREGATE__CHEMICAL_ATOM} WHERE chemicalAggregateID = ?`

            this.database.run(sql,
                [aggregateId],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(true)
                })
        })
    }

    private _selectAggregateAtomRelations = (aggregateId): Promise<AggregateAtomRelation[]> => {
        return new Promise<AggregateAtomRelation[]>((resolve, reject) => {
            const sql = `SELECT * FROM ${TABLES.CHEMICAL_AGGREGATE__CHEMICAL_ATOM} WHERE chemicalAggregateID = ?`

            this.database.all(sql,
                [aggregateId],
                (error, relations: AggregateAtomRelation[]) => {
                    if (error) {
                        return reject(error)
                    }

                    resolve(relations)
                })
        })
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


    private _addAtoms = (chemicalAtoms: ChemicalAtom[], userId: string): Promise<any> => {
        const addAtomsPromises = chemicalAtoms.map(atom => {
            const atomDB = atom.toChemicalAtomDB(userId)
            return this._insertAtom(atomDB)
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
                function(err) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(true)
                })
        })
    }

}