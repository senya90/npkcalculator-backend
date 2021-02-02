import { ChemicalUnit } from "@models/chemicalUnit";

export type ChemicalAtomDB = {
    id: string
    chemicalUnitID: string
    atomsCount: number
    userID: string
}

export type ChemicalAtomDTO = {
    id: string
    chemicalUnit: ChemicalUnit
    atomsCount: number
}