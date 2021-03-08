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
}