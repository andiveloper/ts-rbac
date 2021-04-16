import { RBAC } from '../src/rbac';
import { Action } from '../src/action';
import { DEFAULT_SCOPES } from '../src/scope';

describe('RBAC', () => {
    it('throws if scopes are empty', () => {
        // given
        const roleDefinition = {
            'role1': 'role2;action10:self',
            'role2': ';action20:org',
        };

        // when

        //then
        expect(() => new RBAC(roleDefinition, [])).toThrow();
    });
    it('resolves allowed actions correctly', () => {
        // given
        const roleDefinition = {
            'role1': 'role2;action10:self,action11:self',
            'role2': ';action20:org',
        };

        const expectedPermissionsForRole1: Action[] = [
            { name: 'action10', scope: DEFAULT_SCOPES.self },
            { name: 'action11', scope: DEFAULT_SCOPES.self },
            { name: 'action20', scope: DEFAULT_SCOPES.org },
        ];

        const expectedPermissionsForRole2: Action[] = [
            { name: 'action20', scope: DEFAULT_SCOPES.org },
        ];

        // when

        const rbac: RBAC = new RBAC(roleDefinition);
        const allowedActionsForRole1: Action[] = rbac.getAllowedActions(['role1']);
        const allowedActionsForRole2: Action[] = rbac.getAllowedActions(['role2']);

        // then
        expect(allowedActionsForRole1).toEqual(expectedPermissionsForRole1);
        expect(allowedActionsForRole2).toEqual(expectedPermissionsForRole2);

    });

    it('respects the hierarchy of scopes', () => {
        // given
        const roleDefinitions = {
            'all': 'org;action10:all',
            'org': 'group;action10:org',
            'group': 'self;action10:group',
            'self': ';action10:self',
            'allSelfAndGroup': 'all,self;action10:group',
        };

        // when
        const rbac: RBAC = new RBAC(roleDefinitions);
        const allowedActionsForSelf: Action[] = rbac.getAllowedActions(['self']);
        const allowedActionsForGroup: Action[] = rbac.getAllowedActions(['group']);
        const allowedActionsForOrg: Action[] = rbac.getAllowedActions(['org']);
        const allowedActionsForAll: Action[] = rbac.getAllowedActions(['all']);
        const allowedActionsForAllSelfAndGroup: Action[] = rbac.getAllowedActions(['allSelfAndGroup']);

        // then
        expect(allowedActionsForSelf).toEqual([{ name: 'action10', scope: DEFAULT_SCOPES.self }]);
        expect(allowedActionsForGroup).toEqual([{ name: 'action10', scope: DEFAULT_SCOPES.group }]);
        expect(allowedActionsForOrg).toEqual([{ name: 'action10', scope: DEFAULT_SCOPES.org }]);
        expect(allowedActionsForAll).toEqual([{ name: 'action10', scope: DEFAULT_SCOPES.all }]);
        expect(allowedActionsForAllSelfAndGroup).toEqual([{ name: 'action10', scope: DEFAULT_SCOPES.all }]);

    });
});


describe('RBAC fluent API', () => {
    it('throws if duplicate role is added ', () => {
        // given
        const rbac: RBAC = new RBAC();
        rbac.role('role1');

        // when
        const t = () => rbac.role('role1');

        //then
        expect(t).toThrow();
    });
    it('throws if duplicate action is added ', () => {
        // given
        const rbac: RBAC = new RBAC();

        // when
        const t = () => {
            rbac.role('role1')
                .grant('action1', DEFAULT_SCOPES.self)
                .grant('action1', DEFAULT_SCOPES.self);
        };

        //then
        expect(t).toThrow();
    });
    it('resolves allowed actions correctly', () => {
        // given
        const rbac: RBAC = new RBAC();
        rbac.role('role2')
            .grant('action20', DEFAULT_SCOPES.org);

        rbac.role('role1')
            .inherit('role2')
            .grant('action10', DEFAULT_SCOPES.self)
            .grant('action11', DEFAULT_SCOPES.self);

        const expectedPermissionsForRole1: Action[] = [
            { name: 'action10', scope: DEFAULT_SCOPES.self },
            { name: 'action11', scope: DEFAULT_SCOPES.self },
            { name: 'action20', scope: DEFAULT_SCOPES.org },
        ];

        const expectedPermissionsForRole2: Action[] = [
            { name: 'action20', scope: DEFAULT_SCOPES.org },
        ];

        // when
        const allowedActionsForRole1: Action[] = rbac.getAllowedActions(['role1']);
        const allowedActionsForRole2: Action[] = rbac.getAllowedActions(['role2']);

        // then
        expect(allowedActionsForRole1).toEqual(expectedPermissionsForRole1);
        expect(allowedActionsForRole2).toEqual(expectedPermissionsForRole2);

    });

    it('respects the hierarchy of scopes', () => {
        // given
        const rbac: RBAC = new RBAC();
        rbac.role('self')
            .grant('action10', DEFAULT_SCOPES.self);

        rbac.role('group')
            .inherit('self')
            .grant('action10', DEFAULT_SCOPES.group);

        rbac.role('org')
            .inherit('group')
            .grant('action10', DEFAULT_SCOPES.org);

        rbac.role('all')
            .inherit('org')
            .grant('action10', DEFAULT_SCOPES.all);

        rbac.role('allSelfAndGroup')
            .inherit('all')
            .inherit('self')
            .grant('action10', DEFAULT_SCOPES.group);

        // when
        const allowedActionsForSelf: Action[] = rbac.getAllowedActions(['self']);
        const allowedActionsForGroup: Action[] = rbac.getAllowedActions(['group']);
        const allowedActionsForOrg: Action[] = rbac.getAllowedActions(['org']);
        const allowedActionsForAll: Action[] = rbac.getAllowedActions(['all']);
        const allowedActionsForAllSelfAndGroup: Action[] = rbac.getAllowedActions(['allSelfAndGroup']);

        // then
        expect(allowedActionsForSelf).toEqual([{ name: 'action10', scope: DEFAULT_SCOPES.self }]);
        expect(allowedActionsForGroup).toEqual([{ name: 'action10', scope: DEFAULT_SCOPES.group }]);
        expect(allowedActionsForOrg).toEqual([{ name: 'action10', scope: DEFAULT_SCOPES.org }]);
        expect(allowedActionsForAll).toEqual([{ name: 'action10', scope: DEFAULT_SCOPES.all }]);
        expect(allowedActionsForAllSelfAndGroup).toEqual([{ name: 'action10', scope: DEFAULT_SCOPES.all }]);

    });
});
