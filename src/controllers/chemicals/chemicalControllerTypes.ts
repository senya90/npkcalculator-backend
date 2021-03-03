import { FertilizersUsingComplexes } from "@models/fertilizersUsingComplexes";

export type DeleteComplexResponse = {
    needToConfirm: boolean
    fertilizerUsingComplexes: FertilizersUsingComplexes[],
    deletedComplexesIds: string[]
}