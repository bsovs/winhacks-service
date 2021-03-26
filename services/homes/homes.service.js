const DbMixin = require('../../mixins/db.mixin')
const BigQueryMixin = require('../../mixins/bigquery.mixin')
const models = require('./homes.model')
const _ = require('lodash')
const E = require('../../errors')

/**
 * @module homes
 * @type { import('moleculer').ServiceSchema }
 */
module.exports = {
    name: 'homes',

    mixins: [DbMixin, BigQueryMixin],

    models,

    settings: {
        homes: {
            limit: 100,
        },
    },

    actions: {
        save: {
            params: {
                title: 'string',
            },
            async handler (ctx) {
                const { title } = ctx.params
                this.logger.info('Save called')
                return await this.homes.create({ title })
            },
        },

        fetch: {
            params: {
                lat: 'number',
                lon: 'number'
            },
            async handler (ctx) {
                const { lat, lon } = ctx.params;
                const profile = await ctx.call('profiles.me')
                const filter = _.concat(profile.likes, profile.dislikes)
                return await ctx.call('homes.within', { radius: profile.radius, coords: [lon, lat], filter });
            },
        },

        find: {
            rest: {
                method: 'GET',
                path: '/:id',
            },
            params: {
                id: {
                    type: 'string',
                },
            },
            async handler (ctx) {
                const { id } = ctx.params
                const query = `
                    SELECT * FROM 
                        \`winhacks-308216.homes_data.sample\` 
                    WHERE id IN (@id) 
                    LIMIT @limit
                `
                const params = { id, limit: this.settings.homes.limit }
                const home = await this.bigQuery(query, params)
                if (!home || !home.length) {
                    throw new E.NotFoundError()
                }
                return home[0]
            },
        },

        list: {
            rest: {
                method: 'GET',
                path: '/homes',
            },
            params: {
                ids: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                },
            },
            async handler (ctx) {
                const { ids } = ctx.params
                const query = `
                    SELECT * FROM 
                        \`winhacks-308216.homes_data.sample\` 
                    WHERE id IN UNNEST(@ids)
                    LIMIT @limit
                `
                const params = { ids, limit: this.settings.homes.limit }
                const homes = await this.bigQuery(query, params)
                if (!homes.length) {
                    throw new E.NotFoundError()
                }
                return homes
            },
        },

        within: {
            params: {
                radius: 'number',
                coords: 'array',
                filter: {
                    type: 'array',
                    required: false,
                    default: [],
                },
            },
            async handler (ctx) {
                const { radius, coords, filter } = ctx.params
                const query = `
                    WITH params AS (
                      SELECT ST_GeogPoint(@longitude, @latitude) AS center,
                             @limit AS maxn_homes,
                             @radius AS maxdist_km
                    ),
                    distance_from_center AS (
                      SELECT
                        id,
                        created_on,
                        operation,
                        property_type,
                        place_name,
                        place_with_parent_names,
                        country_name,
                        state_name,
                        geonames_id,
                        lat_lon,
                        lat,
                        lon,
                        price,
                        currency,
                        price_aprox_local_currency,
                        price_aprox_usd,
                        surface_total_in_m2,
                        surface_covered_in_m2,
                        price_usd_per_m2,
                        price_per_m2,
                        floor,
                        rooms,
                        expenses,
                        properati_url,
                        description,
                        title,
                        images
                        ST_GeogPoint(lon, lat) AS loc,
                        ST_Distance(ST_GeogPoint(lon, lat), params.center) AS dist_meters
                      FROM
                        \`winhacks-308216.homes_data.sample\`,
                        params
                      WHERE ST_DWithin(ST_GeogPoint(lon, lat), params.center, params.maxdist_km*1000)
                    ),
                    nearest_homes AS (
                      SELECT 
                        *, 
                        RANK() OVER (ORDER BY dist_meters ASC) AS rank
                      FROM 
                        distance_from_center
                    ),
                    filtered_homes AS (
                      SELECT 
                        *
                      FROM 
                        nearest_homes
                      WHERE 
                        id NOT IN UNNEST(@filter)
                    ),
                    nearest_nhomes AS (
                      SELECT 
                        station.* 
                      FROM 
                        nearest_homes AS station, params
                      WHERE 
                        rank <= params.maxn_homes
                    )
                    SELECT * from nearest_nhomes
                `
                const params = { radius, longitude: coords[0], latitude: coords[1], limit: this.settings.homes.limit, filter }
                return await this.bigQuery(query, params)
            },
        },

        swipe: {
            params: {
                homeId: 'string',
                like: 'bool',
            },
            async handler (ctx) {
                const { homeId, like } = ctx.params
                const { uid } = ctx.meta.user
                const rating = this.getRating(like)
                const query = `
                    INSERT INTO \`winhacks-308216.profiles_data.sample\` (profile_id, home_id, rating) 
                    VALUES (@profile_id, @home_id, @rating)
               `
                const params = { profile_id: uid, home_id: homeId, rating }
                return await this.bigQuery(query, params)
            },
        },

    /*
   import: {
       params: {
           file: 'string',
           source: 'string',
       },
       async handler(ctx) {
           // TODO: Map the import file from a stream or storage and transform it based on its origin
       },
   },
   */
    },

    methods: {
        getRating (like) {
            return like ? 1.0 : 0.0
        },
    },

    events: {},

    async started () {},
}
