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

export class ChemicalAtom {
    id: string
    chemicalUnit: ChemicalUnit
    atomsCount: number

    constructor(atom: ChemicalAtomDTO) {
        this.id = atom.id
        this.atomsCount = atom.atomsCount
        this.chemicalUnit = atom.chemicalUnit
    }
}