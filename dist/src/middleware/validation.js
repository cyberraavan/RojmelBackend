"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const validateBody = (schema) => (req, _res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.validateBody = validateBody;
