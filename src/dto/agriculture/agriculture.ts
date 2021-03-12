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
    static fromDBToDTO(agricultureDB: AgricultureDB): AgricultureDTO {
        return {
            id: agricultureDB.id,
            name: agricultureDB.name,
            vegetation: [...JSON.parse(agricultureDB.vegetation)],
            bloom: [...JSON.parse(agricultureDB.bloom)]
        }
    }
}