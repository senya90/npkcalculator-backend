import { Fertilizer, FertilizerDTO } from "@dto/fertilizer/fertilizer";

export type DosageDTO = {
    id: string
    valueGram: number
    fertilizer: FertilizerDTO | Fertilizer
}

export type DosageDB = {
    id: string
    valueGram: number
    solutionID: string
    fertilizerID: string
}

export class Dosage {
    id: string
    valueGram: number
    fertilizer: FertilizerDTO | Fertilizer

    constructor(dosageDTO: DosageDTO) {
        this.id = dosageDTO.id
        this.valueGram = dosageDTO.valueGram
        this.fertilizer = new Fertilizer(dosageDTO.fertilizer)
    }

    toDB(solutionId: string): DosageDB {
        return {
            id: this.id,
            valueGram: this.valueGram,
            fertilizerID: this.fertilizer.id,
            solutionID: solutionId
        }
    }
}