var DataTypes = require("sequelize").DataTypes;
var _categoria = require("./categoria");
var _conta_bancaria = require("./conta_bancaria");
var _relatorio_financeiro = require("./relatorio_financeiro");
var _transacao = require("./transacao");
var _usuario = require("./usuario");

function initModels(sequelize) {
  var categoria = _categoria(sequelize, DataTypes);
  var conta_bancaria = _conta_bancaria(sequelize, DataTypes);
  var relatorio_financeiro = _relatorio_financeiro(sequelize, DataTypes);
  var transacao = _transacao(sequelize, DataTypes);
  var usuario = _usuario(sequelize, DataTypes);

  transacao.belongsTo(categoria, { as: "ID_Categoria_categorium", foreignKey: "ID_Categoria"});
  categoria.hasMany(transacao, { as: "transacaos", foreignKey: "ID_Categoria"});
  transacao.belongsTo(conta_bancaria, { as: "ID_Conta_conta_bancarium", foreignKey: "ID_Conta"});
  conta_bancaria.hasMany(transacao, { as: "transacaos", foreignKey: "ID_Conta"});
  conta_bancaria.belongsTo(usuario, { as: "ID_Usuario_usuario", foreignKey: "ID_Usuario"});
  usuario.hasMany(conta_bancaria, { as: "conta_bancaria", foreignKey: "ID_Usuario"});
  relatorio_financeiro.belongsTo(usuario, { as: "ID_Usuario_usuario", foreignKey: "ID_Usuario"});
  usuario.hasMany(relatorio_financeiro, { as: "relatorio_financeiros", foreignKey: "ID_Usuario"});

  return {
    categoria,
    conta_bancaria,
    relatorio_financeiro,
    transacao,
    usuario,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
