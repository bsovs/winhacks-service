const DbMixin = require('../../mixins/db/db.mixin')
const BigQueryMixin = require('../../mixins/bigQuery/bigquery.mixin')
const models = require('./homes.model')
const { validationGenerator } = require('../../validator/schema')
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
            params: validationGenerator(models.homes, 'Homes'),
            async handler (ctx) {
                this.logger.info('Save called');
                return this.homes.create(ctx.params)
            },
        },

        // TODO: remove this. just here for testing populating db
        insert:{
            async handler() {
                return await this.homes.create({
                    "location": {
                        "type": "Point",
                        "coordinates": [-79.3338102, 43.5675433]
                    },
                    "created_on": "2021-03-28",
                    "operation": "sell",
                    "property_type": "condo",
                    "geo": {
                        "city_name": "toronto",
                        "country_name": "Canada",
                        "state_name": "Ontario",
                        "lat": "43.5675433",
                        "lon": "-79.3338102"
                    },
                    "about": {
                        "description": "An Astonishing Penthouse Of Rare Size, Location And Design. One Of Just 14 Discrete Residences At Hill And Dale, An Acclaimed Building Where Summerhill Meets Rosedale. This Fully-Customized Penthouse Features 12 Foot Ceilings, Uninterrupted East And West Exposures, 3 Bedrooms And 4 Baths Spanning Approximately 4000 Square Feet. 3 Private Terraces Including An Incomparable Rooftop With Pristine City Views And Private Pool.",
                        "title": "1 Roxborough St E PENTHOUSE 2, Toronto, ON",
                        "price": "1.28E7",
                        "currency": "CAD",
                        "size": "4000",
                        "rooms": "4",
                        "images": ["https://photos.zillowstatic.com/fp/b603244c00d6aed5bdfc6e5abcd942b7-cc_ft_768.jpg", "https://photos.zillowstatic.com/fp/8cc7a8df048c797741220e31bd6686bf-uncropped_scaled_within_1536_1152.webp", "https://photos.zillowstatic.com/fp/c03ab7bc6e420b367d524e4f020dbac0-uncropped_scaled_within_1536_1152.webp", "https://photos.zillowstatic.com/fp/08ea87955287a4625bf0a9324b25aef8-uncropped_scaled_within_1536_1152.webp", "https://photos.zillowstatic.com/fp/8601eb88167f84bd7d8454a1113d38c3-uncropped_scaled_within_1536_1152.webp", "https://photos.zillowstatic.com/fp/d18cc214f7e132a4ce028b5f3c769dc4-uncropped_scaled_within_1536_1152.webp"]
                    },
                    "ext": {
                        "floor": null,
                        "expenses": null,
                        "source_url": "https://www.zillow.com/homedetails/1-Roxborough-St-E-PENTHOUSE-2-Toronto-ON-M4W-1V5/2077447832_zpid/?"
                    }
                });
            },
        },

        near: {
            params: {
                lat: 'number',
                lon: 'number'
            },
            async handler (ctx) {
                const { lat, lon } = ctx.params;
                //const profile = await ctx.call('profiles.me');
                //const filterOut = _.concat(profile.likes, profile.dislikes);
                const filterOut = [];
                const profile = { radius: 100 };
                return await this.homes.find({
                    _id: {$nin: filterOut},
                    location: {
                        $near: {
                            $geometry: {
                                type: "Point" ,
                                coordinates: [ lon, lat ]
                            },
                            $maxDistance: this.toMeters(profile.radius),
                            $minDistance: 0,
                        }
                    }
                }).limit(this.settings.homes.limit);
            }
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

        // TODO: Move BigQueries to Python and replace with Mongoose

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
                        images,
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
                        station.*
                      FROM 
                        nearest_homes AS station, params
                      WHERE 
                        id NOT IN UNNEST(@filter)
                    ),
                    nearest_nhomes AS (
                      SELECT 
                        station.* 
                      FROM 
                        filtered_homes AS station, params
                      WHERE 
                        rank <= params.maxn_homes
                    )
                    SELECT * from nearest_nhomes
                `
                const params = {
                    radius,
                    longitude: coords[0],
                    latitude: coords[1],
                    limit: this.settings.homes.limit,
                    filter: filter.length ? filter : ['']
                }
                return await this.bigQuery(query, params)
            },
        },

        swipe: {
            params: {
                homeId: 'string',
                rating: 'number',
            },
            async handler (ctx) {
                const { homeId, rating } = ctx.params
                const { uid } = ctx.meta.user
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
        toMeters(km){ return km * 1000 }
    },

    events: {},

    async started () {},
}
