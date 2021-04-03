module.exports = {
    homes: {
        attributes: {
            operation: { type: String, required: true, enum: ['sell', 'rent'] },
            property_type: { type: String, required: true, enum: ['house', 'condo'] },
            location: {
                type: {
                    type: String,
                    enum: ['Point'],
                    default: 'Point',
                },
                coordinates: {
                    type: [Number], // INFO: [longitude, latitude]
                    required: true,
                },
            },
            geo: {
                lat: { type: Number, required: true },
                lon: { type: Number, required: true },
                city_name: { type: String, default: null },
                country_name: { type: String, default: null },
                state_name: { type: String, default: null },
            },
            about: {
                title: { type: String, required: true },
                price: { type: Number, required: true },
                currency: { type: String, default: 'CAD', enum: ['USD', 'CAD', 'EUR', 'GBP', 'AUS'] },
                size: { type: Number, default: null },
                rooms: { type: String, default: null },
                description: { type: String, default: null },
                images: { type: Array, default: [] },
            },
            ext: {
                floor: { type: String, default: null },
                expenses: { type: String, default: null },
                source_url: { type: String, default: null },
            },
        },
        indexes: {
            location: '2dsphere',
        }
    },
};
