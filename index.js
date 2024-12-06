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

const realizarTransacao = async (usuarioOrigem, usuarioDestino, valorTransacao, tipoTransacao, formaPagamento) => {
  const MAX_RETRIES = 5; // Número máximo de tentativas
  const RETRY_DELAY = 1000; // Atraso de 1 segundo entre tentativas
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      // Iniciar a transação no Sequelize
      await sequelize.transaction(async (t) => {
        // Garantir que a ordem de bloqueio das contas seja consistente
        const [contaOrigem, contaDestino] = await Promise.all([
          ContaBancaria.findOne({ where: { ID_Usuario: usuarioOrigem }, transaction: t }),
          ContaBancaria.findOne({ where: { ID_Usuario: usuarioDestino }, transaction: t }),
        ]);

        if (!contaOrigem || !contaDestino) {
          throw new Error('Conta de origem ou destino não encontrada');
        }

        // Verificar saldo suficiente na conta de origem para a transação
        const saldoOrigem = parseFloat(contaOrigem.saldo_atual);
        if (tipoTransacao === 'gasto' && saldoOrigem < valorTransacao) {
          throw new Error('Saldo insuficiente para realizar o gasto');
        }

        // Garantir a ordem de atualização das contas para evitar deadlock
        const contas = [contaOrigem, contaDestino].sort((a, b) => a.ID_Conta - b.ID_Conta);
        
        // Atualizar a conta de origem
        await ContaBancaria.update(
          { saldo_atual: (saldoOrigem - valorTransacao).toFixed(2) },
          { where: { ID_Conta: contas[0].ID_Conta }, transaction: t }
        );

        // Atualizar a conta de destino
        await ContaBancaria.update(
          { saldo_atual: (parseFloat(contaDestino.saldo_atual) + valorTransacao).toFixed(2) },
          { where: { ID_Conta: contas[1].ID_Conta }, transaction: t }
        );

        // Criar a transação no banco de dados
        await Transacao.create({
          ID_Conta: contaOrigem.ID_Conta,
          tipo: tipoTransacao, // Depósito ou Gasto
          valor: valorTransacao,
          descricao: `Transação de ${tipoTransacao} entre ${usuarioOrigem} e ${usuarioDestino}`,
          forma_pagamento: formaPagamento, // Forma de pagamento
          data_transacao: new Date(),
          transaction: t,
        });

        console.log(`Saldo atualizado: Origem (${saldoOrigem}), Destino (${contaDestino.saldo_atual})`);
      });

      console.log('Transação realizada com sucesso');
      return; // Transação bem-sucedida, sai da função
    } catch (error) {
      if (error.code === 'ER_LOCK_WAIT_TIMEOUT' || error.code === 'ER_LOCK_DEADLOCK') {
        retries++;
        console.log(`Deadlock ou timeout detectado, tentando novamente... (Tentativa ${retries})`);
        if (retries < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));  // Atraso entre tentativas
        } else {
          throw new Error('Máximo de tentativas de transação atingido');
        }
      } else {
        throw error;  // Se for outro erro, não tenta novamente
      }
    }
  }
};

// Rota para aplicar a transação
// Rota para realizar a transação
app.post('/transacao/realizar', async (req, res) => {
  const { usuarioOrigem, usuarioDestino, valor, tipoTransacao, formaPagamento } = req.body;

  console.log('Dados recebidos para transação:', { usuarioOrigem, usuarioDestino, valor, tipoTransacao, formaPagamento });

  if (!usuarioOrigem || !usuarioDestino || !valor || !tipoTransacao || !formaPagamento) {
    return res.status(400).send('Dados inválidos ou ausentes');
  }

  const valorTransacao = parseFloat(valor);

  if (isNaN(valorTransacao) || valorTransacao <= 0) {
    return res.status(400).send('Valor inválido');
  }

  try {
    // Função que tenta realizar a transação
    await realizarTransacao(usuarioOrigem, usuarioDestino, valorTransacao, tipoTransacao, formaPagamento);

    console.log('Transação realizada com sucesso');
    res.redirect('/relatorio'); // Redireciona para o relatório
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
    const usuario = await Usuario.findOne({ where: { ID_Usuario: 1 } });
    if (!usuario) return res.status(404).send('Usuário não encontrado');

    const contas = await ContaBancaria.findAll({ where: { ID_Usuario: usuario.ID_Usuario } });
    const contasIds = contas.map(conta => conta.ID_Conta);

    const transacoes = await Transacao.findAll({ where: { ID_Conta: contasIds } });

    const totalSaldo = contas.reduce((acc, conta) => acc + conta.saldo_atual, 0);
    const totalTransacoes = transacoes.length;

    // Calcular o total de depósitos e gastos
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
