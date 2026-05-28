// ===================================================================
// 1. BANCO DE DADOS EM MEMÓRIA (Separado por Datas)
// ===================================================================
const agendaPorData = {};

const listaHorariosPadrao = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", // Almoço
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", 
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"
];

function gerarAgendaNovaParaData(data) {
    return listaHorariosPadrao.map(hora => {
        if (hora === "12:00" || hora === "12:30") {
            return { hora: hora, livre: false, cliente: "ALMOÇO" };
        }
        const simulandoOcupado = Math.random() < 0.15;
        if (simulandoOcupado) {
            const clientesFake = ["Gabriel M.", "Bruno S.", "Felipe R.", "Davi L."];
            return { hora: hora, livre: false, cliente: clientesFake[Math.floor(Math.random() * clientesFake.length)] };
        }
        return { hora: hora, livre: true, cliente: null };
    });
}

let horarioSelecionado = null;
let dataAtualSelecionada = null; // Guardará a data atual no formato YYYY-MM-DD

// ===================================================================
// 2. REFERÊNCIAS DO ELEMENTOS NA TELA (DOM)
// ===================================================================
const inputDataElement = document.getElementById('input-data');
const gridHorarios = document.getElementById('grid-horarios');

// Elementos Modal Reserva
const modalReserva = document.getElementById('modal-reserva');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const textoHorarioSelecionado = document.getElementById('texto-horario-selecionado');
const formReserva = document.getElementById('form-reserva');
const inputNome = document.getElementById('nome-cliente');
const inputServico = document.getElementById('servico-escolhido');

// Elementos Modal Sucesso
const modalSucesso = document.getElementById('modal-sucesso');
const btnFecharSucesso = document.getElementById('btn-fechar-sucesso');
const textoSucesso = document.getElementById('texto-sucesso');

// ===================================================================
// 3. INICIALIZAÇÃO DO CALENDÁRIO FLATPICKR
// ===================================================================
window.addEventListener('DOMContentLoaded', () => {
    
    // Inicia o Flatpickr no input
    flatpickr(inputDataElement, {
        locale: "pt", // Tradução
        theme: "dark", // Tema base
        defaultDate: "today",
        minDate: "today",
        dateFormat: "Y-m-d", // Formato interno de cálculo
        altInput: true,      // Mostra um formato bonito pro usuário
        altFormat: "d \\de F, Y", // Ex: 28 de Maio, 2026
        disableMobile: true, // Força usar o flatpickr no mobile também
        onChange: function(selectedDates, dateStr, instance) {
            dataAtualSelecionada = dateStr;
            renderizarAgenda();
        }
    });

    // Força a renderização do dia de hoje no primeiro carregamento
    dataAtualSelecionada = new Date().toISOString().split('T')[0];
    renderizarAgenda();
});


// ===================================================================
// 4. LÓGICA DE MODAIS
// ===================================================================

// Fechar Reserva
btnFecharModal.addEventListener('click', fecharModalReserva);
modalReserva.addEventListener('click', (e) => {
    if (e.target === modalReserva) fecharModalReserva();
});

// Fechar Sucesso
btnFecharSucesso.addEventListener('click', fecharModalSucesso);
modalSucesso.addEventListener('click', (e) => {
    if (e.target === modalSucesso) fecharModalSucesso();
});

function abrirModalReserva(hora) {
    horarioSelecionado = hora;
    textoHorarioSelecionado.textContent = hora;
    modalReserva.classList.remove('hidden');
    inputNome.focus();
}

function fecharModalReserva() {
    modalReserva.classList.add('hidden');
    formReserva.reset();
    horarioSelecionado = null;
}

function abrirModalSucesso(nome, servico, data, hora) {
    // Formata a data de YYYY-MM-DD para DD/MM/YYYY
    const dataFormatada = data.split('-').reverse().join('/');
    
    textoSucesso.innerHTML = `
        Agendamento de <strong>${servico}</strong> para <strong>${nome}</strong>.<br><br>
        Data: <strong>${dataFormatada}</strong> às <strong>${hora}</strong>.<br>
        Te esperamos na barbearia!
    `;
    modalSucesso.classList.remove('hidden');
}

function fecharModalSucesso() {
    modalSucesso.classList.add('hidden');
}

// ===================================================================
// 5. FUNÇÕES DE RENDERIZAÇÃO E NEGÓCIO
// ===================================================================

function renderizarAgenda() {
    gridHorarios.innerHTML = '';

    if (!agendaPorData[dataAtualSelecionada]) {
        agendaPorData[dataAtualSelecionada] = gerarAgendaNovaParaData(dataAtualSelecionada);
    }

    const horariosDoDia = agendaPorData[dataAtualSelecionada];

    horariosDoDia.forEach(slot => {
        const divCard = document.createElement('div');
        divCard.className = `card-horario ${slot.livre ? 'livre' : 'ocupado'}`;
        
        const spanHora = document.createElement('span');
        spanHora.className = 'hora';
        spanHora.textContent = slot.hora;
        
        const spanStatus = document.createElement('span');
        spanStatus.className = 'status';
        spanStatus.textContent = slot.livre ? 'Disponível' : slot.cliente;

        divCard.appendChild(spanHora);
        divCard.appendChild(spanStatus);

        if (slot.livre) {
            divCard.addEventListener('click', () => abrirModalReserva(slot.hora));
        }

        gridHorarios.appendChild(divCard);
    });
}

// Submissão do Formulário
formReserva.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = inputNome.value.trim();
    const servico = inputServico.value;

    if (!nome || !servico) {
        return;
    }

    const agendaDoDia = agendaPorData[dataAtualSelecionada];
    const slotIndex = agendaDoDia.findIndex(s => s.hora === horarioSelecionado);
    
    if (slotIndex !== -1) {
        agendaDoDia[slotIndex].livre = false;
        
        const partesNome = nome.split(' ');
        const nomeCurto = partesNome.length > 1 
            ? `${partesNome[0]} ${partesNome[partesNome.length-1].charAt(0)}.` 
            : partesNome[0];

        agendaDoDia[slotIndex].cliente = nomeCurto;
    }
    
    // Armazena os dados para o modal de sucesso antes de limpar
    const horaSucesso = horarioSelecionado;
    
    // Atualiza a tela e abre os modais
    renderizarAgenda();
    fecharModalReserva();
    abrirModalSucesso(nome, servico, dataAtualSelecionada, horaSucesso);
});