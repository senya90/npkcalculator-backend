import jwt from 'jsonwebtoken'
import { Body, Controller, Get, Post, Request } from "@nestjs/common";
import { DatabaseService } from "@services/database/database.service";
import { HttpResponse } from "@models/httpResponse";
import { HelperResponse } from "@helpers/helperResponse";
import { ChemicalComplexDB, ChemicalComplexDTO } from "@dto/chemical/chemicalComplexDTO";
import { ChemicalAtomDB, ChemicalAtomDTO } from "@dto/chemical/chemicalAtomDTO";
import { RegistrationService } from "../user/registration/registration.service";
import { ChemicalAggregateDB } from "@dto/chemical/chemicalAggregateDTO";

@Controller('chemicals')
export class ChemicalsController {

    constructor(private readonly database: DatabaseService, private readonly registrationService: RegistrationService) {
    }

    @Get()
    async getChemicals(): Promise<HttpResponse> {
        if (this.database.isReady()) {
            const chemicals = await this.database.chemicalProvider.getChemicals()
            return HelperResponse.getSuccessResponse(chemicals)
        }

        return HelperResponse.getDBError()
    }

    @Post('chemical-complex')
    async addNewComplex(@Body() chemicalComplex: ChemicalComplexDTO, @Request() req: any): Promise<HttpResponse> {
        // !!!TODO: CHECK AUTH before handle complex

        if (this.database.isReady()) {
            try {
                await this.database.chemicalProvider.deleteComplexes([chemicalComplex.id])
                await this.database.chemicalProvider.deleteAggregations(chemicalComplex.chemicalAggregates.map(aggregation => aggregation.id))
                const atoms: ChemicalAtomDTO[] = this._getAtomsFromComplex(chemicalComplex)
                await this.database.chemicalProvider.deleteAtoms(atoms.map(atom => atom.id))



                let accessToken = req.headers.authorization
                accessToken = this.registrationService.sanitizeToken(accessToken)
                const decodeToken = await this.registrationService.verifyToken(accessToken)
                const userId = decodeToken.userId

                const atomsForDB: ChemicalAtomDB[] = atoms.map(atom => ({
                    id: atom.id,
                    userID: userId,
                    chemicalUnitID: atom.chemicalUnit.id,
                    atomsCount: atom.atomsCount

                }))
                const atomsResult = await this.database.chemicalProvider.addAtoms(atomsForDB)

                const aggregates = chemicalComplex.chemicalAggregates
                const aggregatesDB: ChemicalAggregateDB[] = chemicalComplex.chemicalAggregates.map(aggregate => {
                    return {
                        id: aggregate.id,
                        multiplier: aggregate.multiplier,
                        userID: userId
                    }
                })

                const chemicalComplexDB: ChemicalComplexDB = {
                    id: chemicalComplex.id,
                    name: chemicalComplex.name,
                    userID: userId
                }

                await this.database.chemicalProvider.addAggregates(aggregatesDB)
                await this.database.chemicalProvider.addComplexes([chemicalComplexDB])


                return HelperResponse.getSuccessResponse({})
            } catch (err) {
                console.log('CATCH err', err)
                return HelperResponse.getServerError()
            }

        }

        return HelperResponse.getDBError()
    }

    private _getAtomsFromComplex = (chemicalComplex: ChemicalComplexDTO): ChemicalAtomDTO[] => {
        const atoms = []
        chemicalComplex.chemicalAggregates.forEach(aggregation => {
            return aggregation.atoms.forEach(atom => atoms.push(atom))
        })
        return atoms
    }
}
