import { ChemicalComplex } from "@dto/chemical/chemicalComplex";

export type Ingredient = {
    id: string
    valuePercent: number
    chemicalComplex: ChemicalComplex
}