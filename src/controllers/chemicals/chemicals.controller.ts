import { Body, Controller, Get, HttpCode, Post, Request, UseGuards } from "@nestjs/common";
import { DatabaseService } from "@services/database/database.service";
import { HttpResponse } from "@models/httpResponse";
import { HelperResponse } from "@helpers/helperResponse";
import { ChemicalComplex, ChemicalComplexDTO } from "@dto/chemical/chemicalComplex";
import { RegistrationService } from "../user/registration/registration.service";
import { getClassName, notEmptyArray } from "@helpers/utils";
import { Logger } from "@modules/logger/service/logger";
import { AuthGuard } from "../../guards/auth.guard";
import { TokenService } from "../user/token/token.service";
import { GetUser } from "../../customDecorator/getUser";
import { GetRole } from "../../customDecorator/getRole";
import { DeleteComplexResponse } from "./chemicalControllerTypes";
import { FertilizersUsingComplexes } from "@models/fertilizersUsingComplexes";

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
    async getAllChemicalComplex(
        @Body() body: {withoutAdmins: boolean},
        @GetUser() userId: string,
        @GetRole() roleId: string
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
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
            return await this.database.chemical.getUserChemicalComplexes([userId])
        }

        const allAdmins = await this.database.user.getAllAdminUsers()
        return await this.database.chemical.getUserChemicalComplexes(allAdmins.map(admin => admin.id))
    }

    private _getChemicalComplexesForUser = async (userId: string, withoutAdmins: boolean): Promise<ChemicalComplexDTO[]> => {
        const complexes: ChemicalComplexDTO[] =  await this.database.chemical.getUserChemicalComplexes([userId])

        if (!withoutAdmins) {
            const allAdmins = await this.database.user.getAllAdminUsers()
            const allAdminComplexes = await this.database.chemical.getUserChemicalComplexes(allAdmins.map(admin => admin.id))
            complexes.push(...allAdminComplexes)
        }

        return complexes
    }

    @Post('chemical-complex')
    @UseGuards(AuthGuard)
    async addNewComplex(
        @Body() chemicalComplexDTO: ChemicalComplexDTO,
        @GetUser() userId: string,
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                const chemicalComplex = new ChemicalComplex(chemicalComplexDTO)

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
                this.logger.error(`${getClassName(this)}#addNewComplex. err: ${err.message} ${JSON.stringify(err)}`)
                return HelperResponse.getServerError()
            }

        }

        return HelperResponse.getDBError()
    }

    @Post('delete-chemical-complex')
    @HttpCode(200)
    @UseGuards(AuthGuard)
    async deleteComplexes(
        @Body('id') chemicalComplexesIds: string[],
        @Body('isConfirmed') isConfirmed: boolean,
        @GetUser() userId: string,
        @GetRole() roleId: string
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                const role = await this.database.user.getRole(roleId)
                let result: DeleteComplexResponse;

                if (role.name === "admin") {
                    result = await this._deleteComplexesAsAdmin(chemicalComplexesIds, isConfirmed)
                } else {
                    result = await this._deleteComplexesAsUser(chemicalComplexesIds, userId, isConfirmed)
                }

                return HelperResponse.getSuccessResponse(result)

            } catch (err) {
                this.logger.error(`${getClassName(this)}#deleteComplexes. err: ${err.message} ${JSON.stringify(err)}`)
                return HelperResponse.getServerError()
            }
        }

        return HelperResponse.getDBError()
    }

    private async _deleteComplexesAsUser(chemicalComplexesIds: string[], userId: string, isDeletingConfirmed: boolean): Promise<DeleteComplexResponse> {
        const fertilizerUsingComplexes = await this.database.chemical.getFertilizersUsingComplexes(chemicalComplexesIds, userId)

        if (notEmptyArray(fertilizerUsingComplexes) && !isDeletingConfirmed) {
            return this._makeResponseForConfirmation(fertilizerUsingComplexes)
        }

        const deletedComplexesIds = await this.database.chemical.deleteComplexesAsTextForUser(chemicalComplexesIds, userId)
        this.logger.log(`${getClassName(this)}#deleteComplexes. Delete for USER role: ${deletedComplexesIds}`)
        return {
            needToConfirm: false,
            fertilizerUsingComplexes,
            deletedComplexesIds
        }
    }

    private async _deleteComplexesAsAdmin(chemicalComplexesIds: string[], isDeletingConfirmed: boolean): Promise<DeleteComplexResponse> {
        const fertilizerUsingComplexes = await this.database.chemical.getFertilizersUsingComplexes(chemicalComplexesIds)

        if (notEmptyArray(fertilizerUsingComplexes) && !isDeletingConfirmed) {
            return this._makeResponseForConfirmation(fertilizerUsingComplexes)
        }

        if (notEmptyArray(fertilizerUsingComplexes)) {
            // todo: await notify users about changes in user/settings/notifications
        }

        const deletedComplexesIds = await this.database.chemical.deleteComplexesAsTextOnlyAdmin(chemicalComplexesIds)
        this.logger.log(`${getClassName(this)}#_deleteComplexAsAdmin. Delete for ADMIN role: ${deletedComplexesIds}`)
        return {
            needToConfirm: false,
            fertilizerUsingComplexes,
            deletedComplexesIds
        }
    }

    private _makeResponseForConfirmation = (fertilizerUsingComplexes: FertilizersUsingComplexes[]): DeleteComplexResponse  => {
        return {
            needToConfirm: true,
            fertilizerUsingComplexes,
            deletedComplexesIds: []
        }
    }

    @Post('update-chemical-complex')
    @UseGuards(AuthGuard)
    async updateComplexes(
        @Body() chemicalComplexDTO: ChemicalComplexDTO,
        @Request() req: any
    ): Promise<HttpResponse> {
        if (this.database.isReady()) {
            try {
                const chemicalComplexes = new ChemicalComplex(chemicalComplexDTO)
                const accessToken = req.headers.authorization
                const decodeToken = await this.tokenService.decodeToken(accessToken)
                const userId = decodeToken.userId

                const updatedComplexes = await this.database.chemical.updateComplexes([chemicalComplexes], userId)
                this.logger.log(`${getClassName(this)}#updateComplexes. Updated: ${JSON.stringify(updatedComplexes)}`)
                return HelperResponse.getSuccessResponse(updatedComplexes)

            } catch (err) {
                this.logger.error(`${getClassName(this)}#updateComplexes. err: ${err.message} ${JSON.stringify(err)}`)
                return HelperResponse.getServerError()
            }
        }

        return HelperResponse.getDBError()
    }
}
