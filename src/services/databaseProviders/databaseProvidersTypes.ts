import { ChemicalUnitDto } from "@dto/chemicalUnitDto";
import { UserRegistration } from "@dto/userDTO";

export interface IDatabaseProvider {
    connect: (databaseName: string, databaseUrl: string) => Promise<any>
}

export interface IChemicalDatabaseProvider extends IDatabaseProvider {
    getChemicals: () => Promise<ChemicalUnitDto[]>
}

export interface IUserDatabaseProvider extends IDatabaseProvider {
    getUser: () => Promise<any>
    registerUser: (user: UserRegistration) => Promise<any>
}