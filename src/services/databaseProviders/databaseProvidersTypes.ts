import { ChemicalUnitDto } from "@dto/chemicalUnitDto";
import { RoleDB } from "@dto/user/roleDTO";
import { UserDB } from "@dto/user/userDTO";
import { TRole } from "@models/role";

export interface IDatabaseProvider {
    connect: (databaseName: string, databaseUrl: string) => Promise<any>
}

export interface IChemicalDatabaseProvider extends IDatabaseProvider {
    getChemicals: () => Promise<ChemicalUnitDto[]>
}

export interface IUserDatabaseProvider extends IDatabaseProvider {
    getUser: () => Promise<any>
    getUserByLogin: (login: string) => Promise<UserDB | null>
    registerUser: (user: UserDB) => Promise<any>
    getRoleByName: (roleName: TRole) => Promise<RoleDB>
}