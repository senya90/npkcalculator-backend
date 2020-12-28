import {IdGenerator} from "../helpers/idGenerator/IdGenerator";

export class ChemicalUnit {
    id: string
    name: string
    molar: number

    constructor(name = '', molar = 0, id?: string) {
        this.name = name
        this.molar = molar
        this.id = id ? id : IdGenerator.generate()
    }
}