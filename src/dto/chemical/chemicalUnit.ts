export type ChemicalUnitDTO = {
    id: string
    name: string
    molar: number
}

export type ChemicalUnitValueDTO = {
    chemicalUnit: ChemicalUnitDTO
    value: number
}