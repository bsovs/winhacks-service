module.exports = {
    profiles: {
        attributes: {
            _id: { type: String, required: true },
            name: { type: String, required: true },
            email: { type: String, required: true },
            location: { type: String, required: false },
            age: { type: Number, default: 0 },
            likes: { type: Array, default: [] },
            dislikes: { type: Array, default: [] },
        },
        options: {
            _id: false,
        },
    },
    embeds: {
        attributes: {
            uid: { type: String, required: true },
            embed: { type: Array, required: true },
        },
        options: {
            _id: true,
        },
    },
};
