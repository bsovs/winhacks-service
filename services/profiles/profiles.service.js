const DbMixin = require('../../mixins/db.mixin');
const models = require('./profiles.model');
const _ = require('lodash');
const E = require('../../errors');
const axios = require('axios').default;
require('dotenv').config();

/**
 * @module profiles
 * @type { import('moleculer').ServiceSchema }
 */
module.exports = {
    name: 'profiles',
    mixins: [DbMixin],
    models,

    settings: {
        embedUrl: process.env.ENCODER_URL,
    },

    events: {
        'profile.new': {
            params: {
                user: 'object',
                profile: 'object',
            },
            async handler(ctx) {
                const { user } = ctx.params;
                this.logger.info(`Profile for ${user.displayName} has been created!`);
            },
        },
    },

    actions: {
        new: {
            rest: {
                method: 'POST',
                path: '/new',
            },
            async handler(ctx) {
                const { uid } = ctx.meta.user;
                const profile = await this.profiles.findById(uid);
                if (!profile) {
                    const { uid, displayName, email } = ctx.meta.user;
                    this.logger.info(`Creating profile for ${displayName}`);
                    const profile = await this.profiles.create({ _id: uid, name: displayName, email });

                    ctx.emit('profile.new', { user: ctx.meta.user, profile });
                    return profile;
                } else {
                    throw new E.ValidationError('Profile already exists');
                }
            },
        },

        me: {
            rest: {
                method: 'GET',
                path: '/me',
            },
            async handler(ctx) {
                const { uid } = ctx.meta.user;
                const profile = await this.profiles.findById(uid);
                if (!profile) {
                    throw new E.NotFoundError();
                }
                return profile;
            },
        },

        find: {
            rest: {
                method: 'GET',
                path: '/:id',
            },
            params: {
                id: {
                    type: 'object',
                },
            },
            async handler(ctx) {
                const { id } = ctx.params;
                const profile = await this.profiles.findById(id);
                if (!profile) {
                    throw new E.NotFoundError();
                }
                return profile;
            },
        },

        swipe: {
            params: {
                homeId: 'string',
                like: 'bool',
            },
            async handler(ctx){
                const { homeId, like } = ctx.params;
                const { uid } = ctx.meta.user;
                let updated;
                if(like) {
                    updated = await this.profiles.findByIdAndUpdate(uid, { $addToSet: { likes: homeId } });
                } else {
                    updated = await this.profiles.findByIdAndUpdate(uid, { $addToSet: { dislikes: homeId } });
                }
                await ctx.call('homes.swipe', ctx.params);
                return updated;
            },
        },

        embed: {
            params: {
                id: {
                    type: 'string',
                },
            },
            async handler(ctx) {
                const { id } = ctx.params;
                const profile = await this.profiles.findById(id);
                if (!profile) {
                    throw new E.NotFoundError();
                }
                return await axios
                    .post(this.settings.embedUrl + '/run/profile/update', profile.likes)
                    .then((response) => {
                        if (!response.data) throw new E.NotFoundError('No response received!');
                        return this.profiles.findByIdAndUpdate(id, { profile: response.data.profile })
                            .then((update) => {
                                this.embeds.create({ uid: id, embed: response.data.embed });
                                return update;
                            }
                            );
                    })
                    .catch((error) => {
                        throw error;
                    });
            },
        },
    },

    methods: {},

    async started() {},
};
