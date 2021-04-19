import { Role, RoleDefinitionsHelper } from '../src/role';
import { DEFAULT_SCOPES, Scope } from '../src/scope';
import { RoleBuilder } from '../lib';

const DEFAULT_SCOPE_MAP: Map<string, Scope> = new Map<string, Scope>();
for (const scopeName in DEFAULT_SCOPES) {
    DEFAULT_SCOPE_MAP.set(DEFAULT_SCOPES[scopeName].name, DEFAULT_SCOPES[scopeName]);
}
describe('RoleBuilder', () => {
    it('builds the role correctly when grant(...) is used', () => {
        // given
        const role1 = new RoleBuilder('role1');

        // when
        role1.grant('action10', DEFAULT_SCOPES.all);

        // then
        expect(role1.role.actions[0].name).toEqual('action10');
        expect(role1.role.actions[0].scope).toEqual(DEFAULT_SCOPES.all);
    });

    it('builds the role correctly when grantMultiple(...) is used', () => {
        // given
        const role1 = new RoleBuilder('role1');

        // when
        role1
            .grantMultiple(['action10', 'action20'], DEFAULT_SCOPES.all)
            .grant('action30', DEFAULT_SCOPES.org);

        // then
        expect(role1.role.actions[0].name).toEqual('action10');
        expect(role1.role.actions[0].scope).toEqual(DEFAULT_SCOPES.all);

        expect(role1.role.actions[1].name).toEqual('action20');
        expect(role1.role.actions[1].scope).toEqual(DEFAULT_SCOPES.all);

        expect(role1.role.actions[2].name).toEqual('action30');
        expect(role1.role.actions[2].scope).toEqual(DEFAULT_SCOPES.org);

    });

});
describe('RoleDefinitionsHelper', () => {
    it('parses roleDefinitions to expected Role[]', () => {
        // given
        const roleDefinition = {
            'role1': 'role2;action10:self,action11:self',
            'role2': ';action20:org,action21:all',
        };

        const expectedRoles: Role[] = [
            {
                name: 'role1',
                inherits: ['role2'],
                actions: [
                    { name: 'action10', scope: DEFAULT_SCOPES.self },
                    { name: 'action11', scope: DEFAULT_SCOPES.self },
                ]
            },
            {
                name: 'role2',
                inherits: [],
                actions: [
                    { name: 'action20', scope: DEFAULT_SCOPES.org },
                    { name: 'action21', scope: DEFAULT_SCOPES.all },
                ]
            },
        ];

        // when
        const roles = RoleDefinitionsHelper.roleDefinitionToRoles(DEFAULT_SCOPE_MAP, roleDefinition);

        // then
        expect(roles).toEqual(expectedRoles);
    });

    it('ignores empty roles and permissions', () => {
        // given
        const roleDefinition = {
            'role1': 'role2,;',
            'role2': ';',
            'role3': ';permission1:all',
        };

        const expectedRoles: Role[] = [
            {
                name: 'role1',
                inherits: ['role2'],
                actions: []
            },
            {
                name: 'role2',
                inherits: [],
                actions: []
            },
            {
                name: 'role3',
                inherits: [],
                actions: [{ name: 'permission1', scope: DEFAULT_SCOPES.all }]
            }
        ];

        // when
        const roles = RoleDefinitionsHelper.roleDefinitionToRoles(DEFAULT_SCOPE_MAP, roleDefinition);

        // then
        expect(roles).toEqual(expectedRoles);
    });
    it('throws if inherited role does not exists', () => {
        // given
        const roleDefinition = {
            'role1': 'role2,;',
        };

        const t = () => {
            RoleDefinitionsHelper.roleDefinitionToRoles(DEFAULT_SCOPE_MAP, roleDefinition);
        };

        // when
        // then
        expect(t).toThrow();
    });
    it('throws if no \';\' in definition', () => {
        // given
        const roleDefinition = {
            'role1': 'role2',
        };

        // when
        const t = () => {
            RoleDefinitionsHelper.roleDefinitionToRoles(DEFAULT_SCOPE_MAP, roleDefinition);
        };

        // then
        expect(t).toThrow();
    });

    it('throws if no \':\' in permission', () => {
        // given
        const roleDefinition = {
            'role1': ';permission1',
        };

        // when
        const t = () => {
            RoleDefinitionsHelper.roleDefinitionToRoles(DEFAULT_SCOPE_MAP, roleDefinition);
        };

        // then
        expect(t).toThrow();
    });

    it('throws if no valid scope in permission', () => {
        // given
        const roleDefinition = {
            'role1': ';permission1:invalidScope',
        };

        // when
        const t = () => {
            RoleDefinitionsHelper.roleDefinitionToRoles(DEFAULT_SCOPE_MAP, roleDefinition);
        };

        // then
        expect(t).toThrow();
    });

    it('throws if there are duplicate permissions', () => {
        // given
        const roleDefinition = {
            'role1': ';permission1:all,permission1:self',
        };

        // when
        const t = () => {
            RoleDefinitionsHelper.roleDefinitionToRoles(DEFAULT_SCOPE_MAP, roleDefinition);
        };

        // then
        expect(t).toThrow();
    });
});

