// models/HealthCheck.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils');

// Define a model that maps to the "health_check" table
const HealthCheck = sequelize.define('HealthCheck', {
    check_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    datetime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: 'health_check', // forces table name to be exactly "health_check"
    timestamps: false,         // don't add createdAt/updatedAt columns
});

module.exports = HealthCheck;
