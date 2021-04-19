import { Image, SampleApplication, User } from './sample';
import { RoleDefinitions } from '../../src/role';
import { RBAC } from '../../src/rbac';
import { DEFAULT_SCOPES } from '../../src/scope';

// an object which simulates a database with two images
const images: { [key: string]: Image } = {
    alicesImage: {
        id: 'alicesImage',
        ownedByUser: 'alice',
        ownedByGroup: 'sampleGroup',
        ownedByOrg: 'example.com',
        content: Buffer.from('image data')
    },
    bobsImage: {
        id: 'bobsImage',
        ownedByUser: 'bob',
        ownedByGroup: 'sampleGroup',
        ownedByOrg: 'example.com',
        content: Buffer.from('image data')
    }
};

// create two users: alice and admin
const alice: User = {
    id: '1',
    name: 'alice',
    groups: ['sampleGroup'],
    org: 'example.com',
    roles: ['user'],
};

const admin: User = {
    id: '2',
    name: 'admin',
    groups: ['sampleGroup'],
    org: 'example.com',
    roles: ['admin'],
};

describe('Sample', () => {
    it('works as expected using role definitions', () => {
        // given

        // define two roles: user and admin
        // - users with role 'user' can get their own image
        // - users with role 'admin' can get all images
        const roleDefinitions: RoleDefinitions = {
            'user': ';getImage:self',
            'admin': 'user;getImage:all',
        };

        // create our application using the roles defined above and the image database
        const application = new SampleApplication(roleDefinitions, images);


        // when
        const aliceGetsHerImage: Image | undefined = application.getImage(alice, 'alicesImage'); // image should be defined
        const aliceGetsBobsImage: Image | undefined = application.getImage(alice, 'bobsImage'); // image should be undefined
        const adminGetsBobsImage: Image | undefined = application.getImage(admin, 'bobsImage'); // image should be defined

        // then
        expect(aliceGetsHerImage).toEqual(images['alicesImage']);
        expect(aliceGetsBobsImage).toBeUndefined();
        expect(adminGetsBobsImage).toEqual(images['bobsImage']);
    });

    it('works as expected using fluent API', () => {
        // given

        // define two roles: user and admin
        // - users with role 'user' can get their own image
        // - users with role 'admin' can get all images
        const roles = {
            user: 'user',
            admin: 'admin',
        };

        const actions = {
            getImage: 'getImage',
        };

        const rbac: RBAC = new RBAC();
        rbac.role(roles.user)
            .grant(actions.getImage, DEFAULT_SCOPES.self);

        rbac.role(roles.admin)
            .inherit(roles.user)
            .grant(actions.getImage, DEFAULT_SCOPES.all);

        // create our application using the roles defined above and the image database
        const application = new SampleApplication(rbac, images);

        // when
        const aliceGetsHerImage: Image | undefined = application.getImage(alice, 'alicesImage'); // image should be defined
        const aliceGetsBobsImage: Image | undefined = application.getImage(alice, 'bobsImage'); // image should be undefined
        const adminGetsBobsImage: Image | undefined = application.getImage(admin, 'bobsImage'); // image should be defined

        // then
        expect(aliceGetsHerImage).toEqual(images['alicesImage']);
        expect(aliceGetsBobsImage).toBeUndefined();
        expect(adminGetsBobsImage).toEqual(images['bobsImage']);
    });
});