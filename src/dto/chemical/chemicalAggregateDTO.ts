import { ChemicalAtomDTO } from "./chemicalAtomDTO"

export type ChemicalAggregateDB = {
    id: string
    multiplier: number
    userID: string
}

export type ChemicalAggregateDTO = {
    id: string
    atoms: ChemicalAtomDTO[]
    multiplier: number
}