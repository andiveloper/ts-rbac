"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SampleApplication = void 0;
const rbac_1 = require("../../src/rbac");
const scope_1 = require("../../src/scope");
class SampleApplication {
    constructor(roleDefinitionsOrRBAC, imageDatabase) {
        this.imageDatabase = imageDatabase;
        if (roleDefinitionsOrRBAC instanceof rbac_1.RBAC) {
            this.rbac = roleDefinitionsOrRBAC;
        }
        else {
            this.rbac = new rbac_1.RBAC(roleDefinitionsOrRBAC);
        }
    }
    getImage(user, imageId) {
        const getImagePermission = this.rbac.can(user.roles).do('getImage');
        if (!getImagePermission.granted) {
            console.log(`User with roles ${user.roles} is not allowed to perform the 'getImage' action`);
            return undefined;
        }
        else {
            const image = this.imageDatabase[imageId];
            return this.verifyScopeForImage(user, getImagePermission, image);
        }
    }
    verifyScopeForImage(user, permission, image) {
        if (permission.scope(scope_1.DEFAULT_SCOPES.self.name).granted && image.ownedByUser === user.name) {
            return image;
        }
        if (permission.scope(scope_1.DEFAULT_SCOPES.group.name).granted && image.ownedByGroup in user.groups) {
            return image;
        }
        if (permission.scope(scope_1.DEFAULT_SCOPES.org.name).granted && image.ownedByOrg === user.org) {
            return image;
        }
        if (permission.scope(scope_1.DEFAULT_SCOPES.all.name).granted) {
            return image;
        }
        return undefined;
    }
}
exports.SampleApplication = SampleApplication;
//# sourceMappingURL=sample.js.map