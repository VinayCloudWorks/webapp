// models/file.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils');

const File = sequelize.define('File', {
    file_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    file_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    s3_bucket_path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date_created: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false
});

module.exports = File;