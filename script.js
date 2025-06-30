const STARTING_AMOUNT = 6976.13;
const GOAL = 25000;
const MONTHLY_GOAL = 1386.44;
const START_DATE = new Date("2025-05-01");

const monthLabels = [];
const deposits = [];

// Inicializa monthLabels e deposits
for (let i = 0; i < 14; i++) {
  const date = new Date(START_DATE);
  date.setMonth(date.getMonth() + i);
  monthLabels.push(date.toLocaleString("pt-PT", { month: "long", year: "numeric" }));
  deposits.push({ daniel: 0, camila: 0 });
}

// Função para carregar dados do localStorage
function loadFromLocalStorage() {
  const saved = localStorage.getItem('poupancaDeposits');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === deposits.length) {
        for (let i = 0; i < deposits.length; i++) {
          deposits[i].daniel = parsed[i].daniel || 0;
          deposits[i].camila = parsed[i].camila || 0;
        }
      }
    } catch (e) {
      console.warn("Erro a carregar dados do localStorage:", e);
    }
  }
}

// Função para guardar dados no localStorage
function saveToLocalStorage() {
  localStorage.setItem('poupancaDeposits', JSON.stringify(deposits));
}

const tabela = document.getElementById("tabela");

function renderTable() {
  tabela.innerHTML = "";
  let acumulado = STARTING_AMOUNT;

  deposits.forEach((dep, i) => {
    const totalMes = dep.daniel + dep.camila;
    acumulado += totalMes;

    const estado = totalMes === 0 ? "Por preencher" :
                   totalMes < MONTHLY_GOAL ? "Atrasado" :
                   totalMes === MONTHLY_GOAL ? "No ponto" : "Adiantado";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${monthLabels[i]}</td>
      <td><input type="number" value="${dep.daniel}" onchange="updateValue(${i}, 'daniel', this.value)"/></td>
      <td><input type="number" value="${dep.camila}" onchange="updateValue(${i}, 'camila', this.value)"/></td>
      <td>€${totalMes.toFixed(2)}</td>
      <td>€${acumulado.toFixed(2)}</td>
      <td>${estado}</td>
    `;
    tabela.appendChild(row);
  });

  updateSummary();
}

function updateValue(index, person, value) {
  deposits[index][person] = parseFloat(value) || 0;
  saveToLocalStorage();  // Guarda sempre que atualizar
  renderTable();
}

function updateSummary() {
  const total = deposits.reduce((sum, d) => sum + d.daniel + d.camila, STARTING_AMOUNT);
  const progresso = Math.min((total / GOAL) * 100, 100);
  const restante = GOAL - total;
  const mesesRestantes = 14 - deposits.filter(d => d.daniel + d.camila > 0).length;
  const minimo = restante > 0 && mesesRestantes > 0 ? (restante / mesesRestantes) : 0;
  const previsao = total + mesesRestantes * MONTHLY_GOAL;

  document.getElementById("totalAcumulado").textContent = total.toFixed(2);
  document.getElementById("progressFill").style.width = `${progresso}%`;
  document.getElementById("progresso").textContent = progresso.toFixed(1) + "%";
  document.getElementById("minDeposito").textContent = minimo.toFixed(2);
  document.getElementById("previsaoFinal").textContent = previsao.toFixed(2);
}

// Carrega dados do localStorage antes de renderizar
loadFromLocalStorage();
renderTable();
