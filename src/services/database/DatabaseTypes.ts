export interface IDatabase {
    initProviders: (params: any) => void
    connectToDatabases: () => void
}