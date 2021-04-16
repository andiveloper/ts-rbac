import { Action } from './action';
import { NO_SCOPE, Scope } from './scope';

export class Permission {
    constructor(readonly action: Action, readonly granted: boolean, private readonly scopes: Map<string, boolean>) {
    }

    scope(scope: string): { granted: boolean } {
        if (!this.scopes.has(scope)) {
            throw new Error(`Unknown scope ${scope}`);
        }
        const granted = this.scopes.get(scope);
        return { granted: granted || false};
    }
}

export class PermissionChecker {
    private readonly allowedActions: Map<string, Action> = new Map<string, Action>();
    private readonly lowestScope: Scope | undefined;

    constructor(private readonly scopes: Map<string, Scope>, effectivePermissions: Action[]) {
        effectivePermissions.forEach(p => this.allowedActions.set(p.name, p));
        for (const scope of scopes.values()) {
            if (!this.lowestScope || this.lowestScope.weight > scope.weight) {
                this.lowestScope = scope;
            }
        }
    }

    do(action: string, requestedScope?: Scope): Permission {
        const requestedAction: Action = {
            name: action,
            scope: requestedScope || this.lowestScope || NO_SCOPE
        };
        const allowedAction: Action | undefined = this.allowedActions.get(action);

        const evaluatedScopes: Map<string, boolean> = new Map<string, boolean>();
        this.scopes.forEach(value => evaluatedScopes.set(value.name, false));

        const denied = new Permission(
            requestedAction,
            false,
            evaluatedScopes
        );

        if (!allowedAction) {
            return denied;
        }

        for (const scope of this.scopes.values()) {
            if (scope.weight <= allowedAction.scope.weight) {
                evaluatedScopes.set(scope.name, true);
            } else {
                evaluatedScopes.set(scope.name, false);
            }
        }

        const granted = new Permission(
            requestedAction,
            true,
            evaluatedScopes
        );

        if (!requestedScope) {
            // set granted scope to actual scope
            granted.action.scope = allowedAction.scope;
            return granted;
        } else {
            if (allowedAction.scope.weight >= requestedScope.weight) {
                // grant access and set granted scope to effective scope
                granted.action.scope = allowedAction.scope;
                return granted;
            } else {
                // requested scope is higher than effective scope, deny access
                return denied;
            }
        }
    }
}