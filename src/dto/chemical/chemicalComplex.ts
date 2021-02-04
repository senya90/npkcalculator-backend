import { ChemicalAggregate } from "./chemicalAggregate";
import { ChemicalAtomDTO } from "@dto/chemical/chemicalAtom";

export type ChemicalComplexDB = {
    id: string
    name: string
    userID: string
}

export type ChemicalComplexDTO = {
    id: string
    name: string
    chemicalAggregates: ChemicalAggregate[]
}

export class ChemicalComplex {
    id: string
    name: string
    chemicalAggregates: ChemicalAggregate[]

    constructor(chemicalComplex: ChemicalComplexDTO) {
        this.id = chemicalComplex.id
        this.name = chemicalComplex.name
        this.chemicalAggregates = chemicalComplex.chemicalAggregates
    }

    getAtoms = () => {
        const atoms: ChemicalAtomDTO[] = []
        this.chemicalAggregates.forEach(aggregate => {
            aggregate.atoms.forEach(atom => atoms.push(atom))
        })

        return atoms
    }

    toChemicalComplexDB = (userId: string): ChemicalComplexDB => {
        return {
            id: this.id,
            name: this.name,
            userID: userId
        }
    }
}