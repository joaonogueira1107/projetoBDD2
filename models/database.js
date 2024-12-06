const { Sequelize } = require('sequelize');

// Criação da instância do Sequelize com as configurações do banco
const sequelize = new Sequelize('projetobdd', 'root', 'aluno123', {
  host: 'localhost', // Pode ser '127.0.0.1' ou o IP do servidor do banco
  dialect: 'mysql',  // Dialeto, neste caso, MySQL
  logging: false,    // Opcional: Desativa os logs de queries no console
});

// Testa a conexão para garantir que está tudo correto
sequelize.authenticate()
  .then(() => console.log('Conexão com o banco de dados bem-sucedida!'))
  .catch(err => console.error('Erro ao conectar ao banco:', err));

module.exports = sequelize;
