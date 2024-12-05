const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const RelatorioFinanceiro = sequelize.define('RelatorioFinanceiro', {
    ID_Relatorio: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'usuario',
            key: 'ID_Usuario'
        }
    },
    data_geracao: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    },
    periodo_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    periodo_fim: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    tipo_relatorio: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
}, {
    tableName: 'relatorio_financeiro',
    timestamps: false
});

module.exports = RelatorioFinanceiro;
