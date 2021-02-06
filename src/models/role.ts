export const ROLES: {[key: string]: TRole} = {
    ADMIN: "admin",
    USER: "user"
}

export type TRole = 'admin' | 'user'

export type RoleDB = {
    id: string
    name: TRole
}