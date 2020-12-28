import { Injectable } from '@nestjs/common';
import { IDatabase } from "./DatabaseTypes";

@Injectable()
export class DatabaseService implements IDatabase {
    constructor() {
    }

    initProviders(params: any): void {

    }

    connectToDatabases(): void {
    }


}
