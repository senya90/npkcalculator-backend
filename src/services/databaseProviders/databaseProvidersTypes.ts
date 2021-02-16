import { ChemicalUnitDto } from "@dto/chemicalUnitDto";
import { UserDB } from "@dto/user/userDTO";
import { RoleDB, RoleName } from "@models/role";
import { TokensPair } from "@models/tokens";
import { ChemicalComplex, ChemicalComplexDTO } from "@dto/chemical/chemicalComplex";

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