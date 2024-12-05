const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const ContaBancaria = sequelize.define('ContaBancaria', {
    ID_Conta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        references: {
            model: 'usuario',
            key: 'ID_Usuario',
        },
    },
    banco: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    agencia: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    conta: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    tipo_conta: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    saldo_atual: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0,
    },
    data_criacao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'conta_bancaria',
    timestamps: false,
});

module.exports = ContaBancaria;
