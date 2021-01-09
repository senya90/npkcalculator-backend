import { Module } from "@nestjs/common";
import { Logger } from "./service/logger";
import { FileService } from "@services/file/file.service";

@Module({
    providers: [Logger, FileService],
    exports: [Logger]
})
export class LoggerModule {
}
