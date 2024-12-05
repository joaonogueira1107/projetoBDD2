const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Transacao = sequelize.define('Transacao', {
    ID_Transacao: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    ID_Conta: {
        type: DataTypes.INTEGER,
        references: {
            model: 'conta_bancaria',
            key: 'ID_Conta',
        },
    },
    ID_Categoria: {
        type: DataTypes.INTEGER,
        references: {
            model: 'categoria',
            key: 'ID_Categoria'
        },
    },
    valor: {
        type: DataTypes.FLOAT,
    },
    descricao: {
        type: DataTypes.STRING,
    },
    data_transacao: {
        type: DataTypes.DATE,
    },
}, {
    tableName: 'transacao',
    timestamps: false
});

module.exports = Transacao;
