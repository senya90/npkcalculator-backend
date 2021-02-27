import { IngredientDTO } from "./ingredient";
import { getNowTimeSeconds } from "@helpers/utils";

export type FertilizerDTO = {
    id: string
    name: string
    ingredients: IngredientDTO[]
    orderNumber: number | null | undefined
    timestamp: number
}

export type FertilizerDB = {
    id: string
    name: string
    userId: string
    orderNumber: number | null
    timestamp: number
}

export class Fertilizer {
    id: string
    name: string
    ingredients: IngredientDTO[]
    orderNumber: number | null
    private timestamp: number

    constructor(fertilizer: FertilizerDTO) {
        this.id = fertilizer.id
        this.name = fertilizer.name
        this.ingredients = [...fertilizer.ingredients]
        this.orderNumber = fertilizer.orderNumber || null
        this.timestamp = fertilizer.timestamp
    }

    static getIds<T extends Fertilizer | FertilizerDTO | FertilizerDB>(fertilizers: T[]): string[] {
        return fertilizers.map(f => f.id)
    }

    toDB(userId: string): FertilizerDB {
        return {
            id: this.id,
            name: this.name,
            userId: userId,
            orderNumber: this.orderNumber,
            timestamp: this.timestamp || getNowTimeSeconds()
        }
    }

    createTimestamp() {
        this.timestamp = getNowTimeSeconds()
    }
}