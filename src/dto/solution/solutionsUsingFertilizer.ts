import { FertilizerDTO } from "@dto/fertilizer/fertilizer";
import { SolutionDTO } from "@dto/solution/solution";

export type SolutionsUsingFertilizer = {
    fertilizer: FertilizerDTO,
    solutions: SolutionDTO[]
}