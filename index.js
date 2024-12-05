const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const sequelize = require('./models/database');
const Usuario = require('./models/usuario');
const ContaBancaria = require('./models/conta_bancaria'); // Corrija a importação
const Transacao = require('./models/Transacao');
const Categoria = require('./models/categoria');
// const { Sequelize } = require('sequelize'); // Importação do Sequelize no arquivo

// Sincronizar o banco de dados
sequelize.sync()
  .then(() => {
    console.log("Banco de dados sincronizado.");
  })
  .catch((err) => {
    console.error("Erro ao sincronizar o banco de dados:", err);
  });


const port = 80;

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: true })); // Para processar dados de formulários
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: true })); // Para processar dados de formulário
app.use(express.json()); // Para processar dados JSO

// Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Rotas
app.get('/', (req, res) => {
    res.render('cadastroUsuario');
});

app.get('/landingPage', (req, res) => {
    res.render('landingPage');
});

// Rota GET para renderizar a página de transação
app.get('/transacao', async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();

    res.render('transacao', { usuarios });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).send('Erro ao buscar usuários');
  } 
});

app.post('/transacao/realizar', async (req, res) => {
  const { usuarioOrigem, usuarioDestino, valor } = req.body;

  console.log('Dados recebidos para transação:', { usuarioOrigem, usuarioDestino, valor });

  if (!usuarioOrigem || !usuarioDestino || !valor) {
    return res.status(400).send('Dados inválidos ou ausentes');
  }

  const valorTransacao = parseFloat(valor);

  if (isNaN(valorTransacao) || valorTransacao <= 0) {
    return res.status(400).send('Valor inválido');
  }

  try {
    // Iniciar uma transação no Sequelize
    await sequelize.transaction(async (t) => {
      // Buscar contas de origem e destino
      const contaOrigem = await ContaBancaria.findOne({ where: { ID_Usuario: usuarioOrigem }, transaction: t });
      const contaDestino = await ContaBancaria.findOne({ where: { ID_Usuario: usuarioDestino }, transaction: t });

      if (!contaOrigem || !contaDestino) {
        throw new Error('Conta de origem ou destino não encontrada');
      }

      // Converter saldo para números
      const saldoOrigem = parseFloat(contaOrigem.saldo_atual);
      const saldoDestino = parseFloat(contaDestino.saldo_atual);

      // Verificar saldo suficiente na conta de origem
      if (saldoOrigem < valorTransacao) {
        throw new Error('Saldo insuficiente para realizar a transferência');
      }

      // Atualizar os saldos usando `toFixed` para precisão decimal
      const novoSaldoOrigem = parseFloat((saldoOrigem - valorTransacao).toFixed(2));
      const novoSaldoDestino = parseFloat((saldoDestino + valorTransacao).toFixed(2));

      // Atualizar os valores no banco de dados
      await ContaBancaria.update(
        { saldo_atual: novoSaldoOrigem },
        { where: { ID_Usuario: usuarioOrigem }, transaction: t }
      );

      await ContaBancaria.update(
        { saldo_atual: novoSaldoDestino },
        { where: { ID_Usuario: usuarioDestino }, transaction: t }
      );

      console.log(`Saldo atualizado: Origem (${novoSaldoOrigem}), Destino (${novoSaldoDestino})`);
    });

    console.log('Transferência realizada com sucesso');
    res.redirect('/usuario');
  } catch (error) {
    console.error('Erro ao realizar transação:', error.message);
    res.status(500).send(`Erro ao realizar a transação: ${error.message}`);
  }
});
  
app.post('/transacao', async (req, res) => {
  const { usuarioId, contaId, valor } = req.body;

  console.log('Dados recebidos:', { usuarioId, contaId, valor });

  if (!usuarioId || !contaId || !valor) {
      return res.status(400).send('Dados inválidos ou ausentes');
  }

  const valorTransacao = parseFloat(valor);

  if (isNaN(valorTransacao) || valorTransacao <= 0) {
      return res.status(400).send('Valor inválido');
  }

  try {
      const conta = await ContaBancaria.findByPk(contaId);

      if (!conta) {
          return res.status(404).send('Conta não encontrada');
      }

      console.log('Saldo atual antes da atualização:', conta.saldo_atual);

      // Garantir que o saldo_atual seja um número
      conta.saldo_atual = parseFloat(conta.saldo_atual); // Garantir que o saldo seja numérico

      // Atualizando o saldo
      conta.saldo_atual += valorTransacao;

      console.log('Saldo atualizado para:', conta.saldo_atual);

      await conta.save();

      // Buscar os dados de usuários e contas atualizados
      const usuarios = await Usuario.findAll();
      const contas = await ContaBancaria.findAll();

      res.render('usuario', { usuarios, contas });
  } catch (error) {
      console.error('Erro ao atualizar o saldo:', error);
      res.status(500).send('Erro ao atualizar o saldo');
  }
});



app.get('/usuario', async (req, res) => {
    try {
        const usuarios = await Usuario.findAll();
        const contas = await ContaBancaria.findAll();

        // Renderize a página com EJS, passando os dados
        res.render('usuario', { usuarios, contas });
    } catch (error) {
        console.error(error);
        res.status(500).send('<h2>Erro ao buscar os usuários</h2>');
    }
});

// Nova rota para retornar usuários como JSON
app.get('/api/usuarios', async (req, res) => {
    try {
        const usuarios = await Usuario.findAll();
        const contas = await ContaBancaria.findAll();
          // Renderize a página com EJS, passando os dados
        res.render('usuario', { usuarios, contas });
    } catch (error) {
        console.error(error);
        res.status(500).send('<h2>Erro ao buscar os usuários</h2>');
    }
});

app.get('/contaBancaria', async (req, res) => {
    try {
      const contas = await ContaBancaria.findAll();
       // Renderize a página com EJS, passando os dados
       res.render('contaBancaria', { contas });
    } catch (error) {
        console.error(error);
        res.status(500).send('<h2>Erro ao buscar os usuários</h2>');
    }
});
  
app.get('/api/contaBancaria', async (req, res) => {
    try {
        const contas = await ContaBancaria.findAll();
        res.json(contas);
      } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar contas bancárias');
      }
})

app.post('/cadastroUsuario', async (req, res) => {
    try {
        const { nome, email, senha, telefone, data_nascimento } = req.body;

        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
            return res.send('<h2>Usuário já existe</h2>');
        }

        const novoUsuario = await Usuario.create({ nome, email, senha, telefone, data_nascimento });

        const novaConta = await ContaBancaria.create({
            ID_Usuario: novoUsuario.ID_Usuario,
            banco: 'Banco Fortis',
            agencia: '0001',
            conta: `${Math.floor(Math.random() * 100000000)}`,
            tipo_conta: 'Conta Corrente',
            saldo_atual: 0.00,
        });

        console.log(`Conta criada com sucesso para o usuário ${novoUsuario.nome}:`, novaConta);
        res.redirect('/landingPage');
    } catch (error) {
        console.error(error);
        res.status(500).send('<h2>Erro no servidor</h2>');
    }
});

app.get('/relatorio', async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ where: { ID_Usuario: 1 } }); // Ajuste conforme necessário
    const transacoes = await Transacao.findAll({ where: { ID_Usuario: usuario.ID_Usuario } });

    // Cálculos
    const totalSaldo = transacoes.reduce((acc, transacao) => acc + transacao.valor, 0);
    const totalTransacoes = transacoes.length;
    const totalDepositos = transacoes
      .filter(transacao => transacao.tipo === 'deposito')
      .reduce((acc, transacao) => acc + transacao.valor, 0);
    const totalGastos = transacoes
      .filter(transacao => transacao.tipo === 'gasto')
      .reduce((acc, transacao) => acc + transacao.valor, 0);

    res.render('relatorio', {
      usuario,
      transacoes,
      totalSaldo,
      totalTransacoes,
      totalDepositos,
      totalGastos,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).send('Erro ao gerar relatório');
  }
});



// Rota GET para renderizar a página de categorias
app.get('/categoria', async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    res.render('categoria', { categorias });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).send('Erro ao buscar categorias');
  }
});

// Rota POST para adicionar uma nova categoria
app.post('/categoria/adicionar', async (req, res) => {
  const { nome, descricao } = req.body;

  if (!nome) {
    return res.status(400).send('Nome da categoria é obrigatório');
  }

  try {
    const novaCategoria = await Categoria.create({ nome, descricao });
    console.log('Categoria adicionada:', novaCategoria);
    res.redirect('/categoria');  // Redireciona para a lista de categorias
  } catch (error) {
    console.error('Erro ao adicionar categoria:', error);
    res.status(500).send('Erro ao adicionar categoria');
  }
});


Usuario.findAll().then(usuarios => {
    console.log('Usuários:', JSON.stringify(usuarios, null, 2));
}).catch(err => {
    console.error('Erro ao buscar usuários:', err);
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
