const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Usuario = sequelize.define('Usuario', {
    ID_Usuario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    senha: {
        type: DataTypes.STRING,
        allowNull: false
    },
    telefone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    data_nascimento: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'usuario', // Se necessário, especifique o nome da tabela
    timestamps: false
});

module.exports = Usuario;
