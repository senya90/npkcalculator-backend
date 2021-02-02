import { ChemicalUnitDto } from "@dto/chemicalUnitDto";
import { RoleDB } from "@dto/user/roleDTO";
import { UserDB } from "@dto/user/userDTO";
import { TRole } from "@models/role";
import { TokensPair } from "@models/tokens";
import { ChemicalComplexDB } from "@dto/chemical/chemicalComplexDTO";
import { ChemicalAggregateDB } from "@dto/chemical/chemicalAggregateDTO";
import { ChemicalAtomDB } from "@dto/chemical/chemicalAtomDTO";

export interface IDatabaseProvider {
    connect: (databaseName: string, databaseUrl: string) => Promise<any>
}

export interface IChemicalDatabaseProvider extends IDatabaseProvider {
    getChemicals: () => Promise<ChemicalUnitDto[]>
    addComplex: (chemicalComplexDB: ChemicalComplexDB) => void
    addAggregate: (chemicalAggregateDB: ChemicalAggregateDB) => void
    addAtom: (chemicalAtom: ChemicalAtomDB) => void
}

export interface IUserDatabaseProvider extends IDatabaseProvider {
    getUser: (userId: string) => Promise<UserDB>
    getUserByLogin: (login: string) => Promise<UserDB | null>
    registerUser: (user: UserDB) => Promise<any>
    getRoleByName: (roleName: TRole) => Promise<RoleDB>
    saveTokensForUser: (userId: string, tokens: TokensPair) => Promise<TokensPair>
}