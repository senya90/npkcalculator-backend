import { Module } from "@nestjs/common";
import { Logger } from "./service/logger";

@Module({
    providers: [Logger],
    exports: [Logger]
})
export class LoggerModule {
}
