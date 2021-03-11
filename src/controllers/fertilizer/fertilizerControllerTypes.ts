import { SolutionsUsingFertilizer } from "@dto/solution/solutionsUsingFertilizer";

export type DeleteFertilizerResponse = {
    needToConfirm: boolean
    solutionsUsingFertilizers: SolutionsUsingFertilizer[],
    deletedFertilizersIds: string[]
}