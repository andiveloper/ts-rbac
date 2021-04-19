/// <reference types="node" />
import { RBAC } from '../../src/rbac';
import { Permission } from '../../src/permission';
import { RoleDefinitions } from '../../src/role';
export declare type User = {
    id: string;
    name: string;
    groups: string[];
    org: string;
    roles: string[];
};
export declare type Image = {
    id: string;
    ownedByUser: string;
    ownedByGroup: string;
    ownedByOrg: string;
    content: Buffer;
};
export declare class SampleApplication {
    private readonly rbac;
    private readonly imageDatabase;
    constructor(roleDefinitionsOrRBAC: RoleDefinitions | RBAC, imageDatabase: {
        [key: string]: Image;
    });
    getImage(user: User, imageId: string): Image | undefined;
    verifyScopeForImage(user: User, permission: Permission, image: Image): Image | undefined;
}
