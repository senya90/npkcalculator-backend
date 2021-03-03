import { ChemicalUnitDto } from "@dto/chemicalUnitDto";
import { UserDB } from "@dto/user/userDTO";
import { RoleDB, RoleName } from "@models/role";
import { TokensPair } from "@models/tokens";
import { ChemicalComplex, ChemicalComplexDTO } from "@dto/chemical/chemicalComplex";
import { Fertilizer, FertilizerDB, FertilizerDTO } from "@dto/fertilizer/fertilizer";
import { FertilizersUsingComplexes } from "@models/fertilizersUsingComplexes";

export interface IDatabaseProvider {
    connect: (databaseName: string, databaseUrl: string) => Promise<any>
}

export interface IChemicalDatabaseProvider extends IDatabaseProvider {
    getChemicals: () => Promise<ChemicalUnitDto[]>

    getUserChemicalComplexes: (usersIds: string[]) => Promise<ChemicalComplexDTO[]>
    addComplexes: (chemicalComplexes: ChemicalComplex[], userId: string) => Promise<any>
    deleteComplexes: (chemicalComplexesIds: string[]) => Promise<any>

    addComplexesAsText: (chemicalComplexes: ChemicalComplex[], userId: string) => Promise<ChemicalComplex[]>
    updateComplexes: (chemicalComplexes: ChemicalComplex[], userId: string) => Promise<ChemicalComplexDTO[]>
    deleteComplexesAsText: (chemicalComplexesIds: string[]) => Promise<string[]>
    deleteComplexesAsTextForUser: (chemicalComplexesIds: string[], userId: string) => Promise<string[]>
    deleteComplexesAsTextOnlyAdmin: (chemicalComplexesIds: string[]) => Promise<string[]>
    getFertilizersUsingComplexes: (chemicalComplexesIds: string[], userId?: string) => Promise<FertilizersUsingComplexes[]>

    getFertilizers: (userId: string) => Promise<FertilizerDTO[]>
    addFertilizer: (fertilizers: FertilizerDTO[], userId: string) => Promise<FertilizerDB[]>
    deleteFertilizers: (fertilizersIds: string[], userId: string) => Promise<string[]>
    updateFertilizers: (fertilizers: FertilizerDTO[], userId: string) => Promise<FertilizerDTO[]>
}

export interface IUserDatabaseProvider extends IDatabaseProvider {
    getUser: (userId: string) => Promise<UserDB>
    getUserByLogin: (login: string) => Promise<UserDB | null>
    getAllAdminUsers: () => Promise<UserDB[]>

    registerUser: (user: UserDB) => Promise<any>

    getRoleByName: (roleName: RoleName) => Promise<RoleDB>
    getRole: (roleId: string) => Promise<RoleDB>

    saveTokensForUser: (userId: string, tokens: TokensPair) => Promise<TokensPair>
    deleteTokens: (accessToken: string, userId: string) => Promise<boolean>
}