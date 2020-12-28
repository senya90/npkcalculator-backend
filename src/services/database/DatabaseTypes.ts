export interface IDatabase {
    initProviders: () => void
    connectToDatabases: () => Promise<any>
}