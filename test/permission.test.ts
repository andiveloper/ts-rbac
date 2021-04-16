import { RBAC } from '../src/rbac';
import { Permission } from '../src/permission';
import { DEFAULT_SCOPES } from '../src/scope';

describe('Permission', () => {
    it('grants permissions correctly', () => {
            // given
            const roleDefinition = {
                'role1': 'role2;action10:self',
                'role2': ';action20:org',
            };

            // when
            const rbac: RBAC = new RBAC(roleDefinition);
            const permission1ForRole1: Permission = rbac.can('role1').do('action10');
            const permission2ForRole1: Permission = rbac.can('role1').do('action20', DEFAULT_SCOPES.group);
            const permissionForRole2: Permission = rbac.can('role2').do('action20', DEFAULT_SCOPES.self);

            // then
            expect(permission1ForRole1.action).toEqual({ name: 'action10', scope: DEFAULT_SCOPES.self });
            expect(permission1ForRole1.granted).toEqual(true);
            expect(permission1ForRole1.scope(DEFAULT_SCOPES.self.name).granted).toBeTruthy();
            expect(permission1ForRole1.scope(DEFAULT_SCOPES.group.name).granted).toBeFalsy();
            expect(permission1ForRole1.scope(DEFAULT_SCOPES.org.name).granted).toBeFalsy();
            expect(permission1ForRole1.scope(DEFAULT_SCOPES.all.name).granted).toBeFalsy();

            expect(permission2ForRole1.action).toEqual({ name: 'action20', scope: DEFAULT_SCOPES.org });
            expect(permission2ForRole1.granted).toEqual(true);
            expect(permission2ForRole1.scope(DEFAULT_SCOPES.self.name).granted).toBeTruthy();
            expect(permission2ForRole1.scope(DEFAULT_SCOPES.group.name).granted).toBeTruthy();
            expect(permission2ForRole1.scope(DEFAULT_SCOPES.org.name).granted).toBeTruthy();
            expect(permission2ForRole1.scope(DEFAULT_SCOPES.all.name).granted).toBeFalsy();

            expect(permissionForRole2.action).toEqual({ name: 'action20', scope: DEFAULT_SCOPES.org });
            expect(permissionForRole2.granted).toEqual(true);
            expect(permissionForRole2.scope(DEFAULT_SCOPES.self.name).granted).toBeTruthy();
            expect(permissionForRole2.scope(DEFAULT_SCOPES.group.name).granted).toBeTruthy();
            expect(permissionForRole2.scope(DEFAULT_SCOPES.org.name).granted).toBeTruthy();
            expect(permissionForRole2.scope(DEFAULT_SCOPES.all.name).granted).toBeFalsy();
        }
    );

    it('denies permissions correctly', () => {
        // given
        const roleDefinition = {
            'role1': 'role2;action10:self',
            'role2': ';action20:org',
        };

        // when
        const rbac: RBAC = new RBAC(roleDefinition);
        // no permission at all
        const permission1ForRole1: Permission = rbac.can('role1').do('action30');
        // scope higher than allowed
        const permission2ForRole1: Permission = rbac.can('role1').do('action20', DEFAULT_SCOPES.all);

        // then

        expect(permission1ForRole1.action).toEqual({ name: 'action30', scope: DEFAULT_SCOPES.self });
        expect(permission1ForRole1.granted).toEqual(false);
        expect(permission1ForRole1.scope(DEFAULT_SCOPES.self.name).granted).toBeFalsy();
        expect(permission1ForRole1.scope(DEFAULT_SCOPES.group.name).granted).toBeFalsy();
        expect(permission1ForRole1.scope(DEFAULT_SCOPES.org.name).granted).toBeFalsy();
        expect(permission1ForRole1.scope(DEFAULT_SCOPES.all.name).granted).toBeFalsy();

        expect(permission2ForRole1.action).toEqual({ name: 'action20', scope: DEFAULT_SCOPES.all });
        expect(permission2ForRole1.granted).toEqual(false);
        expect(permission2ForRole1.scope(DEFAULT_SCOPES.self.name).granted).toBeTruthy();
        expect(permission2ForRole1.scope(DEFAULT_SCOPES.group.name).granted).toBeTruthy();
        expect(permission2ForRole1.scope(DEFAULT_SCOPES.org.name).granted).toBeTruthy();
        expect(permission2ForRole1.scope(DEFAULT_SCOPES.all.name).granted).toBeFalsy();
    });
});