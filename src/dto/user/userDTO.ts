export type UserRegistration = {
    login: string
    password: string
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