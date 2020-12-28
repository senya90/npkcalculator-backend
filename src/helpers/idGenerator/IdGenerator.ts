import {v4} from "uuid";

export class IdGenerator {
    static generate() {
        return v4()
    }
}