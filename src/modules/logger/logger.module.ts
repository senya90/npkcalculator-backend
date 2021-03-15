import { Module } from "@nestjs/common";
import { Logger } from "./service/logger";
import { FileService } from "@services/file/file.service";
import { ConfigService } from "@nestjs/config";

@Module({
    providers: [Logger, FileService, ConfigService],
    exports: [Logger]
})
export class LoggerModule {
}
