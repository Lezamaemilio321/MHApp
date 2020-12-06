const mongoose = require('mongoose');

const SessionIdSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('SessionId', SessionIdSchema);