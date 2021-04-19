// Arbitrary object which is stored in your database
import { RBAC } from '../../src/rbac';
import { Permission } from '../../src/permission';
import { DEFAULT_SCOPES } from '../../src/scope';
import { RoleDefinitions } from '../../src/role';

export type User = {
    id: string; // the id of the user
    name: string; // the name of the user
    groups: string[];
    org: string;
    roles: string[];
};

export type Image = {
    id: string; // the id of the image
    ownedByUser: string; // the name/id of the user who owns this object
    ownedByGroup: string; // the name/id of the group who owns this object
    ownedByOrg: string; // the name/id of the org who owns this object
    content: Buffer; // the actual bytes of the image
};

export class SampleApplication {
    private readonly rbac: RBAC;
    private readonly imageDatabase: { [key: string]: Image };

    constructor(roleDefinitionsOrRBAC: RoleDefinitions | RBAC, imageDatabase: { [key: string]: Image }) {
        this.imageDatabase = imageDatabase;
        // create a RBAC instance using the given roleDefinitions or RBAC instance
        if (roleDefinitionsOrRBAC instanceof RBAC) {
            this.rbac = roleDefinitionsOrRBAC;
        } else {
            this.rbac = new RBAC(roleDefinitionsOrRBAC);
        }
    }

    getImage(user: User, imageId: string): Image | undefined {
        // the user must be authenticated and verified somewhere else, e.g. by using a session cookie or a JWT token
        // retrieve the getImage Privilege for the users roles
        const getImagePermission: Permission = this.rbac.can(user.roles).do('getImage');
        if (!getImagePermission.granted) {
            console.log(`User with roles ${user.roles} is not allowed to perform the 'getImage' action`);
            return undefined;
        } else {
            // retrieve the image from the database
            const image: Image = this.imageDatabase[imageId];
            // check if the user has a permission with the necessary scope to access the image
            return this.verifyScopeForImage(user, getImagePermission, image);
        }
    }

    verifyScopeForImage(user: User, permission: Permission, image: Image): Image | undefined {
        // verify the scope of the permission and either return the image or undefined
        if (permission.scope(DEFAULT_SCOPES.self.name).granted && image.ownedByUser === user.name) {
            return image;
        }

        if (permission.scope(DEFAULT_SCOPES.group.name).granted && image.ownedByGroup in user.groups) {
            return image;
        }

        if (permission.scope(DEFAULT_SCOPES.org.name).granted && image.ownedByOrg === user.org) {
            return image;
        }

        if (permission.scope(DEFAULT_SCOPES.all.name).granted) {
            return image;
        }

        // access not granted
        return undefined;
    }
}
