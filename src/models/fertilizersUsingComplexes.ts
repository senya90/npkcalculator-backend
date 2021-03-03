import { ChemicalComplexDTO } from "@dto/chemical/chemicalComplex";
import { FertilizerDTO } from "@dto/fertilizer/fertilizer";

export type FertilizersUsingComplexes = {
    chemicalComplex: ChemicalComplexDTO,
    fertilizers: FertilizerDTO[]
}