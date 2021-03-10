import { getNowTimeSeconds } from "@helpers/utils";
import { DosageDTO } from "@dto/solution/dosage";
import { FertilizerDB, FertilizerDTO } from "@dto/fertilizer/fertilizer";

export type SolutionDB = {
    id: string
    name: string
    userId: string
    orderNumber: number | null
    timestamp: number
}

export type SolutionDTO = {
    id: string
    name: string
    dosages: DosageDTO[]
    orderNumber: number | null
    timestamp: number
}

export class Solution {
    id: string
    name: string
    dosages: DosageDTO[]
    orderNumber: number | null
    timestamp: number

    constructor(solutionDTO: SolutionDTO) {
        this.id = solutionDTO.id
        this.name = solutionDTO.name
        this.dosages = [...solutionDTO.dosages]
        this.orderNumber = solutionDTO.orderNumber
        this.timestamp = solutionDTO.timestamp
    }

    static getIds<T extends Solution | SolutionDB | SolutionDTO>(solution: T[]): string[] {
        return solution.map(s => s.id)
    }

    toDB(userId: string): SolutionDB {
        return {
            id: this.id,
            name: this.name,
            userId: userId,
            orderNumber: this.orderNumber,
            timestamp: this.timestamp || getNowTimeSeconds()
        }
    }
}