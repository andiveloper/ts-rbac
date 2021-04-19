import { Action } from './action';
import { Scope } from './scope';

export type RoleName = string;


export type Role = {
    name: string;
    inherits: RoleName[];
    actions: Action[];
};

export class RoleBuilder {
    role: Role;

    constructor(name: string, inherits?: RoleName[], actions?: Action[]) {
        this.role = {
            name,
            inherits: inherits ? inherits : [],
            actions: actions ? actions : [],
        };
    }

    grant(actionName: string, scope: Scope): RoleBuilder {
        if (this.role.actions.filter(p => p.name === actionName).length > 0) {
            throw new Error(`Action with name '${actionName} already exists on role ${this.role.name}`);
        }
        this.role.actions.push({ name: actionName, scope: scope });
        return this;
    }

    grantMultiple(actionNames: string[], scope: Scope): RoleBuilder {
        for (const actionName of actionNames) {
            this.grant(actionName, scope);
        }
        return this;
    }

    inherit(role: string): RoleBuilder {
        if (this.role.inherits.filter(r => r === role).length > 0) {
            throw new Error(`Role with name '${role} is already inherited by role ${this.role.name}`);
        }
        this.role.inherits.push(role);
        return this;
    }
}

export type RoleDefinitions = {
    [key: string]: string;
};

export class RoleDefinitionsHelper {
    static roleDefinitionToRoles(scopes: Map<string, Scope>, roleDefinitions: RoleDefinitions): Role[] {
        const roles: Map<string, Role> = new Map<string, Role>();

        for (const roleName in roleDefinitions) {
            const role: Role = {
                name: roleName,
                inherits: [],
                actions: []
            };

            const roleDefinition: string = roleDefinitions[roleName];
            const rolesAndActions: string[] = roleDefinition.split(';');
            if (rolesAndActions.length !== 2) {
                throw new Error(`Invalid role definition, there must be exactly one ';' between roles and actions: ${roleDefinition}`);
            }
            const inheritedRoleNames: string[] = rolesAndActions[0].split(',');
            role.inherits.push(...inheritedRoleNames.filter(s => s.trim() !== ''));

            const actions: string[] = rolesAndActions[1].split(',');
            for (const action of actions.filter(s => s.trim() !== '')) {
                const actionWithScope: string[] = action.split(':');
                if (actionWithScope.length !== 2) {
                    throw new Error('Invalid action definition, there must be exactly one \':\' between name and scope');
                }
                const actionName: string = actionWithScope[0];
                const actionScope: string = actionWithScope[1];
                if (scopes.has(actionScope)) {
                    role.actions.push({
                        name: actionName,
                        scope: scopes.get(actionScope) || { name: 'can_not_happen', weight: -1 }
                    });
                } else {
                    throw new Error(`Unknown scope ${actionScope}.`);
                }
            }
            roles.set(role.name, role);
        }

        const result: Role[] = Array.from(roles.values());
        RoleValidator.validate(result);
        return result;
    }
}

export class RoleValidator {
    static validate(roles: Role[]): void {
        const validatedRoles: Map<string, Role> = new Map<string, Role>();
        for (const role of roles) {
            // add roles to validatedRoles to make sure there are no duplicates
            if (validatedRoles.get(role.name)) {
                throw new Error(`Role '${role.name}' already exists!`);
            }
            validatedRoles.set(role.name, role);
        }
        for (const role of roles) {
            // iterate again to:
            // 1. check inherited roles for existence
            // 2. check actions for duplicates within a role
            for (const inheritedRole of role.inherits) {
                if (!validatedRoles.has(inheritedRole)) {
                    throw new Error(`Role '${role.name}' inherits from '${inheritedRole}', but this role does not exist!`);
                }
            }
            const actionSet: Set<string> = new Set<string>();
            for (const action of role.actions) {
                if (actionSet.has(action.name)) {
                    throw new Error(`Role '${role.name}' has a duplicate action: '${action.name}'`);
                }
                actionSet.add(action.name);
            }
        }
    }
}