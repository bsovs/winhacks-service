'use strict';

const config = require('../../moleculer.test.config');
const { ServiceBroker } = require('moleculer');
const profilesSchema = require('../../../services/profiles/profiles.service');

const broker = new ServiceBroker(config);
const profilesService = broker.createService(profilesSchema);

describe("Test 'profiles' service", () => {
    jest.setTimeout(10000);

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());

    afterEach(async () => {
        await jest.clearAllMocks();
        //await profilesService.profiles.destroy({ truncate: true });
    });

    const record = {
        name: 'Brando Test S',
        email: 'barn@test.com',
    };

    it('should add the new item', async () => {
        const res = await broker.call('profiles.save', record);
        expect(res).toMatchObject({
            _id: expect.anything(),
            __v: expect.any(Number),
            created: expect.any(Date),
            name: 'Brando Test S',
            email: 'barn@test.com',
            age: 0,
        });

        // const found = await broker.call('profiles.find', { id: res._id });
        //expect(found).toBeDefined();
    });
});
