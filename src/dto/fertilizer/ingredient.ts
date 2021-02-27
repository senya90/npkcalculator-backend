import { ChemicalComplex } from "@dto/chemical/chemicalComplex";
import { IdGenerator } from "@helpers/idGenerator/IdGenerator";

export type IngredientDTO = {
    id: string
    valuePercent: number
    chemicalComplex: ChemicalComplex
}

export type IngredientDB = {
    id: string
    valuePercent: number
    chemicalComplexId: string
}

export class Ingredient {
    id: string
    valuePercent: number
    chemicalComplex: ChemicalComplex

    constructor(ingredientDTO: IngredientDTO) {
        this.id = ingredientDTO.id ? ingredientDTO.id : IdGenerator.generate()
        this.valuePercent = ingredientDTO.valuePercent
        this.chemicalComplex = ingredientDTO.chemicalComplex
    }

    toDB(): IngredientDB {
        return {
            id: this.id,
            valuePercent: this.valuePercent,
            chemicalComplexId: this.chemicalComplex.id
        }
    }

}