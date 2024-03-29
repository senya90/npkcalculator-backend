import { IChemicalDatabaseProvider, IUserDatabaseProvider } from "../databaseProvidersTypes";
import { Database, OPEN_READWRITE } from "sqlite3";
import { TABLES } from "@services/databaseProviders/tables";
import { ChemicalUnitDTO } from "@dto/chemical/chemicalUnit";
import { UserDB } from "@dto/user/userDTO";
import { RoleDB, RoleName } from "@models/role";
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
import { getClassName, notEmptyArray } from "@helpers/utils";
import { Fertilizer, FertilizerDB, FertilizerDTO } from "@dto/fertilizer/fertilizer";
import { IngredientDTO, IngredientDB, Ingredient, FertilizerIngredientRelationDB } from "@dto/fertilizer/ingredient";
import { FertilizersUsingComplexes } from "@models/fertilizersUsingComplexes";
import { Solution, SolutionDB, SolutionDTO } from "@dto/solution/solution";
import { Dosage, DosageDB, DosageDTO } from "@dto/solution/dosage";
import { SolutionsUsingFertilizer } from "@dto/solution/solutionsUsingFertilizer";
import { Agriculture, AgricultureDB, AgricultureDTO } from "@dto/agriculture/agriculture";

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
                this._useForeignKeysInDB()
                resolve(this.database)
            })
        })
    }

    private _useForeignKeysInDB() {
        this.database.exec("PRAGMA foreign_keys = ON")
    }

    getChemicals = (): Promise<ChemicalUnitDTO[]> => {
        return new Promise<ChemicalUnitDTO[]>((resolve, reject) => {
            const sql = `SELECT * FROM ${TABLES.CHEMICAL_UNIT}`

            this.database.all(sql, (error, chemicals: any[]) => {
                if (error) {
                    return reject(error)
                }

                const chemicalUnits: ChemicalUnitDTO[] = chemicals.map(chemical => ({
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

    getRoleByName = (roleName: RoleName): Promise<RoleDB> => {
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

    deleteTokens(accessToken: string, userId: string): Promise<boolean> {
        return this._deleteTokenByAccess(accessToken, userId)
    }

    private _deleteTokenByAccess = (accessToken: string, userId: string): Promise<boolean> => {
        return new Promise<boolean>((resolve, reject) => {
            const sql = `DELETE FROM ${TABLES.TOKEN} WHERE accessToken = ? AND userID = ?`

            this.database.run(sql,
                [accessToken, userId],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(true)
                })
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

    updateComplexes(chemicalComplexes: ChemicalComplex[], userId: string): Promise<ChemicalComplexDTO[]> {
        const updateChemicalsPromises = chemicalComplexes.map(async complex => {
            const chemicalComplexTextDB = complex.toChemicalComplexTextDB(userId)
            const updatedComplex = await this._updateComplex(chemicalComplexTextDB)
            const complexDTO: ChemicalComplexDTO = ChemicalComplex.dbToDto(updatedComplex)
            return Promise.resolve(complexDTO)
        })

        return Promise.all(updateChemicalsPromises)
    }

    private _updateComplex(chemicalComplex: ChemicalComplexTextDB): Promise<ChemicalComplexTextDB> {
        return new Promise<ChemicalComplexTextDB>((resolve, reject) => {
            const sql = `UPDATE ${TABLES.CHEMICAL_COMPLEX_TEXT} SET id = ?, name = ?, chemicalAggregates = ?, userID = ?  WHERE id = ?`

            this.database.run(sql,
                [chemicalComplex.id, chemicalComplex.name, chemicalComplex.chemicalAggregates, chemicalComplex.userID, chemicalComplex.id],
                (err) => {
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
                const isDeleted = await this._deleteComplexText(complexId)
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

    async getFertilizersUsingComplexes(chemicalComplexesIds: string[], currentUserId?: string): Promise<FertilizersUsingComplexes[]> {
        try {
            const usingFertilizersPromises = chemicalComplexesIds
                .map(async chemicalComplexId => {
                    const usingFertilizersDB = await this._selectUsingFertilizersByComplex(chemicalComplexId, currentUserId)

                    if (notEmptyArray(usingFertilizersDB)) {
                        const fertilizersDTO = await this._attachIngredientsToFertilizer(usingFertilizersDB)
                        const chemicalComplexDB = await this._selectComplex(chemicalComplexId)
                        return {
                            chemicalComplex: ChemicalComplex.dbToDto(chemicalComplexDB),
                            fertilizers: fertilizersDTO
                        } as FertilizersUsingComplexes
                    }

                    return
                })

            const fertilizers = await Promise.all(usingFertilizersPromises)
            return fertilizers.filter(fertilizer => fertilizer)

        } catch (err) {
            this.logger.error(`${getClassName(this)}#getFertilizersUsingComplexes error: ${JSON.stringify(err)}`)
            console.log(err)
            throw err
        }
    }

    private _selectUsingFertilizersByComplex(chemicalComplexId: string, currentUserId?: string): Promise<FertilizerDB[]> {
        return new Promise<FertilizerDB[]>((resolve, reject) => {
            let sql = `SELECT
            ${TABLES.FERTILIZER}.id, ${TABLES.FERTILIZER}.name, ${TABLES.FERTILIZER}.userID, ${TABLES.FERTILIZER}.orderNumber, ${TABLES.FERTILIZER}.timestamp 
            FROM ${TABLES.INGREDIENT} 
            JOIN ${TABLES.FERTILIZER_HAS_INGREDIENT} ON ${TABLES.FERTILIZER_HAS_INGREDIENT}.ingredientID = ${TABLES.INGREDIENT}.id 
            JOIN ${TABLES.FERTILIZER} ON ${TABLES.FERTILIZER}.id = ${TABLES.FERTILIZER_HAS_INGREDIENT}.fertilizerID 
            WHERE ${TABLES.INGREDIENT}.chemicalComplexID = ?`

            if (currentUserId) {
                sql += ` AND ${TABLES.FERTILIZER}.userID = ?`
            }

            this.database.all(sql,
                [chemicalComplexId, currentUserId],
                function(err, result: FertilizerDB[]) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(result)
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

    addFertilizer(fertilizers: FertilizerDTO[], userId: string): Promise<FertilizerDB[]> {
        try {
            const addFertilizersPromises = fertilizers.map(async fertilizerDTO => {
                const fertilizer = new Fertilizer(fertilizerDTO)
                const addedFertilizersDB = await this._insertFertilizer(fertilizer.toDB(userId))
                await this._addIngredients(fertilizerDTO)
                return addedFertilizersDB
            })

            return Promise.all(addFertilizersPromises)
        } catch (err) {
            this.logger.error(`${getClassName(this)}#addFertilizer error: ${JSON.stringify(err)}`)
            console.log(err)
            throw err
        }
    }

    private _addIngredients(fertilizerDTO: FertilizerDTO): Promise<IngredientDB[]> {
        try {
            const addIngredientsPromises = fertilizerDTO.ingredients.map(async ingredientDTO => {
                const ingredient = new Ingredient(ingredientDTO)
                const insertedIngredientDB = await this._insertIngredient(ingredient.toDB())
                await this._insertFertilizerHasIngredientRelation(fertilizerDTO.id, insertedIngredientDB.id)
                return insertedIngredientDB
            })

            return Promise.all(addIngredientsPromises)
        } catch (err) {
            this.logger.error(`${getClassName(this)}#_addIngredients error: ${JSON.stringify(err)}`)
            console.log(err)
            throw err
        }

    }

    private _insertFertilizerHasIngredientRelation(fertilizerId: string, ingredientId: string): Promise<FertilizerIngredientRelationDB> {
        return new Promise<FertilizerIngredientRelationDB>((resolve, reject) => {
            const sql = `INSERT INTO ${TABLES.FERTILIZER_HAS_INGREDIENT}(id, fertilizerID, ingredientID) VALUES (?, ?, ?)`

            const relation: FertilizerIngredientRelationDB = {
                id: IdGenerator.generate(),
                fertilizerId,
                ingredientId
            }

            this.database.run(sql,
                [relation.id, relation.fertilizerId, relation.ingredientId],
                function(err) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(relation)
                })
        })
    }

    private _insertIngredient(ingredientDB: IngredientDB): Promise<IngredientDB> {
        return new Promise<IngredientDB>((resolve, reject) => {
            const sql = `INSERT INTO ${TABLES.INGREDIENT}(id, valuePercent, chemicalComplexID) VALUES (?, ?, ?)`

            this.database.run(sql,
                [ingredientDB.id, ingredientDB.valuePercent, ingredientDB.chemicalComplexId],
                function(err) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(ingredientDB)
                })
        })
    }

    private _insertFertilizer(fertilizerDB: FertilizerDB): Promise<FertilizerDB> {
        return new Promise<FertilizerDB>((resolve, reject) => {
            const sql = `INSERT INTO ${TABLES.FERTILIZER}(id, name, userID, orderNumber, timestamp) VALUES (?, ?, ?, ?, ?)`

            this.database.run(sql,
                [fertilizerDB.id, fertilizerDB.name, fertilizerDB.userId, fertilizerDB.orderNumber, fertilizerDB.timestamp],
                function(err) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(fertilizerDB)
                })
        })
    }

    deleteFertilizers(fertilizersIds: string[], userId: string): Promise<string[]> {
        try {
            const deletePromises = fertilizersIds.map(async fertilizerId => {
                return await this._deleteFertilizer(fertilizerId, userId)
            })

            return Promise.all(deletePromises)
        } catch (err) {
            this.logger.error(`${getClassName(this)}#deleteFertilizers error: ${JSON.stringify(err)}`)
            console.log(err)
            throw err
        }
    }

    private async _deleteFertilizer(fertilizerId: string, userId: string): Promise<string> {
        const ingredients = await this._selectIngredients(fertilizerId)
        const deletedIngredients = await this._deleteIngredients(ingredients.map(ingredient => ingredient.id))
        this.logger.debug(`${getClassName(this)}#_deleteFertilizer. deletedIngredients: ${JSON.stringify(deletedIngredients)}`)
        return await this._deleteFertilizerDB(fertilizerId, userId)
    }

    private _deleteFertilizerDB(fertilizerId: string, userId: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const sql = `DELETE FROM ${TABLES.FERTILIZER} WHERE id = ? AND userID = ?`

            this.database.run(sql,
                [fertilizerId, userId],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(fertilizerId)
                })
        })
    }

    private _deleteIngredients(ingredientsIds: string[]): Promise<string[]> {
        const deletePromises = ingredientsIds.map(async ingredientId => {
            return await this._deleteIngredientDB(ingredientId)
        })

        return Promise.all(deletePromises)
    }

    private _deleteIngredientDB(ingredientId: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const sql = `DELETE FROM ${TABLES.INGREDIENT} WHERE id = ?`

            this.database.run(sql,
                [ingredientId],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(ingredientId)
                })
        })
    }

    async getSolutionsUsingFertilizers(fertilizersIds: string[], userId: string): Promise<SolutionsUsingFertilizer[]> {
        try {
            const promises = fertilizersIds.map(async fertilizerId => {
                const solutionsDB: SolutionDB[] = await this._selectSolutionsByFertilizer(fertilizerId, userId)

                if (notEmptyArray(solutionsDB)) {
                    const solutionsDTO = await this.getSolutionsById(Solution.getIds(solutionsDB), userId)
                    const fertilizersDTO = await this._getFertilizersById([fertilizerId])
                    const targetFertilizer = fertilizersDTO[0]

                    return {
                        fertilizer: targetFertilizer,
                        solutions: solutionsDTO
                    } as SolutionsUsingFertilizer

                }

                return
            })

            const solutionsUsingFertilizers = await Promise.all(promises)
            return solutionsUsingFertilizers.filter(solution => solution)

        } catch (err) {
            this.logger.error(`${getClassName(this)}#getSolutionsUsingFertilizers error: ${JSON.stringify(err)}`)
            console.log(err)
            throw err
        }
    }

    private _selectSolutionsByFertilizer(fertilizerId: string, userId: string): Promise<SolutionDB[]> {
        return new Promise<SolutionDB[]>((resolve, reject) => {
            const sql = `SELECT 
            ${TABLES.SOLUTION}.id, ${TABLES.SOLUTION}.name, ${TABLES.SOLUTION}.userID, ${TABLES.SOLUTION}.orderNumber, ${TABLES.SOLUTION}.timestamp
            FROM ${TABLES.SOLUTION}
            JOIN ${TABLES.DOSAGE} ON ${TABLES.DOSAGE}.solutionID = ${TABLES.SOLUTION}.id
            WHERE ${TABLES.DOSAGE}.fertilizerID = ? AND ${TABLES.SOLUTION}.userID = ?;`

            this.database.all(sql,
                [fertilizerId, userId],
                function(err, solutionsDB: SolutionDB[]) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(solutionsDB)
                })
        })
    }

    async getFertilizers(userId: string): Promise<FertilizerDTO[]> {
        try {
            const fertilizersDB = await this._selectFertilizersForUser(userId)
            return await this._attachIngredientsToFertilizer(fertilizersDB)

        } catch (err) {
            this.logger.error(`${getClassName(this)}#getFertilizers error: ${JSON.stringify(err)}`)
            console.log(err)
            throw err
        }
    }

    private async _getFertilizersById(fertilizersIds: string[]): Promise<FertilizerDTO[]> {
        const getFertilizersDBPromises = fertilizersIds.map(async fertilizerId => {
            return await this._selectFertilizer(fertilizerId)
        })

        const fertilizersDB = await Promise.all(getFertilizersDBPromises)
        return await this._attachIngredientsToFertilizer(fertilizersDB)
    }

    private _selectFertilizer(fertilizerId: string): Promise<FertilizerDB> {
        return new Promise<FertilizerDB>((resolve, reject) => {
            const sql = `SELECT * FROM ${TABLES.FERTILIZER} WHERE id = ?`

            this.database.get(sql,
                [fertilizerId],
                function(err, fertilizersDB: FertilizerDB) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(fertilizersDB)
                })
        })
    }

    private _attachIngredientsToFertilizer(fertilizersDB: FertilizerDB[]): Promise<FertilizerDTO[]> {
        try {
            const promises = fertilizersDB.map(async fertilizerDB => {
                const ingredients =  await this._selectIngredients(fertilizerDB.id)
                return {
                    id: fertilizerDB.id,
                    name: fertilizerDB.name,
                    ingredients: ingredients,
                    orderNumber: fertilizerDB.orderNumber,
                    timestamp: fertilizerDB.timestamp
                } as FertilizerDTO
            })

            return Promise.all(promises)
        } catch (err) {
            this.logger.error(`${getClassName(this)}#_attachIngredientsToFertilizer error: ${JSON.stringify(err)}`)
            console.log(err)
            throw err
        }
    }

    private _selectIngredients(fertilizerId: string): Promise<IngredientDTO[]> {
        return new Promise<IngredientDTO[]>((resolve, reject) => {
            const sql = `SELECT
            ${TABLES.INGREDIENT}.id, ${TABLES.INGREDIENT}.valuePercent, 
            ${TABLES.CHEMICAL_COMPLEX_TEXT}.id as chemicalID, ${TABLES.CHEMICAL_COMPLEX_TEXT}.name, ${TABLES.CHEMICAL_COMPLEX_TEXT}.userID, ${TABLES.CHEMICAL_COMPLEX_TEXT}.chemicalAggregates
            FROM ${TABLES.FERTILIZER_HAS_INGREDIENT} 
            JOIN ${TABLES.INGREDIENT} ON ${TABLES.INGREDIENT}.id = ${TABLES.FERTILIZER_HAS_INGREDIENT}.ingredientID 
            JOIN ${TABLES.CHEMICAL_COMPLEX_TEXT} ON ${TABLES.CHEMICAL_COMPLEX_TEXT}.id = ${TABLES.INGREDIENT}.chemicalComplexID 
            WHERE fertilizerID = ?`

            this.database.all(sql,
                [fertilizerId],
                function(err, dataFotIngredients: any[]) {
                    if (err) {
                        return reject(err)
                    }

                    const ingredientsDTO = dataFotIngredients.map(ingredientDBComplexDB => {
                        const chemicalComplexDTO: ChemicalComplexDTO = {
                            id: ingredientDBComplexDB.chemicalID,
                            name: ingredientDBComplexDB.name,
                            userId: ingredientDBComplexDB.userID,
                            chemicalAggregates: JSON.parse(ingredientDBComplexDB.chemicalAggregates)
                        }

                        const ingredientDTO: IngredientDTO = {
                            id: ingredientDBComplexDB.id,
                            valuePercent: ingredientDBComplexDB.valuePercent,
                            chemicalComplex: chemicalComplexDTO
                        }

                        return ingredientDTO
                    })
                    return resolve(ingredientsDTO)
                })
        })
    }

    private _selectFertilizersForUser(userId: string): Promise<FertilizerDB[]> {
        return new Promise<FertilizerDB[]>((resolve, reject) => {
            const sql = `SELECT * FROM ${TABLES.FERTILIZER} WHERE userID = ?`

            this.database.all(sql,
                [userId],
                function(err, fertilizersDB: FertilizerDB[]) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(fertilizersDB)
                })
        })
    }

    async updateFertilizers(fertilizers: FertilizerDTO[], userId: string): Promise<FertilizerDTO[]> {
        try {
            const updateFertilizersPromises = fertilizers.map(async fertilizerDTO => {
                const oldIngredients = await this._selectIngredients(fertilizerDTO.id)
                await this._deleteIngredients(oldIngredients.map(ingredient => ingredient.id))
                const fertilizerDB = new Fertilizer(fertilizerDTO).toDB(userId)
                await this._updateFertilizer(fertilizerDB)
                await this._addIngredients(fertilizerDTO)
                return fertilizerDTO
            })

            return await Promise.all(updateFertilizersPromises)
        } catch (err) {
            this.logger.error(`${getClassName(this)}#updateFertilizers error: ${JSON.stringify(err)}`)
            console.log(err)
            throw err
        }
    }

    private _updateFertilizer(fertilizer: FertilizerDB): Promise<FertilizerDB> {
        return new Promise<FertilizerDB>((resolve, reject) => {
            const sql = `UPDATE ${TABLES.FERTILIZER} 
            SET name = ?, userID = ?, orderNumber = ?
            WHERE id = ? AND userID = ?`

            this.database.run(sql,
                [fertilizer.name, fertilizer.userId, fertilizer.orderNumber,
                fertilizer.id, fertilizer.userId],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(fertilizer)
                })
        })

    }

    async getSolutions(userId: string): Promise<SolutionDTO[]> {
        try {
            const solutionsDB = await this._selectSolutionsForUser(userId)
            return await this._attachDosagesForSolutions(solutionsDB)
        } catch (err) {
            this.logger.error(`${getClassName(this)}#getSolutions error: ${JSON.stringify(err)}`)
            console.log(err)
            throw err
        }
    }

    getSolutionsById(solutionsIds: string[], userId: string): Promise<SolutionDTO[]> {
        try {
            const promises = solutionsIds.map(async solutionId => {
                const solutionDB = await this._selectSolutionByIdForUser(solutionId, userId)
                const solutions = await this._attachDosagesForSolutions([solutionDB])
                return solutions[0]
            })

            return Promise.all(promises)

        } catch (err) {
            this.logger.error(`${getClassName(this)}#getSolutionsById error: ${JSON.stringify(err)}`)
            console.log(err)
            throw err
        }
    }

    private async _attachDosagesForSolutions(solutionsDB: SolutionDB[]): Promise<SolutionDTO[]> {
        const promises = solutionsDB.map(async solutionDB => {
            const dosagesDB = await this._selectDosagesForSolution(solutionDB.id)
            const dosagesDTO: DosageDTO[] = await this._attachFertilizersToDosages(dosagesDB)

            return {
                id: solutionDB.id,
                name: solutionDB.name,
                dosages: [...dosagesDTO],
                orderNumber: solutionDB.orderNumber,
                timestamp: solutionDB.timestamp
            } as SolutionDTO
        })

        return Promise.all(promises)
    }

    private async _attachFertilizersToDosages(dosagesDB: DosageDB[]): Promise<DosageDTO[]> {
        try{
            const dosagesPromises = dosagesDB.map(async dosageDB => {
                const fertilizersDTO = await this._getFertilizersById([dosageDB.fertilizerID])
                if (notEmptyArray(fertilizersDTO)) {
                    const targetFertilizer: FertilizerDTO = fertilizersDTO[0]
                    return {
                        id: dosageDB.id,
                        valueGram: dosageDB.valueGram,
                        fertilizer: targetFertilizer
                    } as DosageDTO
                }

                return
            })

            const dosagesDTO = await Promise.all(dosagesPromises)
            return dosagesDTO.filter(dosage => dosage)
        } catch (err) {
            throw err
        }
    }

    private _selectDosagesForSolution(solutionId: string): Promise<DosageDB[]> {
        return new Promise<DosageDB[]>((resolve, reject) => {
            const sql = `SELECT 
            ${TABLES.DOSAGE}.id, ${TABLES.DOSAGE}.valueGram, ${TABLES.DOSAGE}.solutionID, ${TABLES.DOSAGE}.fertilizerID 
            FROM ${TABLES.DOSAGE}
            JOIN ${TABLES.SOLUTION} ON ${TABLES.SOLUTION}.id = ${TABLES.DOSAGE}.solutionID
            WHERE ${TABLES.SOLUTION}.id = ?;`

            this.database.all(sql,
                [solutionId],
                function(err, dosageDB: DosageDB[]) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(dosageDB)
                })
        })

    }

    private _selectSolutionByIdForUser(solutionId: string, userId: string): Promise<SolutionDB> {
        return new Promise<SolutionDB>((resolve, reject) => {
            const sql = `SELECT * FROM ${TABLES.SOLUTION} WHERE id = ? AND userID = ?`

            this.database.get(sql,
                [solutionId, userId],
                function(err, solutionsDB: SolutionDB) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(solutionsDB)
                })
        })
    }

    private _selectSolutionsForUser(userId: string): Promise<SolutionDB[]> {
        return new Promise<SolutionDB[]>((resolve, reject) => {
            const sql = `SELECT * FROM ${TABLES.SOLUTION} WHERE userID = ?`

            this.database.all(sql,
                [userId],
                function(err, solutionsDB: SolutionDB[]) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(solutionsDB)
                })
        })
    }


    addSolutions(solutionsDTO: SolutionDTO[], userId: string): Promise<SolutionDB[]> {
        try {
            const promises = solutionsDTO.map(async solutionDTO => {
                const solutionDB = new Solution(solutionDTO).toDB(userId)
                const insertedSolutionsDS = await this._insertSolution(solutionDB)
                await this._addDosages(solutionDTO.dosages, solutionDTO.id)

                return insertedSolutionsDS
            })

            return Promise.all(promises)
        } catch (err) {
            this.logger.error(`${getClassName(this)}#addSolutions error: ${JSON.stringify(err)}`)
            console.log(err)
            throw err
        }

    }

    private _addDosages(dosages: DosageDTO[], solutionId: string): Promise<DosageDB[]> {
        const promises = dosages.map(async dosage => {
            const dosageDB = new Dosage(dosage).toDB(solutionId)
            return await this._insertDosage(dosageDB)
        })

        return Promise.all(promises)
    }

    private _insertDosage(dosageDB: DosageDB): Promise<DosageDB> {
        return new Promise<DosageDB>((resolve, reject) => {
            const sql = `INSERT INTO ${TABLES.DOSAGE} (id, valueGram, solutionID, fertilizerID) VALUES (?, ?, ?, ?)`

            this.database.run(sql,
                [dosageDB.id, dosageDB.valueGram, dosageDB.solutionID, dosageDB.fertilizerID],
                function(err) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(dosageDB)
                })
        })
    }

    private _insertSolution(solutionDB: SolutionDB): Promise<SolutionDB> {
        return new Promise<SolutionDB>((resolve, reject) => {
            const sql = `INSERT INTO ${TABLES.SOLUTION}(id, name, userID, orderNumber, timestamp) VALUES (?, ?, ?, ?, ?)`

            this.database.run(sql,
                [solutionDB.id, solutionDB.name, solutionDB.userId, solutionDB.orderNumber, solutionDB.timestamp],
                function(err) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(solutionDB)
                })
        })
    }

    async deleteSolutions(solutionsIds: string[], userId: string): Promise<string[]> {
        try {
            const deletePromises = solutionsIds.map(solutionId => {
                return this._deleteSolution(solutionId, userId)
            })

            return Promise.all(deletePromises)
        } catch (err) {
            throw err
        }
    }

    private _deleteSolution(solutionId: string, userId: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const sql = `DELETE FROM ${TABLES.SOLUTION} WHERE id = ? AND userID = ?`

            this.database.run(sql,
                [solutionId, userId],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(solutionId)
                })
        })
    }

    async updateSolutions(solutionsDTO: SolutionDTO[], userId: string): Promise<SolutionDTO[]> {
        try {
            const promises = solutionsDTO.map(async solutionDTO => {
                const solutionDB = new Solution(solutionDTO).toDB(userId)
                await this._deleteDosagesForSolution(solutionDB.id)
                const updatedSolutionsDB = await this._updateSolution(solutionDB)
                await this._addDosages(solutionDTO.dosages, solutionDTO.id)
                return updatedSolutionsDB
            })

            const solutions = await Promise.all(promises)
            return this.getSolutionsById(Solution.getIds(solutions), userId)

        } catch (err) {
            this.logger.error(`${getClassName(this)}#addSolutions error: ${JSON.stringify(err)}`)
            console.log(err)
            throw err
        }
    }

    private async _updateSolution(solutionDB: SolutionDB): Promise<SolutionDB> {
        return new Promise<SolutionDB>((resolve, reject) => {
            const sql = `UPDATE ${TABLES.SOLUTION} 
            SET name = ?, orderNumber = ?
            WHERE id = ? AND userID = ?`

            this.database.run(sql,
                [solutionDB.name, solutionDB.orderNumber,
                    solutionDB.id, solutionDB.userId],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(solutionDB)
                })
        })
    }

    private async _deleteDosagesForSolution(solutionId: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const sql = `DELETE FROM ${TABLES.DOSAGE} WHERE solutionID = ?`

            this.database.run(sql,
                [solutionId],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(true)
                })
        })
    }

    async getAllAgricultures(userId: string): Promise<AgricultureDTO[]> {
        try {
            const agriculturesDB = await this._selectAllAgriculturesForUser(userId)
            return agriculturesDB.map(agricultureDB => Agriculture.fromDBToDTO(agricultureDB))
        } catch (err) {
            this.logger.error(`${getClassName(this)}#getAllAgricultures error: ${JSON.stringify(err)}`)
            console.log(err)
            throw err
        }
    }

    private _selectAllAgriculturesForUser(userId: string): Promise<AgricultureDB[]> {
        return new Promise<AgricultureDB[]>((resolve, reject) => {
            const sql = `SELECT * FROM ${TABLES.AGRICULTURE} WHERE userID = ?`

            this.database.all(sql,
                [userId],
                function(err, agriculturesDB: AgricultureDB[]) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(agriculturesDB)
                })
        })
    }

    addAgricultures(agriculturesDTO: AgricultureDTO[], userId: string): Promise<AgricultureDTO[]> {
        const promises = agriculturesDTO.map(async agricultureDTO => {
            const agricultureDB = new Agriculture(agricultureDTO).toDB(userId)
            const addedAgricultureDB = await this._insertAgriculture(agricultureDB)
            return Agriculture.fromDBToDTO(addedAgricultureDB)
        })

        return Promise.all(promises)
    }

    private _insertAgriculture(agricultureDB: AgricultureDB): Promise<AgricultureDB> {
        return new Promise<AgricultureDB>((resolve, reject) => {
            const sql = `INSERT INTO ${TABLES.AGRICULTURE}(id, name, userID, vegetation, bloom) VALUES (?, ?, ?, ?, ?)`

            this.database.run(sql,
                [agricultureDB.id, agricultureDB.name, agricultureDB.userId, agricultureDB.vegetation, agricultureDB.bloom],
                function(err) {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(agricultureDB)
                })
        })
    }

    deleteAgricultures(agriculturesIds: string[], userId: string): Promise<string[]> {
        const promises = agriculturesIds.map(agricultureId => {
            return this._deleteAgriculture(agricultureId, userId)
        })

        return Promise.all(promises)
    }

    private _deleteAgriculture(agricultureId: string, userId: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const sql = `DELETE FROM ${TABLES.AGRICULTURE} WHERE id = ? AND userID = ?`

            this.database.run(sql,
                [agricultureId, userId],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(agricultureId)
                })
        })
    }

    updateAgricultures(agriculturesDTO: AgricultureDTO[], userId: string): Promise<AgricultureDTO[]> {
        try {
            const updatePromises = agriculturesDTO.map(async agricultureDTO => {
                const agricultureDB = new Agriculture(agricultureDTO).toDB(userId)
                const addedAgricultureDB = await this._updateAgriculture(agricultureDB)
                return Agriculture.fromDBToDTO(addedAgricultureDB)
            })

            return Promise.all(updatePromises)

        } catch (err) {
            this.logger.error(`${getClassName(this)}#updateAgricultures error: ${JSON.stringify(err)}`)
            console.log(err)
            throw err
        }
    }

    private _updateAgriculture(agricultureDB: AgricultureDB): Promise<AgricultureDB> {
        return new Promise<AgricultureDB>((resolve, reject) => {
            const sql = `UPDATE ${TABLES.AGRICULTURE} 
            SET name = ?, vegetation = ?, bloom = ?
            WHERE id = ? AND userID = ?`

            this.database.run(sql,
                [agricultureDB.name, agricultureDB.vegetation, agricultureDB.bloom,
                    agricultureDB.id, agricultureDB.userId],
                (err) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(agricultureDB)
                })
        })
    }


}