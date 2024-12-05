const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Categoria = sequelize.define('Categoria', {
    ID_Categoria: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    nome: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'categoria',
    timestamps: false
});

module.exports = Categoria;
