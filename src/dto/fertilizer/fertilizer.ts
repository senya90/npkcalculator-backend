import { Ingredient } from "./ingredient";
import { getNowTimeSeconds } from "@helpers/utils";

export type FertilizerDTO = {
    id: string
    name: string
    ingredients: Ingredient[]
    orderNumber: number | null | undefined
    timestamp: number
}

export type FertilizerDB = {
    id: string
    name: string
    userId: string
    ingredients: string
    orderNumber: number | null | undefined
    timestamp: number
}

export class Fertilizer {
    id: string
    name: string
    ingredients: Ingredient[]
    orderNumber: number | null | undefined
    private timestamp: number

    constructor(fertilizer: FertilizerDTO) {
        this.id = fertilizer.id
        this.name = fertilizer.name
        this.ingredients = [...fertilizer.ingredients]
        this.orderNumber = fertilizer.orderNumber || null
        this.timestamp = fertilizer.timestamp
    }

    toDB(userId: string): FertilizerDB {
        return {
            id: this.id,
            name: this.name,
            userId: userId,
            ingredients: JSON.stringify(this.ingredients),
            orderNumber: this.orderNumber,
            timestamp: this.timestamp || getNowTimeSeconds()
        }
    }

    createTimestamp() {
        this.timestamp = getNowTimeSeconds()
    }
}