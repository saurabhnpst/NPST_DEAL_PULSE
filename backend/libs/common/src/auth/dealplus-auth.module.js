"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DealplusAuthModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealplusAuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const src_1 = require("../../../command-module-auth/src");
const command_module_config_1 = require("../config/command-module.config");
class PassthroughAuthGuard {
    canActivate() {
        return true;
    }
}
let DealplusAuthModule = DealplusAuthModule_1 = class DealplusAuthModule {
    static register() {
        return {
            module: DealplusAuthModule_1,
            imports: [
                config_1.ConfigModule.forFeature(command_module_config_1.default),
                src_1.CommandModuleAuthModule.forRootAsync({
                    imports: [config_1.ConfigModule],
                    inject: [config_1.ConfigService],
                    useFactory: (config) => {
                        const cm = config.get('commandModule');
                        return {
                            redisUrl: cm?.redisUrl || 'redis://127.0.0.1:6379',
                            sessionCookieName: cm?.sessionCookieName || 'session_id',
                        };
                    },
                }),
            ],
            providers: [
                {
                    provide: core_1.APP_GUARD,
                    useFactory: (config, guard) => {
                        const cm = config.get('commandModule');
                        if (!cm?.enabled) {
                            return new PassthroughAuthGuard();
                        }
                        return guard;
                    },
                    inject: [config_1.ConfigService, src_1.SessionAuthGuard],
                },
            ],
        };
    }
};
exports.DealplusAuthModule = DealplusAuthModule;
exports.DealplusAuthModule = DealplusAuthModule = DealplusAuthModule_1 = __decorate([
    (0, common_1.Module)({})
], DealplusAuthModule);
//# sourceMappingURL=dealplus-auth.module.js.map