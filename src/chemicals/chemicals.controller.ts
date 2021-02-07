import { Body, Controller, Get, Post, Request, UseGuards } from "@nestjs/common";
import { DatabaseService } from "@services/database/database.service";
import { HttpResponse } from "@models/httpResponse";
import { HelperResponse } from "@helpers/helperResponse";
import { ChemicalComplex, ChemicalComplexDTO } from "@dto/chemical/chemicalComplex";
import { RegistrationService } from "../user/registration/registration.service";
import { getClassName } from "@helpers/utils";
import { Logger } from "@modules/logger/service/logger";
import { AuthGuard } from "../guards/auth.guard";
import { TokenService } from "../user/token/token.service";

@Controller('chemicals')
export class ChemicalsController {

    constructor(
        private readonly database: DatabaseService,
        private readonly registrationService: RegistrationService,
        private readonly tokenService: TokenService,
        private readonly logger: Logger
    ) {}

    @Get()
    async getChemicals(): Promise<HttpResponse> {
        if (this.database.isReady()) {
            const chemicals = await this.database.chemical.getChemicals()
            return HelperResponse.getSuccessResponse(chemicals)
        }

        return HelperResponse.getDBError()
    }

    @Get('chemical-complex')
    @UseGuards(AuthGuard)
    async getAllChemicalComplex(@Body() body: {withoutAdmins: boolean}, @Request() req: any): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                const accessToken = req.headers.authorization
                const decodeToken = await this.tokenService.decodeToken(accessToken)
                const userId = decodeToken.userId
                const roleId = decodeToken.role
                const role = await this.database.user.getRole(roleId)

                if (role.name === "admin") {
                    const complexes = await this._getChemicalComplexesForAdmin(userId, body.withoutAdmins)
                    return HelperResponse.getSuccessResponse(complexes)
                }

                const complexes = await this._getChemicalComplexesForUser(userId, body.withoutAdmins)
                return HelperResponse.getSuccessResponse(complexes)

            } catch (err) {
                this.logger.error(`${getClassName(this)}#getAllChemicalComplex. err: ${err.message} ${JSON.stringify(err)}`)
                return HelperResponse.getServerError()
            }
        }

        return HelperResponse.getDBError()
    }

    private _getChemicalComplexesForAdmin = async (userId: string, withoutOtherAdmins: boolean): Promise<ChemicalComplexDTO[]> => {
        if (withoutOtherAdmins) {
            return await this.database.chemical.getChemicalComplexes([userId])
        }

        const allAdmins = await this.database.user.getAllAdminUsers()
        return await this.database.chemical.getChemicalComplexes(allAdmins.map(admin => admin.id))
    }

    private _getChemicalComplexesForUser = async (userId: string, withoutAdmins: boolean): Promise<ChemicalComplexDTO[]> => {
        const complexes: ChemicalComplexDTO[] =  await this.database.chemical.getChemicalComplexes([userId])

        if (!withoutAdmins) {
            const allAdmins = await this.database.user.getAllAdminUsers()
            const allAdminComplexes = await this.database.chemical.getChemicalComplexes(allAdmins.map(admin => admin.id))
            complexes.push(...allAdminComplexes)
        }

        return complexes
    }

    @Post('chemical-complex')
    @UseGuards(AuthGuard)
    async addNewComplex(@Body() chemicalComplexDTO: ChemicalComplexDTO, @Request() req: any): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                const chemicalComplex = new ChemicalComplex(chemicalComplexDTO)

                const accessToken = req.headers.authorization
                const decodeToken = await this.tokenService.decodeToken(accessToken)
                const userId = decodeToken.userId

                const result = await this.database.chemical.deleteComplexesAsText([chemicalComplex.id])
                this.logger.log(`${getClassName(this)}#addNewComplex. Clear complex ${JSON.stringify(result)}`)

                const addedChemicalComplexes = await this.database.chemical.addComplexesAsText([chemicalComplex], userId)
                const format = addedChemicalComplexes.map(complex => ({
                    name: complex.name,
                    id: complex.id
                }))
                this.logger.log(`${getClassName(this)}#addNewComplex. ${JSON.stringify(format)}. User: ${userId}`)
                return HelperResponse.getSuccessResponse(addedChemicalComplexes)
            } catch (err) {
                console.log('CATCH err', err)
                return HelperResponse.getServerError()
            }

        }

        return HelperResponse.getDBError()
    }
}
