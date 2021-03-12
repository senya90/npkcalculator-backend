import { ChemicalUnitValueDTO } from "@dto/chemical/chemicalUnit";

export type AgricultureDTO = {
    id: string
    name: string
    vegetation: ChemicalUnitValueDTO[]
    bloom: ChemicalUnitValueDTO[]
}

export type AgricultureDB = {
    id: string
    name: string
    userId: string
    vegetation: string
    bloom: string
}

export class Agriculture {
    id: string
    name: string
    vegetation: ChemicalUnitValueDTO[]
    bloom: ChemicalUnitValueDTO[]

    constructor(agriculture: Agriculture | AgricultureDTO) {
        this.name = agriculture.name
        this.vegetation = agriculture.vegetation ? [...agriculture.vegetation] : []
        this.bloom = agriculture.bloom ? [...agriculture.bloom] : []
        this.id = agriculture.id
    }

    toDB(userId: string): AgricultureDB {
        return {
            id: this.id,
            name: this.name,
            userId: userId,
            vegetation: this.vegetation ? JSON.stringify(this.vegetation) : JSON.stringify([]),
            bloom: this.bloom ? JSON.stringify(this.bloom) : JSON.stringify([])
        }
    }

    static fromDBToDTO(agricultureDB: AgricultureDB): AgricultureDTO {
        return {
            id: agricultureDB.id,
            name: agricultureDB.name,
            vegetation: [...JSON.parse(agricultureDB.vegetation)],
            bloom: [...JSON.parse(agricultureDB.bloom)]
        }
    }
}