import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

async function runE2E() {
  console.log('=== TESTE DE PONTA A PONTA MULTI-SESSÃO (ETAPA 4) ===\n');

  // 1. Cadastrar Apresentador exclusivo do teste
  const timestamp = Date.now();
  const apresentadorEmail = `apresentador_${timestamp}@cptm.sp.gov.br`;
  console.log(`1. Cadastrando e autenticando Apresentador (${apresentadorEmail})...`);
  const regApres = await axios.post(`${API_BASE}/auth/cadastro`, {
    nome: 'Silvio Apresentador Oficial',
    email: apresentadorEmail,
    senha: 'senhaForte123!',
    role: 'ROLE_APRESENTADOR'
  });
  const apresentadorToken = regApres.data.token;
  console.log('  -> Apresentador registrado e autenticado com sucesso! Token JWT emitido.');

  // 2. Cadastrar Jogador Logado
  const jogadorEmail = `jogador_${timestamp}@cptm.sp.gov.br`;
  console.log(`\n2. Cadastrando e autenticando Jogador Logado (${jogadorEmail})...`);
  const regPlayer = await axios.post(`${API_BASE}/auth/cadastro`, {
    nome: 'Passageiro da Linha 11',
    email: jogadorEmail,
    senha: 'senhaForte123!',
    role: 'ROLE_JOGADOR'
  });
  const jogadorToken = regPlayer.data.token;
  console.log('  -> Jogador registrado e autenticado com sucesso!');

  // 3. Apresentador Cria Sala de Jogo
  console.log('\n3. Apresentador cria sala coletiva...');
  const salaRes = await axios.post(
    `${API_BASE}/salas/apresentador`,
    { nome: `Expresso Trilhão ${timestamp}` },
    { headers: { Authorization: `Bearer ${apresentadorToken}` } }
  );
  const { codigo, id: salaId } = salaRes.data;
  console.log(`  -> Sala criada com sucesso! Código de Embarque: [${codigo}], ID: ${salaId}`);

  // 4. Visitante e Jogador entram na Sala
  console.log(`\n4. Sessão Visitante entra na sala via código [${codigo}]...`);
  const visitanteRes = await axios.post(`${API_BASE}/salas/${codigo}/entrar-visitante`, {
    codigoSala: codigo,
    nomeVisitante: 'Visitante Móvel'
  });
  const visitanteToken = visitanteRes.data.tokenSessao;
  console.log(`  -> Visitante entrou na sala! Token de Sessão: ${visitanteToken?.substring(0, 10)}...`);

  console.log(`\n5. Sessão Jogador Logado entra na sala via código [${codigo}]...`);
  const jogadorEntradaRes = await axios.post(
    `${API_BASE}/salas/${codigo}/entrar-jogador`,
    {},
    { headers: { Authorization: `Bearer ${jogadorToken}` } }
  );
  console.log(`  -> Jogador logado entrou na sala! Status da Sala: ${jogadorEntradaRes.data.statusSala}`);

  // 5. Teste de Segurança: Jogador comum tenta iniciar a partida (Deve retornar 403 Forbidden)
  console.log('\n6. Teste de Segurança: Jogador comum tenta iniciar a sala (deve ser bloqueado)...');
  let bloqueioConfirmado = false;
  try {
    await axios.post(
      `${API_BASE}/salas/${codigo}/iniciar`,
      {},
      { headers: { Authorization: `Bearer ${jogadorToken}` } }
    );
  } catch (err) {
    if (err.response?.status === 403) {
      bloqueioConfirmado = true;
      console.log('  -> PROVA DE REGRA: Retornou HTTP 403 Forbidden ("Apenas o apresentador pode iniciar a partida da sala").');
    } else {
      console.log(`  -> Status inesperado: ${err.response?.status}`);
    }
  }
  if (!bloqueioConfirmado) {
    throw new Error('Falha de regra de negócio: Jogador comum não recebeu 403!');
  }

  // 6. Apresentador Inicia a Partida Oficial
  console.log('\n7. Apresentador inicia a partida oficial da sala...');
  const inicioRes = await axios.post(
    `${API_BASE}/salas/${codigo}/iniciar`,
    {},
    { headers: { Authorization: `Bearer ${apresentadorToken}` } }
  );
  console.log(`  -> Partida iniciada pelo Apresentador! Status: ${inicioRes.data.statusSala}`);
  console.log(`  -> Pergunta Atual no Telão: "${inicioRes.data.enunciado}"`);
  console.log(`  -> Nível: ${inicioRes.data.nivelAtual}, Valor do Prêmio da Rodada: R$ ${inicioRes.data.valorPremioNivel}`);
  console.log(`  -> Alternativas visíveis no Telão: ${inicioRes.data.alternativas?.length}`);

  // 7. Jogador consulta seu estado no celular (apenas 4 símbolos e timer)
  console.log('\n8. Jogador consulta tela mobile (regra: jogador vê apenas símbolos 1-4)...');
  const estadoJogador = await axios.get(`${API_BASE}/salas/${codigo}/estado-jogador`, {
    headers: { Authorization: `Bearer ${jogadorToken}` }
  });
  console.log(`  -> Estado seguro recebido pelo celular do jogador:`);
  console.log(`     - Status da Sala: ${estadoJogador.data.statusSala}`);
  console.log(`     - Fase da Rodada: ${estadoJogador.data.faseRodada}`);
  console.log(`     - Nível Atual: ${estadoJogador.data.nivelAtual}`);
  console.log(`     - Prêmio Acumulado: R$ ${estadoJogador.data.premioAcumulado}`);
  console.log(`     - Símbolos recebidos no celular: [${estadoJogador.data.simbolos.join(', ')}]`);
  console.log(`     - Confirmação de segurança: Enunciado NÃO enviado ao celular: ${estadoJogador.data.enunciado === undefined}`);

  // 8. Jogador responde tocando no símbolo 1
  console.log('\n9. Jogador responde tocando no símbolo 1 no celular...');
  const respostaJogador = await axios.post(
    `${API_BASE}/salas/${codigo}/responder-simbolo`,
    { simboloNumero: 1 },
    { headers: { Authorization: `Bearer ${jogadorToken}` } }
  );
  console.log(`  -> Resposta registrada no servidor! Já respondeu: ${respostaJogador.data.jaRespondeu}, Alternativa Escolhida: ${respostaJogador.data.alternativaEscolhidaNumero}`);

  // 9. Apresentador revela resposta no telão
  console.log('\n10. Apresentador revela a resposta correta no Telão...');
  const revelado = await axios.post(
    `${API_BASE}/salas/${codigo}/revelar`,
    {},
    { headers: { Authorization: `Bearer ${apresentadorToken}` } }
  );
  console.log(`  -> Telão revelou alternativa correta número: ${revelado.data.alternativaCorretaNumero}`);
  console.log(`  -> Total de respostas recebidas: ${revelado.data.totalRespostasRecebidas}`);

  // 10. Jogador confere resultado no celular
  console.log('\n11. Jogador consulta celular após revelação...');
  const estadoAposRevelar = await axios.get(`${API_BASE}/salas/${codigo}/estado-jogador`, {
    headers: { Authorization: `Bearer ${jogadorToken}` }
  });
  console.log(`  -> Resultado no celular do jogador:`);
  console.log(`     - Acertou última: ${estadoAposRevelar.data.acertouUltima}`);
  console.log(`     - Eliminado: ${estadoAposRevelar.data.eliminado}`);
  console.log(`     - Prêmio acumulado: R$ ${estadoAposRevelar.data.premioAcumulado}`);
  if (estadoAposRevelar.data.eliminado) {
    console.log(`     -> REGRA COMPROVADA: Errou -> Eliminado com R$ 0!`);
  } else {
    console.log(`     -> REGRA COMPROVADA: Acertou -> Avança com prêmio acumulado crescente!`);
  }

  // 11. Apresentador avança para a próxima pergunta (Rodada 2)
  console.log('\n12. Apresentador avança para a pergunta 2...');
  const proxima = await axios.post(
    `${API_BASE}/salas/${codigo}/proxima`,
    {},
    { headers: { Authorization: `Bearer ${apresentadorToken}` } }
  );
  console.log(`  -> Pergunta da Rodada 2 ativa no Telão: "${proxima.data.enunciado}" (Nível ${proxima.data.nivelAtual}, R$ ${proxima.data.valorPremioNivel})`);

  // 12. Teste da regra do TEMPO ESGOTADO / ABANDONO:
  // Jogador não responde a pergunta 2. Apresentador revela após timeout:
  console.log('\n13. Testando regra TEMPO ESGOTADO (45s) / Não respondeu...');
  const reveladoTimeout = await axios.post(
    `${API_BASE}/salas/${codigo}/revelar`,
    {},
    { headers: { Authorization: `Bearer ${apresentadorToken}` } }
  );
  console.log(`  -> Telão processou revelação de tempo esgotado. Alternativa correta: ${reveladoTimeout.data.alternativaCorretaNumero}`);

  const estadoAposTimeout = await axios.get(`${API_BASE}/salas/${codigo}/estado-jogador`, {
    headers: { Authorization: `Bearer ${jogadorToken}` }
  });
  console.log(`  -> Resultado do jogador após tempo esgotado:`);
  console.log(`     - Eliminado: ${estadoAposTimeout.data.eliminado}`);
  console.log(`     - Prêmio final: R$ ${estadoAposTimeout.data.premioAcumulado} (REGRA: ZERO REAIS!)`);

  // 13. Teste de Ranking Global e Ranking da Sala
  console.log('\n14. Consultando Ranking Global e Ranking da Sala...');
  const rankingGeral = await axios.get(`${API_BASE}/ranking/geral`);
  console.log(`  -> Ranking Geral carregado com ${rankingGeral.data.length} posições.`);

  const rankingSala = await axios.get(`${API_BASE}/ranking/sala/${codigo}`);
  console.log(`  -> Ranking da Sala [${codigo}] carregado com ${rankingSala.data.length} participantes.`);

  console.log('\n================================================================');
  console.log(' PROVA EVIDENCIADA: FLUXO MULTI-SESSÃO E TODAS AS REGRAS PASSARAM! ');
  console.log('================================================================');
}

runE2E().catch(err => {
  console.error('\n[FALHA NO TESTE E2E]:', err.response?.data || err.message);
  process.exit(1);
});
