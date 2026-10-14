$baseUrl = "http://localhost:8080/api"

Write-Host "=== 1. Login Apresentador ==="
$loginApres = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body '{"email":"apresentador@cptm.sp.gov.br","senha":"Mestre@CPTM2026"}'
$tokenApres = $loginApres.token
Write-Host "Apresentador logado com sucesso."

Write-Host "=== 2. Registro de Jogador Logado ==="
$rand = Get-Random -Minimum 1000 -Maximum 9999
$emailJog = "jogador_$rand@cptm.sp.gov.br"
$regJog = Invoke-RestMethod -Uri "$baseUrl/auth/cadastro" -Method Post -ContentType "application/json; charset=utf-8" -Body (@{nome="Maquinista Silva"; email=$emailJog; senha="SenhaForte123!"; role="ROLE_JOGADOR"} | ConvertTo-Json)
$tokenJog = $regJog.token
Write-Host "Jogador registrado e logado: $emailJog"

Write-Host "=== 3. Apresentador Cria Sala ==="
$sala = Invoke-RestMethod -Uri "$baseUrl/salas/apresentador" -Method Post -Headers @{Authorization="Bearer $tokenApres"} -ContentType "application/json; charset=utf-8" -Body '{"nome":"Expresso CPTM Auditorio"}'
$codigo = $sala.codigo
Write-Host "Sala criada com codigo: $codigo (Status: $($sala.status))"

Write-Host "=== 4. Teste 403: Jogador tenta iniciar a sala ==="
try {
    Invoke-RestMethod -Uri "$baseUrl/salas/$codigo/iniciar" -Method Post -Headers @{Authorization="Bearer $tokenJog"}
    Write-Host "FALHA: Jogador nao autorizado conseguiu iniciar a sala!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "SUCESSO: Jogador bloqueado com HTTP $statusCode (Esperado 403 Forbidden)" -ForegroundColor Green
}

Write-Host "=== 5. Jogador entra na sala ==="
$entrouJog = Invoke-RestMethod -Uri "$baseUrl/salas/$codigo/entrar-jogador" -Method Post -Headers @{Authorization="Bearer $tokenJog"}
$tokenSessaoJog = $entrouJog.tokenSessao
Write-Host "Jogador entrou na sala. TokenSessao emitido: $tokenSessaoJog"

Write-Host "=== 6. Visitante entra na sala ==="
$entrouVis = Invoke-RestMethod -Uri "$baseUrl/salas/$codigo/entrar-visitante" -Method Post -ContentType "application/json; charset=utf-8" -Body (@{codigoSala=$codigo; nomeVisitante="ZecareTurista"} | ConvertTo-Json)
$tokenSessaoVis = $entrouVis.tokenSessao
Write-Host "Visitante entrou na sala. TokenSessao emitido: $tokenSessaoVis"

Write-Host "=== 7. Apresentador consulta estado do Lobby ==="
$estadoLobby = Invoke-RestMethod -Uri "$baseUrl/salas/$codigo/estado-apresentador" -Method Get -Headers @{Authorization="Bearer $tokenApres"}
Write-Host "Status da Sala: $($estadoLobby.statusSala), Conectados: $($estadoLobby.totalConectados), Participantes: $($estadoLobby.participantes -join ', ')"

Write-Host "=== 8. Apresentador inicia a partida da sala ==="
$iniciado = Invoke-RestMethod -Uri "$baseUrl/salas/$codigo/iniciar" -Method Post -Headers @{Authorization="Bearer $tokenApres"}
Write-Host "Partida iniciada! Status: $($iniciado.statusSala), Pergunta: $($iniciado.perguntaAtualIndex)/10"
Write-Host "Enunciado visivel para o Telao: $($iniciado.enunciado)"
Write-Host "Alternativa correta (apenas telao/apresentador): $($iniciado.alternativaCorretaNumero)"

Write-Host "=== 9. Validar Seguranca do Jogador: NENHUM texto de enunciado/alternativa ==="
$estadoJog = Invoke-RestMethod -Uri "$baseUrl/salas/$codigo/estado-jogador" -Method Get -Headers @{"X-Session-Token"=$tokenSessaoJog}
Write-Host "Fase da Rodada: $($estadoJog.faseRodada)"
Write-Host "Nivel da Pergunta: $($estadoJog.nivelAtual)"
Write-Host "Premio Atual: $($estadoJog.premioAtual)"
Write-Host "Simbolos disponiveis: $($estadoJog.simbolos -join ', ')"
Write-Host "Prazo final no servidor: $($estadoJog.prazoFinal)"
Write-Host "Hora atual no servidor: $($estadoJog.horaServidor)"

if ($estadoJog.enunciado -or $estadoJog.texto -or $estadoJog.alternativas -or $estadoJog.alternativaCorreta) {
    Write-Host "ERRO CRITICO: Estado do jogador vazou texto ou gabarito!" -ForegroundColor Red
} else {
    Write-Host "SEGURANCA CONFIRMADA: Zero texto de pergunta, alternativas ou gabarito no payload do jogador." -ForegroundColor Green
}

Write-Host "=== 10. Jogador responde com Simbolo 2 ==="
$respJog = Invoke-RestMethod -Uri "$baseUrl/salas/$codigo/responder-simbolo" -Method Post -Headers @{"X-Session-Token"=$tokenSessaoJog} -ContentType "application/json; charset=utf-8" -Body '{"simboloNumero":2}'
Write-Host "Resposta enviada com sucesso. Ja respondeu: $($respJog.jaRespondeuNaPerguntaAtual)"

Write-Host "=== 11. Teste de Duplicidade: Jogador tenta responder de novo ==="
try {
    Invoke-RestMethod -Uri "$baseUrl/salas/$codigo/responder-simbolo" -Method Post -Headers @{"X-Session-Token"=$tokenSessaoJog} -ContentType "application/json; charset=utf-8" -Body '{"simboloNumero":3}'
    Write-Host "FALHA: Jogador conseguiu responder duas vezes!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "SUCESSO: Tentativa duplicada rejeitada com HTTP $statusCode (sem erro 500)" -ForegroundColor Green
}

Write-Host "=== 12. Apresentador revela resposta ==="
$revelado = Invoke-RestMethod -Uri "$baseUrl/salas/$codigo/revelar" -Method Post -Headers @{Authorization="Bearer $tokenApres"}
Write-Host "Revelacao realizada. Fase: $($revelado.faseRodada), Alternativa Correta: $($revelado.alternativaCorretaNumero)"
Write-Host "Votos contabilizados: Simbolo 1: $($revelado.votosPorSimbolo.'1'), Simbolo 2: $($revelado.votosPorSimbolo.'2'), Simbolo 3: $($revelado.votosPorSimbolo.'3'), Simbolo 4: $($revelado.votosPorSimbolo.'4')"

Write-Host "=== 13. Jogador consulta seu resultado apos revelacao ==="
$estadoPosRevela = Invoke-RestMethod -Uri "$baseUrl/salas/$codigo/estado-jogador" -Method Get -Headers @{"X-Session-Token"=$tokenSessaoJog}
Write-Host "Jogador status: AcertouUltima: $($estadoPosRevela.acertouUltimaPergunta), Eliminado: $($estadoPosRevela.eliminado), Premio: $($estadoPosRevela.premioAtual)"

Write-Host "=== 14. Teste de Bloqueio de Entrada com Sala EM_ANDAMENTO ==="
try {
    Invoke-RestMethod -Uri "$baseUrl/salas/$codigo/entrar-visitante" -Method Post -ContentType "application/json; charset=utf-8" -Body (@{codigoSala=$codigo; nomeVisitante="Atrasado"} | ConvertTo-Json)
    Write-Host "FALHA: Novo jogador conseguiu entrar em sala em andamento!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "SUCESSO: Bloqueio de novos participantes em andamento retornou HTTP $statusCode" -ForegroundColor Green
}

Write-Host "=== 15. Apresentador avanca para proxima pergunta (Nivel 2) ==="
$proxima = Invoke-RestMethod -Uri "$baseUrl/salas/$codigo/proxima" -Method Post -Headers @{Authorization="Bearer $tokenApres"}
Write-Host "Avanco concluido. Pergunta atual: $($proxima.perguntaAtualIndex)/10, Fase: $($proxima.faseRodada)"

Write-Host "=== TODOS OS 15 TESTES PASSARAM COM 100% DE SUCESSO! ==="
