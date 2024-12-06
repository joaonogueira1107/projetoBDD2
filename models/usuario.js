const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const Conta_Bancaria = require('./conta_bancaria'); // Certifique-se de ajustar o caminho para o modelo Conta_Bancaria
const Transacao = require('./transacao'); // Certifique-se de ajustar o caminho para o modelo Transacao

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
    tableName: 'usuario',
    timestamps: false
});

// Associações
Usuario.hasMany(Conta_Bancaria, { foreignKey: 'ID_Usuario' });
Conta_Bancaria.belongsTo(Usuario, { foreignKey: 'ID_Usuario' });

Conta_Bancaria.hasMany(Transacao, { foreignKey: 'ID_Conta' });
Transacao.belongsTo(Conta_Bancaria, { foreignKey: 'ID_Conta' });

module.exports = Usuario;