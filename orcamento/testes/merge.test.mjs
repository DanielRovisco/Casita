import { achatar, estampar, fundir, reconstruir, registosIniciais } from '../src/sync/registos.js'

let falhas = 0
const ok = (nome, cond, extra='') => { console.log((cond?'  ok  ':'FALHA ')+nome+(cond?'':' -> '+extra)); if(!cond) falhas++ }

const base = registosIniciais()
const e0 = reconstruir(base)
ok('arranque: 1 rendimento, 3 despesas', e0.daniel.rendimentos.length===1 && e0.daniel.despesas.length===3)
ok('arranque: casa 27660.58', e0.casa.saldo===27660.58, e0.casa.saldo)

// --- dois dispositivos, campos diferentes, ao mesmo tempo ---
const A1 = estampar(base, achatar({...e0, casa:{...e0.casa, saldo: 30000}}), 1000)
const B1 = estampar(base, achatar({...e0, carro:{...e0.carro, valor: 4000}}), 1001)
const M = fundir(A1, B1)
const eM = reconstruir(M)
ok('campos diferentes: ambos sobrevivem', eM.casa.saldo===30000 && eM.carro.valor===4000, `${eM.casa.saldo}/${eM.carro.valor}`)

// --- mesmo campo: vence o mais recente, e é comutativo ---
const A2 = estampar(base, achatar({...e0, casa:{...e0.casa, saldo: 111}}), 2000)
const B2 = estampar(base, achatar({...e0, casa:{...e0.casa, saldo: 222}}), 2001)
ok('mesmo campo: vence o mais recente', reconstruir(fundir(A2,B2)).casa.saldo===222)
ok('fusao comutativa', JSON.stringify(fundir(A2,B2))===JSON.stringify(fundir(B2,A2)))

// --- remocao num, edicao noutro ---
const semD1 = {...e0, daniel:{...e0.daniel, despesas: e0.daniel.despesas.filter(d=>d.id!=='d1')}}
const A3 = estampar(base, achatar(semD1), 3000)
const editaD3 = {...e0, daniel:{...e0.daniel, despesas: e0.daniel.despesas.map(d=>d.id==='d3'?{...d, valor: 999}:d)}}
const B3 = estampar(base, achatar(editaD3), 3001)
const e3 = reconstruir(fundir(A3,B3))
ok('remocao nao ressuscita', !e3.daniel.despesas.some(d=>d.id==='d1'), JSON.stringify(e3.daniel.despesas.map(d=>d.id)))
ok('edicao do outro sobrevive a remocao', e3.daniel.despesas.find(d=>d.id==='d3')?.valor===999)

// --- adicoes simultaneas de itens diferentes ---
const A4 = estampar(base, achatar({...e0, daniel:{...e0.daniel, rendimentos:[...e0.daniel.rendimentos,{id:'novoA',descricao:'Extra A',valor:50}]}}), 4000)
const B4 = estampar(base, achatar({...e0, daniel:{...e0.daniel, rendimentos:[...e0.daniel.rendimentos,{id:'novoB',descricao:'Extra B',valor:70}]}}), 4001)
const e4 = reconstruir(fundir(A4,B4))
ok('duas adicoes: aparecem as duas', e4.daniel.rendimentos.length===3, e4.daniel.rendimentos.map(r=>r.id).join(','))

// --- pessoas diferentes ao mesmo tempo ---
const A5 = estampar(base, achatar({...e0, daniel:{...e0.daniel, contaCorrente: 500}}), 5000)
const B5 = estampar(base, achatar({...e0, camila:{...e0.camila, contaCorrente: 300}}), 5000)
const e5 = reconstruir(fundir(A5,B5))
ok('Daniel e Camila em simultaneo', e5.daniel.contaCorrente===500 && e5.camila.contaCorrente===300)

// --- empate exato converge para o mesmo lado ---
const X = estampar(base, achatar({...e0, casa:{...e0.casa, saldo: 7}}), 6000)
const Y = estampar(base, achatar({...e0, casa:{...e0.casa, saldo: 8}}), 6000)
ok('empate converge', reconstruir(fundir(X,Y)).casa.saldo===reconstruir(fundir(Y,X)).casa.saldo)

// --- ordem preservada ---
ok('ordem das despesas mantida', reconstruir(fundir(A3,B3)).daniel.despesas.map(d=>d.id).join(',')==='d2,d3')

console.log(falhas===0 ? '\nTODOS OS TESTES PASSARAM' : `\n${falhas} FALHA(S)`)
process.exit(falhas?1:0)
