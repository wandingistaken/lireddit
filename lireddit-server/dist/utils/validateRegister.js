"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegister = void 0;
const validateRegister = (options) => {
    if (options.username.length <= 2) {
        return [{ field: "username", message: "username is too short" }];
    }
    if (options.username.includes("@")) {
        return [{ field: "username", message: "cannot include an @" }];
    }
    if (!options.email.includes("@")) {
        return [{ field: "email", message: "invalid email" }];
    }
    if (options.password.length <= 2) {
        return [{ field: "password", message: "password is too short" }];
    }
    return null;
};
exports.validateRegister = validateRegister;
//# sourceMappingURL=validateRegister.js.map