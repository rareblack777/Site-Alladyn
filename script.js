// --- INICIALIZAÇÃO SEGURA (MODO TESTE ATIVO) ---
let carrinho = {};
let cliente = {}; 

try {
  carrinho = JSON.parse(localStorage.getItem('carrinhoAlladyn')) || {};
  // cliente = JSON.parse(localStorage.getItem('clienteAlladyn')) || {}; // Comentado para testes
} catch (e) {
  localStorage.clear();
}

// --- LÓGICA DA ANIMAÇÃO INTRO ---
(function gerenciarIntro() {
  const overlay = document.getElementById('intro-overlay');
  const jaViuIntro = sessionStorage.getItem('introVisto');

  if (jaViuIntro) {
    if (overlay) overlay.style.display = 'none';
    document.body.classList.add('loaded'); 
  } else {
    setTimeout(() => {
      if (overlay) overlay.style.display = 'none';
      document.body.classList.add('loaded');
      sessionStorage.setItem('introVisto', 'true');
    }, 1000); 
  }
})();

window.onload = () => {
  carregarModalCliente();
  verificarCadastro(); 
  renderizarBotoes();
  atualizarResumo();
  capturarPrecosOriginais();
  configurarFechamentoCarrinho();
  
  // NOVA FUNÇÃO: Conecta os checkboxes automaticamente
  conectarInputs(); 
};

// --- GARANTIA DE DADOS (NOVO) ---
function conectarInputs() {
  // Procura todos os checkboxes de molho e adicional e adiciona evento de clique
  const inputs = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
  inputs.forEach(input => {
    // Se o input tem nome começando com molho_ ou adcional_
    if (input.name && (input.name.startsWith('molho_') || input.name.startsWith('adcional_'))) {
      input.addEventListener('change', function() {
        // Extrai o ID do produto (ex: molho_Alladyn-Especial -> Alladyn-Especial)
        let idProduto = this.name.replace('molho_', '').replace('adcional_', '');
        // Chama a atualização forçando o nome correto
        atualizarPreco(idProduto);
      });
    }
  });
}

// --- FUNÇÃO DE VERIFICAÇÃO ---
function verificarCadastro() {
  const jaFechou = sessionStorage.getItem('modalFechado');
  if (jaFechou) return;
  document.getElementById('modalCadastro').classList.add('active');
}

// --- MODAL DE CLIENTE ---
function carregarModalCliente() {
  const modalHTML = `
    <div id="modalCadastro" class="modal-overlay">
      <div class="modal-box">
        <h2>👋 Olá! Vamos agilizar?</h2>
        <p style="font-size:13px; color:#666">Preencha para finalizar seu pedido.</p>
        
        <label>Nome Completo:</label>
        <input type="text" id="cliNome" value="" placeholder="Ex: João Silva">
        
        <label>WhatsApp / Celular:</label>
        <input type="tel" id="cliCelular" value="" placeholder="(82) 99999-9999">
        
        <label>Endereço (Rua/Av):</label>
        <input type="text" id="cliEndereco" value="" placeholder="Ex: Rua das Flores">
        
        <div style="display:flex; gap:10px;">
          <div style="flex:1">
            <label>Nº da Casa:</label>
            <input type="text" id="cliNumero" value="" placeholder="Ex: 123">
          </div>
          <div style="flex:1">
            <label>Quadra (Opcional):</label>
            <input type="text" id="cliQuadra" value="" placeholder="Q-10">
          </div>
        </div>

        <label>Complemento / Ponto de Ref.:</label>
        <input type="text" id="cliComplemento" value="" placeholder="Ex: Ao lado da praça">
        
        <button class="btn-salvar" onclick="salvarDadosCliente()">SALVAR DADOS ✅</button>
        <button class="btn-fechar" onclick="fecharModal()">Fechar e ver cardápio</button>
      </div>
    </div>
  `;
  
  if(document.body) {
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  const painel = document.getElementById('cartPanel');
  if (painel && !document.getElementById('btnEditarEnd')) {
      const btnEditar = document.createElement('button');
      btnEditar.id = 'btnEditarEnd';
      btnEditar.className = 'btn-editar';
      btnEditar.innerText = '📝 Editar meus dados de entrega';
      btnEditar.onclick = () => document.getElementById('modalCadastro').classList.add('active');
      
      const titulo = painel.querySelector('h3');
      if(titulo) titulo.insertAdjacentElement('afterend', btnEditar);
  }
}

function fecharModal() {
  document.getElementById('modalCadastro').classList.remove('active');
  sessionStorage.setItem('modalFechado', 'true');
}

function salvarDadosCliente() {
  const nome = document.getElementById('cliNome').value.trim();
  const celular = document.getElementById('cliCelular').value.trim();
  const endereco = document.getElementById('cliEndereco').value.trim();
  const numero = document.getElementById('cliNumero').value.trim();
  const quadra = document.getElementById('cliQuadra').value.trim();
  const complemento = document.getElementById('cliComplemento').value.trim();

  if (!nome || !celular || !endereco || !numero) {
    alert("Por favor, preencha: Nome, Celular, Endereço e Número.");
    return;
  }

  cliente = { nome, celular, endereco, numero, quadra, complemento };
  localStorage.setItem('clienteAlladyn', JSON.stringify(cliente));
  
  fecharModal();
  alert("Dados atualizados com sucesso!");
}

// --- FUNÇÕES DE CARRINHO E ENVIO ---

function enviarPedido() {
  if (!cliente.nome || !cliente.celular || !cliente.endereco || !cliente.numero) {
    alert("Para entregar, precisamos do seu endereço completo. Por favor, preencha.");
    document.getElementById('modalCadastro').classList.add('active');
    return;
  }

  // Verifica carrinho vazio
  let temItens = false;
  for (const nome in carrinho) {
    if (carrinho[nome].qtd > 0) temItens = true;
  }
  if (!temItens) {
    alert("Seu carrinho está vazio!");
    return;
  }

  let mensagem = `🛒 *PEDIDO NOVO - ALLADYN*\n\n`;
  mensagem += `👤 *Nome:* ${cliente.nome}\n`;
  mensagem += `📱 *Celular:* ${cliente.celular}\n`;
  mensagem += `📍 *Endereço:* ${cliente.endereco}, Nº ${cliente.numero}\n`;
  if(cliente.quadra) mensagem += `🏙️ *Quadra:* ${cliente.quadra}\n`;
  if(cliente.complemento) mensagem += `📌 *Comp:* ${cliente.complemento}\n`;
  mensagem += `----------------------\n`;

  let totalGeral = 0;

  for (const nome in carrinho) {
    const item = carrinho[nome];
    if (item.qtd === 0) continue;
    
    // Tenta atualizar uma última vez lendo a tela (se possível)
    try {
      const idNome = nome.replace(/\s/g, '-');
      const molhosInputs = document.querySelectorAll(`input[name='molho_${idNome}']:checked`);
      if (molhosInputs.length > 0) {
          item.molhos = Array.from(molhosInputs).map(e => e.value);
      }
      const adcsInputs = document.querySelectorAll(`input[name='adcional_${idNome}']:checked`);
      if (adcsInputs.length > 0) {
           item.adicionais = Array.from(adcsInputs).map(e => ({
              nome: e.value,
              preco: parseFloat(e.dataset.preco.replace(',', '.'))
           }));
      }
    } catch(e) { console.log('Item fora da tela, usando memória salva.'); }

    // Calcula Subtotal
    let totalAdicionais = 0;
    if(item.adicionais) {
      totalAdicionais = item.adicionais.reduce((acc, cur) => acc + cur.preco, 0);
    }
    const subtotal = (item.precoUnitario) * item.qtd; 
    // Nota: item.precoUnitario já contém os adicionais somados em atualizarCarrinho
    
    totalGeral += subtotal;
    const nomeLimpo = nome.replace(/-/g, ' ').toUpperCase();

    mensagem += `🍔 *${nomeLimpo}* (x${item.qtd})\n`;
    
    if (item.adicionais && item.adicionais.length > 0) {
      mensagem += `   + ${item.adicionais.map(a => a.nome).join(', ')}\n`;
    }
    if (item.molhos && item.molhos.length > 0) {
      mensagem += `   + Molhos: ${item.molhos.join(', ')}\n`;
    }
    
    mensagem += `   💰 *Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}*\n\n`;
  }

  mensagem += `🧾 *TOTAL GERAL: R$ ${totalGeral.toFixed(2).replace('.', ',')}*`;

  const telefone = '5582999936156'; 
  const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}

function configurarFechamentoCarrinho() {
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      const painel = document.getElementById('cartPanel');
      if (painel) painel.classList.remove('active');
    }
  });
  document.addEventListener('click', function(event) {
    const painel = document.getElementById('cartPanel');
    const icone = document.querySelector('.cart-icon');
    if (painel && painel.classList.contains('active')) {
      if (!painel.contains(event.target) && !icone.contains(event.target)) {
        painel.classList.remove('active');
      }
    }
  });
}

function capturarPrecosOriginais() {
  document.querySelectorAll('.preco').forEach(el => {
    if (!el.dataset.original) {
      el.dataset.original = el.innerText.replace('R$', '').trim().replace(',', '.');
    }
  });
}

function atualizarCarrinho(nome, delta) {
  const idNome = nome.replace(/\s/g, '-'); 
  let itemAtual = carrinho[nome] || { qtd: 0, precoUnitario: 0, adicionais: [], molhos: [] };
  const divPreco = document.getElementById(`preco_${idNome}`);
  
  if (divPreco) {
    let precoBase = parseFloat(divPreco.dataset.original || divPreco.innerText.replace('R$', '').replace(',', '.').trim());
    
    // Captura Adicionais
    const adcsInputs = document.querySelectorAll(`input[name='adcional_${idNome}']:checked`);
    const listaAdicionais = Array.from(adcsInputs).map(e => ({
       nome: e.value,
       preco: parseFloat(e.dataset.preco.replace(',', '.'))
    }));
    
    // Captura Molhos
    const molhosInputs = document.querySelectorAll(`input[name='molho_${idNome}']:checked`);
    const listaMolhos = Array.from(molhosInputs).map(e => e.value);

    const totalAdicionais = listaAdicionais.reduce((acc, cur) => acc + cur.preco, 0);
    
    itemAtual.precoUnitario = precoBase + totalAdicionais;
    itemAtual.adicionais = listaAdicionais;
    itemAtual.molhos = listaMolhos;
  }

  itemAtual.qtd += delta;
  if (itemAtual.qtd < 0) itemAtual.qtd = 0;

  const spanQtd = document.getElementById('quant_' + idNome);
  if (spanQtd) spanQtd.innerText = itemAtual.qtd;

  if (itemAtual.qtd > 0) carrinho[nome] = itemAtual;
  else delete carrinho[nome];

  salvarStorage();
  atualizarResumo(); 
}

function renderizarBotoes() {
  document.querySelectorAll('[id^="quant_"]').forEach(el => {
    el.innerText = '0';
  });
  for (const nome in carrinho) {
    const idNome = nome.replace(/\s/g, '-');
    const spanQtd = document.getElementById('quant_' + idNome);
    if (spanQtd) spanQtd.innerText = carrinho[nome].qtd;
  }
}

function atualizarResumo() {
  const lista = document.getElementById('cartList');
  const contador = document.getElementById('cartCount');
  if (!lista || !contador) return;

  lista.innerHTML = '';
  let qtdTotal = 0;
  for (const nome in carrinho) {
    const item = carrinho[nome];
    if (item.qtd > 0) {
      const li = document.createElement('li');
      const nomeLimpo = nome.replace(/-/g, ' ');
      li.innerText = `${nomeLimpo} - ${item.qtd}x`;
      lista.appendChild(li);
      qtdTotal += item.qtd;
    }
  }
  contador.innerText = qtdTotal;
}

function salvarStorage() {
  localStorage.setItem('carrinhoAlladyn', JSON.stringify(carrinho));
}

function toggleCart() {
  const painel = document.getElementById('cartPanel');
  if(painel) painel.classList.toggle('active');
}

// Função para alternar seções e mudar o fundo
function toggleSection(sectionId) {
    // 1. Esconde todas as seções
    document.getElementById('individual').style.display = 'none';
    document.getElementById('combos').style.display = 'none';
    document.getElementById('bebidas').style.display = 'none';

    // 2. Mostra a seção clicada
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }

    // 3. Troca a classe do fundo (HERO IMAGE)
    // O JS procura a div com id "hero-background"
    const heroBg = document.getElementById('hero-background');
    if (heroBg) {
        // Remove as classes de fundo antigas
        heroBg.classList.remove('bg-lanches', 'bg-combos', 'bg-bebidas');
        
        // Adiciona a nova classe baseada na seção
        if (sectionId === 'individual') {
            heroBg.classList.add('bg-lanches');
        } else if (sectionId === 'combos') {
            heroBg.classList.add('bg-combos');
        } else if (sectionId === 'bebidas') {
            heroBg.classList.add('bg-bebidas');
        }
    }
    
    // (Opcional) Atualiza o botão ativo no menu
    updateActiveButton(sectionId);
}

// (Função auxiliar opcional para marcar o botão do menu como ativo)
function updateActiveButton(activeId) {
    const buttons = document.querySelectorAll('.botoes a');
    buttons.forEach(btn => {
        btn.classList.remove('ativo');
        // Verifica se o onclick do botão contém o ID que estamos ativando
        if(btn.getAttribute('onclick').includes(activeId)) {
            btn.classList.add('ativo');
        }
    });
}

// --- FUNÇÃO CORRIGIDA PARA NOMES COM ESPAÇO ---
function atualizarPreco(nome) {
  // Garante que o ID use traços em vez de espaços
  const idNome = nome.replace(/\s/g, '-');
  
  const baseElement = document.getElementById('preco_' + idNome);
  if (!baseElement) return;

  let precoOriginal = baseElement.dataset.original;
  let total = parseFloat(precoOriginal);
  
  const adicionais = document.querySelectorAll(`input[name='adcional_${idNome}']:checked`);
  adicionais.forEach(adc => {
    total += parseFloat(adc.dataset.preco.replace(',', '.'));
  });

  baseElement.innerText = 'R$ ' + total.toFixed(2).replace('.', ',');
  
  // Se o item já está no carrinho, atualiza os dados dele (molhos/adicionais) imediatamente
  // Passando o nome ORIGINAL (pode ter espaços)
  // Recuperamos o nome original substituindo '-' por ' ' se necessário, 
  // mas o ideal é usar a chave do carrinho.
  // Como 'nome' aqui veio do ID (ex: Alladyn-Especial), vamos tentar achar no carrinho.
  
  let nomeNoCarrinho = nome;
  // Se não achar direto, tenta com espaços (reversão simples)
  if (!carrinho[nome] && carrinho[nome.replace(/-/g, ' ')]) {
      nomeNoCarrinho = nome.replace(/-/g, ' ');
  }

  if (carrinho[nomeNoCarrinho] && carrinho[nomeNoCarrinho].qtd > 0) {
      atualizarCarrinho(nomeNoCarrinho, 0); 
  }
}

// --- NOVA FUNÇÃO: Efeito Sanfona (Abrir/Fechar) ---
function toggleAccordion(headerElement) {
  // 1. Alterna a classe 'active' no cabeçalho (para girar a setinha)
  headerElement.classList.toggle('active');

  // 2. Pega o próximo elemento irmão (que é a div .accordion-content)
  const content = headerElement.nextElementSibling;

  // 3. Alterna a classe 'show' para mostrar ou esconder
  if (content.classList.contains('show')) {
    content.classList.remove('show');
  } else {
    content.classList.add('show');
  }
}

/* --- CONTROLE DE EXIBIÇÃO (MODO FOCADO + TECLADO) --- */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Verifica se existe o código "?origem=card" na URL
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('origem') === 'card') {
        // A. ESCONDE a barra de botões amarelos
        const barraBotoes = document.querySelector('.botoes');
        if (barraBotoes) {
            barraBotoes.style.display = 'none';
        }

        // B. CRIA o botão "Voltar" visual
        const container = document.querySelector('.container');
        const titulo = document.querySelector('.cardapio h2') || document.querySelector('.cardapio');
        
        const btnVoltar = document.createElement('a');
        btnVoltar.href = 'index.html';
        btnVoltar.innerHTML = '🔙 VOLTAR AO INÍCIO'; // Texto com Emoji
        btnVoltar.className = 'btn-voltar-foco';
        
        if (titulo && titulo.parentNode) {
            titulo.parentNode.insertBefore(btnVoltar, titulo);
        } else if (container) {
            container.prepend(btnVoltar);
        }

        // C. DETECTA AS TECLAS (ESC e BACKSPACE)
        document.addEventListener('keydown', (event) => {
            // Segurança: Se o usuário estiver digitando em um input (ex: endereço), o Backspace não deve voltar a página
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return; 
            }

            if (event.key === 'Escape' || event.key === 'Backspace') {
                event.preventDefault(); // Evita comportamento padrão do navegador
                window.location.href = 'index.html'; // Volta para a capa
            }
        });
    }
});