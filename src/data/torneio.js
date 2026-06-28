import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  CALENDARIO, CALENDARIO_ELIMINACAO, EQUIPAS_POR_GRUPO, TODAS_EQUIPAS,
  LIMITE_FASE_FINAL, LIMITE_GRUPOS, NOMES_AMIGOS
} from '../data/torneio.js'
import { Toast, useToast } from '../components/Toast.jsx'

// Calendário unificado: grupos + eliminatórias
const CALENDARIO_COMPLETO = (() => {
  const mapa = {}
  for (const dia of CALENDARIO) {
    mapa[dia.data] = { data: dia.data, jogos: [...dia.jogos] }
  }
  for (const dia of CALENDARIO_ELIMINACAO) {
    if (mapa[dia.data]) {
      mapa[dia.data].jogos.push(...dia.jogos)
    } else {
      mapa[dia.data] = { data: dia.data, jogos: [...dia.jogos] }
    }
  }
  // Ordenar por data
  const ordem = [...CALENDARIO.map(d => d.data), ...CALENDARIO_ELIMINACAO.map(d => d.data)]
  const unique = [...new Set(ordem)]
  return unique.map(d => mapa[d]).filter(Boolean)
})()

function prazoJogoUnificado(j) {
  const [h, m] = j.hora.split(':').map(Number)
  // Encontrar a data do jogo
  for (const dia of CALENDARIO_COMPLETO) {
    if (dia.jogos.find(jj => jj.id === j.id)) {
      const partes = dia.data.split(', ')[1].split('/')
      const d = parseInt(partes[0]), mo = parseInt(partes[1])
      const dtJogo = new Date(2026, mo - 1, d, h, m, 0)
      return new Date(dtJogo.getTime() - 2 * 60 * 60 * 1000)
    }
  }
  return null
}

function indiceDiaHojeCompleto() {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  for (let i = 0; i < CALENDARIO_COMPLETO.length; i++) {
    const partes = CALENDARIO_COMPLETO[i].data.split(', ')[1].split('/')
    const d = parseInt(partes[0]), m = parseInt(partes[1])
    const dataDia = new Date(2026, m - 1, d)
    dataDia.setHours(0, 0, 0, 0)
    if (dataDia >= hoje) return i
  }
  return CALENDARIO_COMPLETO.length - 1
}

function labelFase(id) {
  if (!id) return null
  if (id.startsWith('R32')) return '16avos de Final'
  if (id.startsWith('R16')) return 'Oitavos de Final'
  if (id.startsWith('QF'))  return 'Quartos de Final'
  if (id.startsWith('SF'))  return 'Meias-Finais'
  if (id === 'TP1')          return '3.º Lugar'
  if (id === 'FN1')          return 'Final'
  return null
}

function isElim(id) { return !!labelFase(id) }

const chavesGrupos = Object.keys(EQUIPAS_POR_GRUPO)
const PARES_GRUPOS = []
for (let i = 0; i < chavesGrupos.length; i += 2) {
  PARES_GRUPOS.push([chavesGrupos[i], chavesGrupos[i + 1]].filter(Boolean))
}

export default function Apostas({ jogador, isAdmin }) {
  const [subMenu, setSubMenu] = useState('jogos')
  const [diaIdx, setDiaIdx] = useState(indiceDiaHojeCompleto())
  const [parIdx, setParIdx] = useState(0)
  const [jogadorSel, setJogadorSel] = useState(jogador)
  const [scores, setScores] = useState({})        // { id: { casa, fora } }
  const [scoresElim, setScoresElim] = useState({}) // { id: { casa, fora, passa } }
  const [equipasElim, setEquipasElim] = useState({})
  const [valoresGrupos, setValoresGrupos] = useState({})
  const [campeao, setCampeao] = useState('')
  const [marcador, setMarcador] = useState('')
  const [palpitesTodos, setPalpitesTodos] = useState({})     // { id_jogo: { nome: {casa,fora} } }
  const [palpitesElimTodos, setPalpitesElimTodos] = useState({}) // { id_jogo: { nome: {casa,fora,passa} } }
  const [resultados, setResultados] = useState({})
  const [resultadosElim, setResultadosElim] = useState({})
  const [confirmacao, setConfirmacao] = useState(null)
  const [apostasCarregadas, setApostasCarregadas] = useState(false)
  const { toast, showToast } = useToast()
  const agora = new Date()
  const bloqFinal = agora >= LIMITE_FASE_FINAL && !isAdmin
  const bloqGrupos = agora >= LIMITE_GRUPOS && !isAdmin

  const dia = CALENDARIO_COMPLETO[diaIdx]

  useEffect(() => { carregarTudo() }, [jogadorSel])

  async function carregarTudo() {
    try {
      const [
        { data: jogosData },
        { data: elimData },
        { data: equipasData },
        { data: gruposData },
        { data: jData },
        { data: todosPalpites },
        { data: todosElim },
        { data: resDB },
        { data: resElimDB },
      ] = await Promise.all([
        supabase.from('palpites').select('id_jogo, casa, fora').eq('jogador', jogadorSel),
        supabase.from('palpites_eliminacao').select('id_jogo, casa, fora, passa').eq('jogador', jogadorSel),
        supabase.from('equipas_eliminacao').select('id_jogo, casa, fora'),
        supabase.from('palpites_grupos').select('grupo, primeiro, segundo').eq('jogador', jogadorSel),
        supabase.from('jogadores').select('campeao, marcador').eq('nome', jogadorSel).single(),
        supabase.from('palpites').select('jogador, id_jogo, casa, fora'),
        supabase.from('palpites_eliminacao').select('jogador, id_jogo, casa, fora, passa'),
        supabase.from('resultados').select('id_jogo, casa, fora'),
        supabase.from('resultados_eliminacao').select('id_jogo, casa, fora, passa'),
      ])

      const jogosMap = {}
      if (jogosData) jogosData.forEach(j => {
        jogosMap[j.id_jogo] = { casa: j.casa !== null ? Number(j.casa) : null, fora: j.fora !== null ? Number(j.fora) : null }
      })
      setScores(jogosMap)

      const elimMap = {}
      if (elimData) elimData.forEach(e => { elimMap[e.id_jogo] = { casa: e.casa, fora: e.fora, passa: e.passa || null } })
      setScoresElim(elimMap)

      const equipasMap = {}
      if (equipasData) equipasData.forEach(e => { equipasMap[e.id_jogo] = { casa: e.casa, fora: e.fora } })
      setEquipasElim(equipasMap)

      const gruposMap = {}
      if (gruposData) gruposData.forEach(g => { gruposMap[g.grupo] = { primeiro: g.primeiro, segundo: g.segundo } })
      setValoresGrupos(gruposMap)

      setCampeao(jData?.campeao || '')
      setMarcador(jData?.marcador || '')

      const mpTodos = {}
      if (todosPalpites) todosPalpites.forEach(p => {
        if (!mpTodos[p.id_jogo]) mpTodos[p.id_jogo] = {}
        mpTodos[p.id_jogo][p.jogador] = { casa: p.casa, fora: p.fora }
      })
      setPalpitesTodos(mpTodos)

      const mpElimTodos = {}
      if (todosElim) todosElim.forEach(p => {
        if (!mpElimTodos[p.id_jogo]) mpElimTodos[p.id_jogo] = {}
        mpElimTodos[p.id_jogo][p.jogador] = { casa: p.casa, fora: p.fora, passa: p.passa }
      })
      setPalpitesElimTodos(mpElimTodos)

      const resMap = {}
      if (resDB) resDB.forEach(r => { resMap[r.id_jogo] = { casa: r.casa, fora: r.fora } })
      setResultados(resMap)

      const resElimMap = {}
      if (resElimDB) resElimDB.forEach(r => { resElimMap[r.id_jogo] = { casa: r.casa, fora: r.fora, passa: r.passa } })
      setResultadosElim(resElimMap)

      setApostasCarregadas(true)
    } catch (err) { console.error(err) }
  }

  function pedirConfirmacaoJogos() {
    const linhas = []
    let temVazio = false
    for (const j of dia.jogos) {
      const prazo = prazoJogoUnificado(j)
      if (prazo && agora >= prazo && !isAdmin) continue
      if (isElim(j.id)) {
        const a = scoresElim[j.id] || {}
        if (a.casa === null || a.casa === undefined) { temVazio = true; break }
        const eq = equipasElim[j.id]
        const nc = eq?.casa || 'Casa'
        const nf = eq?.fora || 'Fora'
        linhas.push(`${nc} ${a.casa} — ${a.fora} ${nf}${a.passa ? ` → ${a.passa}` : ''}`)
      } else {
        const s = scores[j.id] || {}
        if (s.casa === null || s.casa === undefined) { temVazio = true; break }
        linhas.push(`${j.casa} ${s.casa} — ${s.fora} ${j.fora}`)
      }
    }
    if (temVazio) { showToast('❌ Mete um resultado válido, pá!'); return }
    if (linhas.length === 0) { showToast('ℹ️ Não há jogos para guardar.'); return }
    setConfirmacao({ tipo: 'jogos', linhas })
  }

  function pedirConfirmacaoGrupo() {
    const ativos = PARES_GRUPOS[parIdx] || []
    const linhas = []
    let tem = false
    for (const g of ativos) {
      const p1 = valoresGrupos[g]?.primeiro, p2 = valoresGrupos[g]?.segundo
      if (p1 || p2) tem = true
      linhas.push(`${g}: 🥇 ${p1 || '—'} · 🥈 ${p2 || '—'}`)
    }
    if (!tem) { showToast('❌ Escolhe pelo menos um lugar!'); return }
    setConfirmacao({ tipo: 'grupo', linhas, gruposAlvo: ativos })
  }

  function pedirConfirmacaoFinal() {
    setConfirmacao({ tipo: 'final', linhas: [`🏆 Campeão: ${campeao || '—'}`, `⚽ Marcador: ${marcador || '—'}`] })
  }

  async function confirmarGuardar() {
    const tipo = confirmacao.tipo
    setConfirmacao(null)

    if (tipo === 'jogos') {
      for (const j of dia.jogos) {
        const prazo = prazoJogoUnificado(j)
        if (prazo && agora >= prazo && !isAdmin) continue
        if (isElim(j.id)) {
          const a = scoresElim[j.id]
          if (!a || a.casa === null || a.casa === undefined) continue
          await supabase.from('palpites_eliminacao').upsert(
            { jogador: jogadorSel, id_jogo: j.id, casa: Number(a.casa), fora: Number(a.fora), passa: a.passa || null },
            { onConflict: 'jogador,id_jogo' }
          )
        } else {
          const s = scores[j.id]
          if (!s || s.casa === null || s.casa === undefined) continue
          await supabase.from('palpites').upsert(
            { jogador: jogadorSel, id_jogo: j.id, casa: Number(s.casa), fora: Number(s.fora) },
            { onConflict: 'jogador,id_jogo' }
          )
        }
      }
      showToast(`✅ Jogos de ${dia.data} guardados!`)
    }

    if (tipo === 'grupo') {
      for (const g of (confirmacao.gruposAlvo || [])) {
        await supabase.from('palpites_grupos').upsert(
          { jogador: jogadorSel, grupo: g, primeiro: valoresGrupos[g]?.primeiro || null, segundo: valoresGrupos[g]?.segundo || null },
          { onConflict: 'jogador,grupo' }
        )
      }
      showToast('✅ Grupos guardados!')
    }

    if (tipo === 'final') {
      await supabase.from('jogadores').upsert(
        { nome: jogadorSel, campeao: campeao || null, marcador: marcador || null },
        { onConflict: 'nome' }
      )
      showToast('✅ Fase final guardada!')
    }
  }

  function formatarTempo(ms) {
    if (ms <= 0) return null
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000)
    if (h > 48) return null
    if (h >= 24) return `${Math.floor(h/24)}d ${h%24}h`
    if (h > 0) return `${h}h ${m}min`
    return `${m} min`
  }

  function alertaPrazo() {
    for (const j of dia.jogos) {
      const prazo = prazoJogoUnificado(j)
      if (!prazo) continue
      const diff = prazo - agora
      if (diff <= 0) continue
      const tempo = formatarTempo(diff)
      if (!tempo) continue
      const nome = isElim(j.id) ? (equipasElim[j.id]?.casa || j.id) + ' vs ' + (equipasElim[j.id]?.fora || '') : `${j.casa} vs ${j.fora}`
      if (diff < 60 * 60 * 1000) return { tipo: 'urgente', msg: `⚠️ Prazo fecha em ${tempo} — ${nome}` }
      if (diff < 48 * 60 * 60 * 1000) return { tipo: 'info', msg: `⏱ ${tempo} para fechar — ${nome}` }
    }
    return null
  }

  function pontosAposta(id, p, r) {
    if (!r || r.casa === null || r.fora === null) return null
    const pc = Number(p.casa), pf = Number(p.fora), rc = Number(r.casa), rf = Number(r.fora)
    if (pc === rc && pf === rf) return 3
    if ((pc > pf && rc > rf) || (pc < pf && rc < rf) || (pc === pf && rc === rf)) return 1
    return 0
  }

  const alerta = alertaPrazo()

 
