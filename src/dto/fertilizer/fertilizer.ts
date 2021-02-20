import { Ingredient } from "./ingredient";

export type FertilizerDTO = {
    id: string
    name: string
    userId: string
    ingredients: Ingredient[]
    order: number | null | undefined
    timestamp: number
}

export type FertilizerDB = {
    id: string
    name: string
    userId: string
    ingredients: string
    order: number | null | undefined
    timestamp: number
}