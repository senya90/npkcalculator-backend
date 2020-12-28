import { ChemicalUnit } from "@models/chemicalUnit";

export interface IDatabaseProvider {
    connect: () => void
}

export interface IChemicalDatabaseProvider extends IDatabaseProvider {
    getChemicals: () => Promise<ChemicalUnit>

}