import { getNowTimeSeconds } from "@helpers/utils";

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
    dosages: any[]
    orderNumber: number | null
    timestamp: number
}

export type SolutionDosageRelationDB = {
    id: string
    solutionId: string
    dosageId: string
}

export class Solution {
    id: string
    name: string
    dosages: any[]
    orderNumber: number | null
    timestamp: number

    constructor(solutionDTO: SolutionDTO) {
        this.id = solutionDTO.id
        this.name = solutionDTO.name
        this.dosages = [...solutionDTO.dosages]
        this.orderNumber = solutionDTO.orderNumber
        this.timestamp = solutionDTO.timestamp
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