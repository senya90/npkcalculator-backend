import { ChemicalAtom } from "./chemicalAtom"

export type ChemicalAggregateDB = {
    id: string
    multiplier: number
    userID: string
}

export type ChemicalAggregateDTO = {
    id: string
    atoms: ChemicalAtom[]
    multiplier: number
}

export class ChemicalAggregate {
    id: string
    atoms: ChemicalAtom[]
    multiplier: number

    constructor(chemicalAggregateDTO: ChemicalAggregateDTO) {
        this.id = chemicalAggregateDTO.id
        this.multiplier = chemicalAggregateDTO.multiplier
        this.atoms = [...chemicalAggregateDTO.atoms]
    }

    toChemicalAggregateDB = (userId: string): ChemicalAggregateDB => {
        return {
            id: this.id,
            multiplier: this.multiplier,
            userID: userId
        }
    }
}