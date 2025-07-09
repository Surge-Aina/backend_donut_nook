const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
    itemId: {type: Number, unique: true, required: true},
    name: {type: String},
    description: {type: String},
    category: {type: String},
    imageUrl: {type: String},
    available: {type: Boolean},

    priceHistory: [
        {
            price: {type: Number},
            timestamp: {type: Date}
        }
    ],

    //optional override for custom note, show alongside special if active
    specialNote: {type: String},
    specialStart: {type: Date},
    specialEnd: {type: Date},

}, { timestamps: true });

module.exports = mongoose.model('Menu', MenuSchema);