import { ChemicalAggregateDTO } from "./chemicalAggregateDTO"

export type ChemicalComplexDB = {
    id: string
    name: string
    userID: string
}

export type ChemicalComplexDTO = {
    id: string
    name: string
    chemicalAggregates: ChemicalAggregateDTO[]
}