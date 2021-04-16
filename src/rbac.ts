import { Action } from './action';
import { Role, RoleBuilder, RoleDefinitions, RoleDefinitionsHelper, RoleValidator } from './role';
import { PermissionChecker } from './permission';
import { DEFAULT_SCOPES, Scope } from './scope';


export class RBAC {
    private readonly roleMap: Map<string, Role> = new Map<string, Role>();
    private readonly scopeMap: Map<string, Scope> = new Map<string, Scope>();

    constructor(roles?: RoleDefinitions | Role[], scopes?: Scope[]) {
        if (scopes && scopes.length < 1) {
            throw new Error('At least one scope must be given. Omit the value to use a set of default scopes.');
        }
        if (!scopes) {
            for (const scopeName in DEFAULT_SCOPES) {
                this.scopeMap.set(DEFAULT_SCOPES[scopeName].name, DEFAULT_SCOPES[scopeName]);
            }
        } else {
            scopes.forEach(s => this.scopeMap.set(s.name, s));
        }

        if (roles && !Array.isArray(roles)) {
            for (const role of RoleDefinitionsHelper.roleDefinitionToRoles(this.scopeMap, roles)) {
                this.roleMap.set(role.name, role);
            }
        } else if (roles) {
            RoleValidator.validate(roles);
            roles.forEach(role => this.roleMap.set(role.name, role));
        }
    }

    role(role: string): RoleBuilder {
        if (this.roleMap.has(role)) {
            throw new Error(`Role ${role} already exists`);
        }
        const roleBuilder = new RoleBuilder(role);
        this.roleMap.set(role, roleBuilder.role);
        return roleBuilder;
    }

    can(roles: string | string[]): PermissionChecker {
        const rolesAsArray: string[] = Array.isArray(roles) ? roles : [roles];
        return new PermissionChecker(this.scopeMap, this.getAllowedActions(rolesAsArray));
    }

    private resolveRole(roleName: string): Role {
        const role: Role | undefined = this.roleMap.get(roleName);
        if (!role) {
            throw new Error(`Role '${roleName}' was not found.`);
        }
        return role;
    }

    private resolveInheritedRoles(role: Role): Role[] {
        const roles: Map<string, Role> = new Map<string, Role>();
        for (const inheritedRoleName of role.inherits) {
            const inheritedRole: Role = this.resolveRole(inheritedRoleName);
            roles.set(inheritedRole.name, inheritedRole);
            for (const resolvedInheritedRole of this.resolveInheritedRoles(inheritedRole)) {
                roles.set(resolvedInheritedRole.name, resolvedInheritedRole);
            }
        }
        return Array.from(roles.values());
    }

    getAllowedActions(roleNames: string[]): Action[] {
        const allowedActions: Map<string, Action> = new Map<string, Action>();
        for (const roleName of roleNames) {
            const role: Role = this.resolveRole(roleName);

            const inheritedRoles: Role[] = this.resolveInheritedRoles(role);
            const inheritedActions: Action[] = inheritedRoles.map(r => r.actions).reduce((previousValue, currentValue) => previousValue.concat(currentValue), []);
            const allActions: Action[] = role.actions.concat(inheritedActions);

            for (const newAction of allActions) {
                if (!allowedActions.has(newAction.name)) {
                    allowedActions.set(newAction.name, newAction);
                } else {
                    const existingAction = allowedActions.get(newAction.name);
                    if (existingAction && existingAction.scope.weight < newAction.scope.weight) {
                        allowedActions.set(newAction.name, newAction);
                    }
                }
            }
        }
        return Array.from(allowedActions.values());
    }
}
