export type UserCredentials = {
    login: string
    password: string
}

export type UserDTO = {
    id: string
    login: string
    roleID: string
    nick?: null | string
}

export type UserDB = {
    id: string
    login: string
    password: string
    created: number
    roleID: string
    salt: string
    nick?: null | string
}