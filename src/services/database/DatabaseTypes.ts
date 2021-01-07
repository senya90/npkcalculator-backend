export interface IDatabase {
    connectToDatabases: () => Promise<any>
    isReady: () => boolean
}