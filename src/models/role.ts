export const ROLES: {[key: string]: RoleName} = {
    ADMIN: "admin",
    USER: "user"
}

export type RoleName = 'admin' | 'user'

export type RoleDB = {
    id: string
    name: RoleName
}