import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as d3 from "d3";
import dagre from "dagre";

// ─── EXPRESSION TREE DEFINITIONS ─────────────────────────────
// { op, children } | { v: "varId" } | { lit: "label" }
const T = {
  op: (op, ...ch) => ({ op, children: ch }),
  v: (id) => ({ v: id }),
  lit: (label) => ({ lit: label }),
  sq: (ch) => ({ op: "²", children: [ch] }),
  sqrt: (ch) => ({ op: "√", children: [ch] }),
  sin: (ch) => ({ op: "sin", children: [ch] }),
  cos: (ch) => ({ op: "cos", children: [ch] }),
};

const exprTrees = {
  f1: T.op("=", T.v("F"), T.op("×", T.v("m"), T.v("a"))),
  f2: T.op("=", T.v("E"), T.v("m")),
  f3: T.op("=", T.sq(T.v("v")), T.op("+", T.sq(T.v("u")), T.op("×", T.lit("2"), T.v("a"), T.v("s")))),
  f4: T.op("=", T.v("F"), T.op("÷", T.sq(T.v("m")), T.sq(T.v("r")))),
  f5: T.op("=", T.v("KE"), T.op("×", T.lit("½"), T.v("m"), T.sq(T.v("v")))),
  f6: T.op("=", T.v("W"), T.op("×", T.v("F"), T.v("d"), T.cos(T.v("θ")))),
  f7: T.op("=", T.v("V"), T.op("×", T.v("I"), T.v("R"))),
  f8: T.op("=", T.v("F"), T.op("÷", T.sq(T.v("q")), T.sq(T.v("r")))),
  f9: T.op("=", T.v("v"), T.op("×", T.v("f_w"), T.v("λ"))),
  f10: T.op("=", T.op("×", T.lit("Ĥ"), T.v("ψ")), T.op("×", T.v("E"), T.v("ψ"))),
  f11: T.op("=", T.v("F"), T.op("÷", T.op("×", T.v("m"), T.sq(T.v("v"))), T.v("r"))),
  f12: T.op("=", T.v("U"), T.op("×", T.v("m"), T.v("h"))),
  f13: T.op("=", T.v("F"), T.v("x")),
  f14: T.op("=", T.v("τ"), T.op("×", T.v("r"), T.v("F"), T.sin(T.v("θ")))),
  f15: T.op("=", T.v("T"), T.op("×", T.lit("2π"), T.sqrt(T.v("l")))),
  f16: T.op("=", T.v("v"), T.sqrt(T.op("×", T.lit("2"), T.op("÷", T.v("m"), T.v("r"))))),
  f17: T.op("=", T.v("E"), T.v("f_w")),
  f18: T.op("=", T.v("E"), T.op("÷", T.lit("1"), T.v("λ"))),
  f19: T.op("=", T.lit("Δt'"), T.op("÷", T.v("Δt"), T.sqrt(T.op("−", T.lit("1"), T.sq(T.v("v")))))),
  f20: T.op("=", T.sq(T.v("E")), T.op("+", T.sq(T.v("p")), T.sq(T.v("m")))),
  f21: T.op("=", T.v("L"), T.sqrt(T.op("−", T.lit("1"), T.sq(T.v("v"))))),
  f22: T.op("=", T.v("λ"), T.op("÷", T.lit("1"), T.v("p"))),
};

// ─── TREE LAYOUT ─────────────────────────────────────────────
function layoutTree(node, depth = 0) {
  node._depth = depth;
  if (node.v != null || node.lit != null) {
    node._width = 1;
    node._leaves = [node];
    return node;
  }
  node.children.forEach(c => layoutTree(c, depth + 1));
  node._width = Math.max(node.children.reduce((s, c) => s + c._width, 0), 1);
  node._leaves = node.children.flatMap(c => c._leaves || [c]);
  return node;
}

function positionTree(node, x, y, hGap, vGap) {
  node._x = x;
  node._y = y;
  if (!node.children) return;
  let cx = x - (node._width * hGap) / 2;
  for (const child of node.children) {
    const childX = cx + (child._width * hGap) / 2;
    positionTree(child, childX, y + vGap, hGap, vGap);
    cx += child._width * hGap;
  }
}

function treeDepth(node) {
  if (!node.children || node.children.length === 0) return 0;
  return 1 + Math.max(...node.children.map(treeDepth));
}

function collectNodes(node, list = []) {
  list.push(node);
  if (node.children) node.children.forEach(c => collectNodes(c, list));
  return list;
}

function collectEdges(node, list = []) {
  if (node.children) node.children.forEach(c => {
    list.push({ from: node, to: c });
    collectEdges(c, list);
  });
  return list;
}

// ─── FORMULA DATA ────────────────────────────────────────────
const formulaNodes = [
  { id: "f1", name: "Newton's 2nd Law", glow: "#3b82f6", variables: ["F", "m", "a"], constants: [], natExpr: "F = m·a", summary: "Force equals mass times acceleration." },
  { id: "f2", name: "Mass-Energy", glow: "#ef4444", variables: ["E", "m"], constants: ["c"], natExpr: "E = m", summary: "With c=1, energy equals mass directly." },
  { id: "f3", name: "Kinematics", glow: "#10b981", variables: ["v", "u", "a", "s"], constants: [], natExpr: "v² = u² + 2·a·s", summary: "Final velocity from initial velocity, acceleration, displacement." },
  { id: "f4", name: "Gravitation", glow: "#f59e0b", variables: ["F", "m", "r"], constants: ["G"], natExpr: "F = m²/r²", summary: "With G=1, gravitational force from mass and distance." },
  { id: "f5", name: "Kinetic Energy", glow: "#8b5cf6", variables: ["KE", "m", "v"], constants: [], natExpr: "KE = ½·m·v²", summary: "Energy of motion." },
  { id: "f6", name: "Work", glow: "#ec4899", variables: ["W", "F", "d", "θ"], constants: [], natExpr: "W = F·d·cos(θ)", summary: "Energy transferred by force over distance." },
  { id: "f7", name: "Ohm's Law", glow: "#06b6d4", variables: ["V", "I", "R"], constants: [], natExpr: "V = I·R", summary: "Voltage equals current times resistance." },
  { id: "f8", name: "Coulomb's Law", glow: "#f97316", variables: ["F", "q", "r"], constants: ["k_c"], natExpr: "F = q²/r²", summary: "With k=1, electric force from charge and distance." },
  { id: "f9", name: "Wave Equation", glow: "#14b8a6", variables: ["v", "f_w", "λ"], constants: [], natExpr: "v = f·λ", summary: "Wave speed = frequency × wavelength." },
  { id: "f10", name: "Schrödinger", glow: "#a855f7", variables: ["E", "ψ"], constants: ["Ĥ"], natExpr: "Ĥψ = Eψ", summary: "Operator equation." },
  { id: "f11", name: "Centripetal Force", glow: "#f43f5e", variables: ["F", "m", "v", "r"], constants: [], natExpr: "F = m·v²/r", summary: "Inward force for circular motion." },
  { id: "f12", name: "Gravitational PE", glow: "#84cc16", variables: ["U", "m", "h"], constants: ["g"], natExpr: "U = m·h", summary: "With g=1, PE = mass × height." },
  { id: "f13", name: "Hooke's Law", glow: "#22d3ee", variables: ["F", "x"], constants: ["kₛ"], natExpr: "F = x", summary: "With kₛ=1, force = displacement." },
  { id: "f14", name: "Torque", glow: "#e879f9", variables: ["τ", "r", "F", "θ"], constants: [], natExpr: "τ = r·F·sin(θ)", summary: "Rotational force." },
  { id: "f15", name: "Pendulum Period", glow: "#fbbf24", variables: ["T", "l"], constants: ["g"], natExpr: "T = 2π·√l", summary: "With g=1, period from length." },
  { id: "f16", name: "Escape Velocity", glow: "#fb923c", variables: ["v", "m", "r"], constants: ["G"], natExpr: "v = √(2·m/r)", summary: "With G=1, escape speed." },
  { id: "f17", name: "Photon Energy", glow: "#c084fc", variables: ["E", "f_w"], constants: ["h_p"], natExpr: "E = f", summary: "With h=1, energy = frequency." },
  { id: "f18", name: "Planck-Einstein", glow: "#fb7185", variables: ["E", "λ"], constants: ["h_p", "c"], natExpr: "E = 1/λ", summary: "With h=c=1, energy = 1/wavelength." },
  { id: "f19", name: "Time Dilation", glow: "#38bdf8", variables: ["Δt", "v"], constants: ["c"], natExpr: "Δt'= Δt/√(1−v²)", summary: "With c=1, time dilation." },
  { id: "f20", name: "Energy-Momentum", glow: "#f472b6", variables: ["E", "p", "m"], constants: ["c"], natExpr: "E² = p² + m²", summary: "With c=1, relativistic energy." },
  { id: "f21", name: "Lorentz Contraction", glow: "#818cf8", variables: ["L", "v"], constants: ["c"], natExpr: "L = √(1−v²)", summary: "With c=1, length contraction." },
  { id: "f22", name: "de Broglie", glow: "#34d399", variables: ["λ", "p"], constants: ["h_p"], natExpr: "λ = 1/p", summary: "With h=1, wavelength = 1/momentum." },
];

const varDefs = {
  F: { label: "F", desc: "Force" }, m: { label: "m", desc: "Mass" }, a: { label: "a", desc: "Acceleration" },
  E: { label: "E", desc: "Energy" }, v: { label: "v", desc: "Velocity" }, u: { label: "u", desc: "Initial vel." },
  s: { label: "s", desc: "Displacement" }, r: { label: "r", desc: "Radius" },
  KE: { label: "KE", desc: "Kinetic energy" }, W: { label: "W", desc: "Work" }, d: { label: "d", desc: "Distance" },
  θ: { label: "θ", desc: "Angle (rad)" }, V: { label: "V", desc: "Voltage" }, I: { label: "I", desc: "Current" },
  R: { label: "R", desc: "Resistance" }, q: { label: "q", desc: "Charge" }, f_w: { label: "f", desc: "Frequency" },
  λ: { label: "λ", desc: "Wavelength" }, ψ: { label: "ψ", desc: "Wave fn" }, U: { label: "U", desc: "Potential E" },
  h: { label: "h", desc: "Height" }, x: { label: "x", desc: "Displacement" }, τ: { label: "τ", desc: "Torque" },
  T: { label: "T", desc: "Period" }, l: { label: "l", desc: "Length" }, p: { label: "p", desc: "Momentum" },
  Δt: { label: "Δt", desc: "Time interval" }, L: { label: "L", desc: "Contracted len" },
};

const constDefs = {
  c: { label: "c", desc: "Speed of light" }, G: { label: "G", desc: "Gravitational constant" },
  k_c: { label: "k", desc: "Coulomb constant" }, h_p: { label: "h", desc: "Planck's constant" },
  g: { label: "g", desc: "Gravitational accel." }, kₛ: { label: "kₛ", desc: "Spring constant" },
  Ĥ: { label: "Ĥ", desc: "Hamiltonian operator" },
};

const ALL_VAR_IDS = [...new Set(formulaNodes.flatMap(f => f.variables))];
function defaultValues() { const v = {}; ALL_VAR_IDS.forEach(id => { v[id] = 1; }); return v; }

// ─── SOLVERS ─────────────────────────────────────────────────
const solvers = {
  f1(v) { if (v.F == null && v.m != null && v.a != null) return { F: v.m * v.a }; if (v.m == null && v.F != null && v.a != null) return { m: v.F / v.a }; if (v.a == null && v.F != null && v.m != null) return { a: v.F / v.m }; return {} },
  f2(v) { if (v.E == null && v.m != null) return { E: v.m }; if (v.m == null && v.E != null) return { m: v.E }; return {} },
  f3(v) { const u = ["v", "u", "a", "s"].filter(k => v[k] == null); if (u.length !== 1) return {}; if (u[0] === "v") { const r = v.u ** 2 + 2 * v.a * v.s; return r >= 0 ? { v: Math.sqrt(r) } : {} } if (u[0] === "u") { const r = v.v ** 2 - 2 * v.a * v.s; return r >= 0 ? { u: Math.sqrt(r) } : {} } if (u[0] === "a") return { a: (v.v ** 2 - v.u ** 2) / (2 * v.s) }; if (u[0] === "s") return { s: (v.v ** 2 - v.u ** 2) / (2 * v.a) }; return {} },
  f4(v) { if (v.F == null && v.m != null && v.r != null) return { F: v.m ** 2 / v.r ** 2 }; if (v.m == null && v.F != null && v.r != null) { const r = v.F * v.r ** 2; return r >= 0 ? { m: Math.sqrt(r) } : {} } if (v.r == null && v.F != null && v.m != null) { const r = v.m ** 2 / v.F; return r >= 0 ? { r: Math.sqrt(r) } : {} } return {} },
  f5(v) { if (v.KE == null && v.m != null && v.v != null) return { KE: .5 * v.m * v.v ** 2 }; if (v.m == null && v.KE != null && v.v != null) return { m: 2 * v.KE / v.v ** 2 }; if (v.v == null && v.KE != null && v.m != null) { const r = 2 * v.KE / v.m; return r >= 0 ? { v: Math.sqrt(r) } : {} } return {} },
  f6(v) { const u = ["W", "F", "d", "θ"].filter(k => v[k] == null); if (u.length !== 1) return {}; if (u[0] === "W") return { W: v.F * v.d * Math.cos(v.θ) }; if (u[0] === "F") return { F: v.W / (v.d * Math.cos(v.θ)) }; if (u[0] === "d") return { d: v.W / (v.F * Math.cos(v.θ)) }; if (u[0] === "θ") { const r = v.W / (v.F * v.d); return Math.abs(r) <= 1 ? { θ: Math.acos(r) } : {} } return {} },
  f7(v) { if (v.V == null && v.I != null && v.R != null) return { V: v.I * v.R }; if (v.I == null && v.V != null && v.R != null) return { I: v.V / v.R }; if (v.R == null && v.V != null && v.I != null) return { R: v.V / v.I }; return {} },
  f8(v) { if (v.F == null && v.q != null && v.r != null) return { F: v.q ** 2 / v.r ** 2 }; if (v.q == null && v.F != null && v.r != null) { const r = v.F * v.r ** 2; return r >= 0 ? { q: Math.sqrt(r) } : {} } if (v.r == null && v.F != null && v.q != null) { const r = v.q ** 2 / v.F; return r >= 0 ? { r: Math.sqrt(r) } : {} } return {} },
  f9(v) { if (v.v == null && v.f_w != null && v.λ != null) return { v: v.f_w * v.λ }; if (v.f_w == null && v.v != null && v.λ != null) return { f_w: v.v / v.λ }; if (v.λ == null && v.v != null && v.f_w != null) return { λ: v.v / v.f_w }; return {} },
  f11(v) { const u = ["F", "m", "v", "r"].filter(k => v[k] == null); if (u.length !== 1) return {}; if (u[0] === "F") return { F: v.m * v.v ** 2 / v.r }; if (u[0] === "m") return { m: v.F * v.r / v.v ** 2 }; if (u[0] === "v") { const r = v.F * v.r / v.m; return r >= 0 ? { v: Math.sqrt(r) } : {} } if (u[0] === "r") return { r: v.m * v.v ** 2 / v.F }; return {} },
  f12(v) { if (v.U == null && v.m != null && v.h != null) return { U: v.m * v.h }; if (v.m == null && v.U != null && v.h != null) return { m: v.U / v.h }; if (v.h == null && v.U != null && v.m != null) return { h: v.U / v.m }; return {} },
  f13(v) { if (v.F == null && v.x != null) return { F: v.x }; if (v.x == null && v.F != null) return { x: v.F }; return {} },
  f14(v) { const u = ["τ", "r", "F", "θ"].filter(k => v[k] == null); if (u.length !== 1) return {}; if (u[0] === "τ") return { τ: v.r * v.F * Math.sin(v.θ) }; if (u[0] === "r") return { r: v.τ / (v.F * Math.sin(v.θ)) }; if (u[0] === "F") return { F: v.τ / (v.r * Math.sin(v.θ)) }; if (u[0] === "θ") { const r = v.τ / (v.r * v.F); return Math.abs(r) <= 1 ? { θ: Math.asin(r) } : {} } return {} },
  f15(v) { if (v.T == null && v.l != null) return { T: 2 * Math.PI * Math.sqrt(Math.abs(v.l)) }; if (v.l == null && v.T != null) return { l: (v.T / (2 * Math.PI)) ** 2 }; return {} },
  f16(v) { if (v.v == null && v.m != null && v.r != null) { const r = 2 * v.m / v.r; return r >= 0 ? { v: Math.sqrt(r) } : {} } if (v.m == null && v.v != null && v.r != null) return { m: v.v ** 2 * v.r / 2 }; if (v.r == null && v.v != null && v.m != null) return { r: 2 * v.m / v.v ** 2 }; return {} },
  f17(v) { if (v.E == null && v.f_w != null) return { E: v.f_w }; if (v.f_w == null && v.E != null) return { f_w: v.E }; return {} },
  f18(v) { if (v.E == null && v.λ != null && v.λ !== 0) return { E: 1 / v.λ }; if (v.λ == null && v.E != null && v.E !== 0) return { λ: 1 / v.E }; return {} },
  f20(v) { if (v.E == null && v.p != null && v.m != null) return { E: Math.sqrt(v.p ** 2 + v.m ** 2) }; if (v.p == null && v.E != null && v.m != null) { const r = v.E ** 2 - v.m ** 2; return r >= 0 ? { p: Math.sqrt(r) } : {} } if (v.m == null && v.E != null && v.p != null) { const r = v.E ** 2 - v.p ** 2; return r >= 0 ? { m: Math.sqrt(r) } : {} } return {} },
  f21(v) { if (v.L == null && v.v != null) { const r = 1 - v.v ** 2; return r >= 0 ? { L: Math.sqrt(r) } : {} } if (v.v == null && v.L != null) { const r = 1 - v.L ** 2; return r >= 0 ? { v: Math.sqrt(r) } : {} } return {} },
  f22(v) { if (v.λ == null && v.p != null && v.p !== 0) return { λ: 1 / v.p }; if (v.p == null && v.λ != null && v.λ !== 0) return { p: 1 / v.λ }; return {} },
};

function propagate(uv) { const vals = { ...uv }; const sources = {}; Object.keys(uv).forEach(k => { if (uv[k] != null) sources[k] = "user" }); let ch = true, it = 0; while (ch && it < 50) { ch = false; it++; for (const f of formulaNodes) { const solver = solvers[f.id]; if (!solver) continue; const fv = {}; for (const vid of f.variables) { if (vals[vid] != null) fv[vid] = vals[vid] } const res = solver(fv); for (const [k, val] of Object.entries(res)) { if (vals[k] == null && val != null && isFinite(val)) { vals[k] = val; sources[k] = f.id; ch = true } } } } return { values: vals, sources } }

function fmt(v) { if (v == null) return ""; if (!isFinite(v)) return "∞"; if (Math.abs(v) >= 1e6 || (Math.abs(v) < 0.001 && v !== 0)) return v.toExponential(2); if (Number.isInteger(v)) return String(v); const s = v.toFixed(4); return s.replace(/\.?0+$/, "") }
function formulasFor(nid) { return formulaNodes.filter(f => f.variables.includes(nid) || f.constants.includes(nid)) }

function varConstLinks() { const links = []; for (const f of formulaNodes) { for (const vid of f.variables) { for (const cid of f.constants) { const ex = links.find(l => l.varId === vid && l.constId === cid); if (ex) ex.weight++; else links.push({ varId: vid, constId: cid, weight: 1 }) } } } return links }
function freeVariables() { const linked = new Set(); for (const f of formulaNodes) { if (f.constants.length > 0) f.variables.forEach(v => linked.add(v)) } const allVars = new Set(); formulaNodes.forEach(f => f.variables.forEach(v => allVars.add(v))); return [...allVars].filter(v => !linked.has(v)) }

// ─── EXPRESSION TREE SVG COMPONENT ──────────────────────────
function ExprTreeSVG({ formulaId, glow, values, sources, selectedNode, onClickVar }) {
  const tree = exprTrees[formulaId];
  if (!tree) return null;

  // Deep clone + layout
  const clone = JSON.parse(JSON.stringify(tree));
  layoutTree(clone);
  const depth = treeDepth(clone);
  const hGap = 32;
  const vGap = 38;
  const w = Math.max(clone._width * hGap + 20, 120);
  const h = (depth + 1) * vGap + 24;
  positionTree(clone, w / 2, 18, hGap, vGap);

  const nodes = collectNodes(clone);
  const edges = collectEdges(clone);

  // Evaluate node values
  nodes.forEach(n => {
    if (n.v != null && values[n.v] != null) n._val = values[n.v];
  });

  const r_op = 13, r_var = 14, r_lit = 10;

  return (
    <svg width={w} height={h} style={{ display: "block", margin: "0 auto" }}>
      {/* Edges */}
      {edges.map((e, i) => (
        <line key={i} x1={e.from._x} y1={e.from._y} x2={e.to._x} y2={e.to._y}
          stroke={glow} strokeWidth={1.2} strokeOpacity={0.35} />
      ))}
      {/* Nodes */}
      {nodes.map((n, i) => {
        if (n.op != null) {
          // Operator node
          const isEq = n.op === "=";
          return (
            <g key={i}>
              <rect x={n._x - r_op} y={n._y - r_op} width={r_op * 2} height={r_op * 2}
                rx={isEq ? 4 : 6} fill={glow + "18"} stroke={glow} strokeWidth={isEq ? 2 : 1.2} strokeOpacity={isEq ? 0.8 : 0.5} />
              <text x={n._x} y={n._y} textAnchor="middle" dy="0.38em"
                fill={isEq ? "#f8fafc" : glow} fontSize={isEq ? "14px" : n.op.length > 1 ? "9px" : "13px"}
                fontWeight="800" fontFamily="monospace" style={{ pointerEvents: "none" }}>{n.op}</text>
            </g>
          );
        }
        if (n.v != null) {
          // Variable leaf
          const def = varDefs[n.v] || { label: n.v };
          const isSel = selectedNode === n.v;
          const isUser = sources[n.v] === "user";
          const hasVal = n._val != null;
          return (
            <g key={i} onClick={() => onClickVar?.(n.v)} style={{ cursor: "pointer" }}>
              <circle cx={n._x} cy={n._y} r={r_var}
                fill={isSel ? "#f8fafc15" : "#1e293b"} stroke={isSel ? "#f8fafc" : "#475569"} strokeWidth={isSel ? 2 : 1.2} />
              <text x={n._x} y={n._y} textAnchor="middle" dy="0.35em"
                fill={isSel ? "#f8fafc" : "#94a3b8"} fontSize={def.label.length > 2 ? "8px" : "12px"}
                fontWeight="700" style={{ pointerEvents: "none" }}>{def.label}</text>
              {hasVal && (
                <text x={n._x} y={n._y + r_var + 10} textAnchor="middle"
                  fill={isUser ? "#f8fafc" : "#22d3ee"} fontSize="8px" fontWeight="700"
                  fontFamily="monospace" style={{ pointerEvents: "none" }}>{fmt(n._val)}</text>
              )}
            </g>
          );
        }
        if (n.lit != null) {
          // Literal
          return (
            <g key={i}>
              <rect x={n._x - r_lit - 2} y={n._y - r_lit} width={(r_lit + 2) * 2} height={r_lit * 2}
                rx={4} fill="#0f172a" stroke="#334155" strokeWidth={0.8} />
              <text x={n._x} y={n._y} textAnchor="middle" dy="0.35em"
                fill="#64748b" fontSize="10px" fontWeight="700"
                fontFamily="monospace" style={{ pointerEvents: "none" }}>{n.lit}</text>
            </g>
          );
        }
        return null;
      })}
    </svg>
  );
}

// ─── DAG BUILDER HELPERS ─────────────────────────────────────
function buildDAGData() {
  const nodes = [], edges = [];

  // Top 10 formulas (in order)
  const top10FormulaIds = ["f2", "f1", "f4", "f8", "f17", "f5", "f9", "f20", "f12", "f22"];
  const top10Formulas = top10FormulaIds.map(id => formulaNodes.find(f => f.id === id)).filter(Boolean);

  // Extract constants used by top 10 formulas
  const usedConstants = new Set();
  top10Formulas.forEach(f => f.constants.forEach(c => usedConstants.add(c)));
  const constantIds = Array.from(usedConstants); // ["c", "G", "h_p", "k_c", "g"]

  // Extract variables from top 10 formulas (deduplicated)
  const variableMap = new Map();
  top10Formulas.forEach(f => {
    f.variables.forEach(v => {
      if (!variableMap.has(v)) {
        variableMap.set(v, { parents: [] });
      }
      variableMap.get(v).parents.push(f.id);
    });
  });

  // Level 1: Constants
  constantIds.forEach(cid => {
    const def = constDefs[cid];
    nodes.push({
      id: cid,
      type: "constant",
      label: def.label,
      desc: def.desc,
      radius: 28,
      rank: 0
    });
  });

  // Level 2: Formulas
  top10Formulas.forEach(f => {
    nodes.push({
      id: f.id,
      type: "formula",
      label: f.name,
      glow: f.glow,
      natExpr: f.natExpr,
      summary: f.summary,
      rank: 1
    });
  });

  // Level 3: Variables
  variableMap.forEach((data, vid) => {
    const def = varDefs[vid] || { label: vid, desc: vid };
    nodes.push({
      id: vid,
      type: "variable",
      label: def.label,
      desc: def.desc,
      radius: 14,
      parents: data.parents,
      rank: 2
    });
  });

  // Edges: constant → formula
  top10Formulas.forEach(f => {
    f.constants.forEach(cid => {
      edges.push({
        source: cid,
        target: f.id,
        type: "const-formula",
        glow: f.glow
      });
    });
  });

  // Edges: formula → variable
  variableMap.forEach((data, vid) => {
    data.parents.forEach(fid => {
      edges.push({
        source: fid,
        target: vid,
        type: "formula-var",
        glow: formulaNodes.find(f => f.id === fid)?.glow || "#94a3b8"
      });
    });
  });

  return { nodes, edges };
}

// ─── DAGRE LAYOUT ────────────────────────────────────────────
function layoutDAG(nodes, edges, width, height) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB',
    nodesep: 50,
    ranksep: 80,
    marginx: 40,
    marginy: 40
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes
  nodes.forEach(n => {
    let w = 60, h = 60;
    if (n.type === "constant") {
      w = 60; h = 60;
    } else if (n.type === "formula") {
      w = 100; h = 50;
    } else if (n.type === "variable") {
      w = 40; h = 40;
    }
    g.setNode(n.id, { width: w, height: h, rank: n.rank });
  });

  // Add edges
  edges.forEach(e => {
    g.setEdge(e.source, e.target);
  });

  // Compute layout
  dagre.layout(g);

  // Extract positions
  const positioned = new Map();
  g.nodes().forEach(nid => {
    const n = g.node(nid);
    positioned.set(nid, { x: n.x, y: n.y });
  });

  return positioned;
}

// ─── COMPONENT ───────────────────────────────────────────────
export default function PhysicsGraph() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const simRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeFormulas, setActiveFormulas] = useState(new Set());
  const [lastToggled, setLastToggled] = useState(null);
  const [userValues, setUserValues] = useState(defaultValues);
  const [size, setSize] = useState({ width: 800, height: 500 });

  const selectedNodeRef = useRef(null);
  const toggleFormulaRef = useRef(null);
  const clickNodeRef = useRef(null);

  const { values: allValues, sources } = useMemo(() => propagate(userValues), [userValues]);

  const setVar = useCallback((vid, val) => {
    setUserValues(prev => { const n = { ...prev }; if (val == null || val === "") delete n[vid]; else n[vid] = Number(val); return n; });
  }, []);

  const toggleFormula = useCallback((fid) => {
    setSelectedNode(null); selectedNodeRef.current = null;
    setActiveFormulas(prev => {
      const n = new Set(prev); if (n.has(fid)) n.delete(fid); else { n.add(fid); setLastToggled(fid); } return n;
    });
  }, []);

  const clickNode = useCallback((nodeId) => {
    if (selectedNodeRef.current === nodeId) {
      setSelectedNode(null); selectedNodeRef.current = null; setActiveFormulas(new Set()); setLastToggled(null); return;
    }
    setSelectedNode(nodeId); selectedNodeRef.current = nodeId;

    // Check if it's a formula node
    const isFormula = formulaNodes.some(f => f.id === nodeId);
    if (isFormula) {
      setActiveFormulas(new Set([nodeId]));
      setLastToggled(nodeId);
    } else {
      const rel = formulasFor(nodeId);
      setActiveFormulas(new Set(rel.map(f => f.id)));
      if (rel.length) setLastToggled(rel[0].id);
    }
  }, []);

  const clearSelection = useCallback(() => { setActiveFormulas(new Set()); setSelectedNode(null); selectedNodeRef.current = null; setLastToggled(null); }, []);

  useEffect(() => { toggleFormulaRef.current = toggleFormula; }, [toggleFormula]);
  useEffect(() => { clickNodeRef.current = clickNode; }, [clickNode]);
  useEffect(() => {
    const measure = () => { if (containerRef.current) setSize({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight }); };
    measure(); window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure);
  }, []);

  const activeVarIds = useMemo(() => {
    const s = new Set();
    const top10FormulaIds = ["f2", "f1", "f4", "f8", "f17", "f5", "f9", "f20", "f12", "f22"];
    activeFormulas.forEach(fid => {
      // Only show variables from top 10 formulas in the DAG
      if (top10FormulaIds.includes(fid)) {
        const f = formulaNodes.find(x => x.id === fid);
        if (f) f.variables.forEach(v => s.add(v));
      }
    });
    return [...s];
  }, [activeFormulas]);

  // ─── D3 DAG GRAPH ────────────────────────────────────────────
  const initGraph = useCallback(() => {
    const svg = d3.select(svgRef.current); svg.selectAll("*").remove();
    const { width, height } = size;
    const { nodes, edges } = buildDAGData();

    // Compute dagre layout
    const positions = layoutDAG(nodes, edges, width, height);

    // Apply positions to nodes
    nodes.forEach(n => {
      const pos = positions.get(n.id);
      if (pos) {
        n.x = pos.x;
        n.y = pos.y;
      }
    });

    const defs = svg.append("defs");

    // Glow filters for formulas
    formulaNodes.forEach(f => {
      const fl = defs.append("filter").attr("id", `glow-${f.id}`).attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
      fl.append("feDropShadow").attr("dx", 0).attr("dy", 0).attr("stdDeviation", 5).attr("flood-color", f.glow).attr("flood-opacity", 0.8);
    });

    const wg = defs.append("filter").attr("id", "glow-white").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    wg.append("feDropShadow").attr("dx", 0).attr("dy", 0).attr("stdDeviation", 8).attr("flood-color", "#f8fafc").attr("flood-opacity", 0.9);

    const g = svg.append("g");
    svg.call(d3.zoom().scaleExtent([0.15, 5]).on("zoom", e => g.attr("transform", e.transform)));

    // Edges (draw first so nodes are on top)
    const edgeData = edges.map(e => {
      const src = nodes.find(n => n.id === e.source);
      const tgt = nodes.find(n => n.id === e.target);
      return { ...e, source: src, target: tgt };
    });

    g.append("g").attr("class", "edges").selectAll("line").data(edgeData).join("line")
      .attr("class", d => {
        const fid = d.source.type === "formula" ? d.source.id : d.target.type === "formula" ? d.target.id : null;
        return fid ? `edge edge-${fid}` : "edge";
      })
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
      .attr("stroke", d => d.glow || "#475569")
      .attr("stroke-opacity", 0.2)
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    // Arrow marker
    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 9)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", "#475569");

    const node = g.append("g").attr("class", "nodes").selectAll("g").data(nodes).join("g")
      .attr("class", d => `node node-${d.id}`)
      .attr("transform", d => `translate(${d.x},${d.y})`);

    // Constants (Level 1)
    const constG = node.filter(d => d.type === "constant");
    constG.append("circle").attr("r", d => d.radius + 8).attr("fill", "none").attr("stroke", "#475569").attr("stroke-width", 0.5).attr("stroke-opacity", 0.3);
    constG.append("rect").attr("width", d => d.radius * 2).attr("height", d => d.radius * 2).attr("x", d => -d.radius).attr("y", d => -d.radius).attr("rx", 8).attr("fill", "#1e293b").attr("stroke", "#475569").attr("stroke-width", 2).style("cursor", "pointer");
    constG.append("text").text(d => d.label).attr("text-anchor", "middle").attr("dy", "-0.1em").attr("fill", "#94a3b8").attr("font-size", "18px").attr("font-weight", "800").attr("pointer-events", "none");
    constG.append("text").text("= 1").attr("text-anchor", "middle").attr("dy", "1.3em").attr("fill", "#475569").attr("font-size", "10px").attr("font-weight", "600").attr("font-family", "monospace").attr("pointer-events", "none");
    constG.append("text").text(d => d.desc).attr("text-anchor", "middle").attr("dy", d => d.radius + 14).attr("fill", "#334155").attr("font-size", "8px").attr("pointer-events", "none");
    constG.on("click", (e, d) => { e.stopPropagation(); clickNodeRef.current?.(d.id); });

    // Formulas (Level 2)
    const formulaG = node.filter(d => d.type === "formula");
    formulaG.append("rect")
      .attr("class", "formula-body")
      .attr("width", 100)
      .attr("height", 50)
      .attr("x", -50)
      .attr("y", -25)
      .attr("rx", 6)
      .attr("fill", d => d.glow + "15")
      .attr("stroke", d => d.glow)
      .attr("stroke-width", 2)
      .style("cursor", "pointer");
    formulaG.append("text")
      .attr("class", "formula-label")
      .text(d => d.natExpr || d.label)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "#f8fafc")
      .attr("font-size", "11px")
      .attr("font-weight", "700")
      .attr("font-family", "monospace")
      .attr("pointer-events", "none");
    formulaG.on("click", (e, d) => {
      e.stopPropagation();
      toggleFormulaRef.current?.(d.id);
    });

    // Variables (Level 3)
    const varG = node.filter(d => d.type === "variable");
    varG.append("circle").attr("class", "var-body").attr("r", d => d.radius).attr("fill", "#1e293b").attr("stroke", "#475569").attr("stroke-width", 1.5).style("cursor", "pointer");
    varG.append("text").attr("class", "var-label").text(d => d.label).attr("text-anchor", "middle").attr("dy", "0.35em").attr("fill", "#94a3b8").attr("font-size", d => d.label.length > 2 ? "9px" : "12px").attr("font-weight", "bold").attr("pointer-events", "none");
    varG.append("text").attr("class", "var-desc").text(d => d.desc).attr("text-anchor", "middle").attr("dy", d => (d.radius || 14) + 10).attr("fill", "#475569").attr("font-size", "7px").attr("pointer-events", "none");
    varG.append("text").attr("class", "var-value").text("").attr("text-anchor", "middle").attr("dy", d => -(d.radius || 14) - 4).attr("fill", "#22d3ee").attr("font-size", "9px").attr("font-weight", "700").attr("font-family", "monospace").attr("pointer-events", "none");
    varG.on("click", (e, d) => { e.stopPropagation(); clickNodeRef.current?.(d.id); });
  }, [size]);

  useEffect(() => { initGraph(); }, [initGraph]);

  // Update values
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll(".nodes .node").each(function (d) {
      if (d.type !== "variable") return;
      const el = d3.select(this); const val = allValues[d.id]; const src = sources[d.id]; const isUser = src === "user";
      el.select(".var-value").text(val != null ? fmt(val) : "").attr("fill", isUser ? "#f8fafc" : "#22d3ee");
      const baseR = 10 + (d.degree || 0) * 2;
      let newR = baseR;
      if (val != null && val !== 0) newR = Math.max(baseR, Math.min(baseR + Math.log10(Math.abs(val) + 1) * 8, 50));
      d.radius = newR;
      el.select(".var-body").transition().duration(300).attr("r", newR);
      el.select(".var-value").attr("dy", -newR - 4);
      el.select(".var-desc").attr("dy", newR + 10);
    });
  }, [allValues, sources]);

  // Glow and highlighting
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const hasActive = activeFormulas.size > 0;
    const nodeGlows = new Map();

    // Build node glow map for active formulas
    if (hasActive) {
      activeFormulas.forEach(fid => {
        const f = formulaNodes.find(x => x.id === fid);
        if (!f) return;
        // Add formula itself
        if (!nodeGlows.has(fid)) nodeGlows.set(fid, []);
        nodeGlows.get(fid).push({ color: f.glow, fid });
        // Add variables and constants
        [...f.variables, ...f.constants].forEach(mid => {
          if (!nodeGlows.has(mid)) nodeGlows.set(mid, []);
          nodeGlows.get(mid).push({ color: f.glow, fid });
        });
      });
    }

    // Update edges
    svg.selectAll(".edges line").each(function (d) {
      const el = d3.select(this);
      const fid = d.source.type === "formula" ? d.source.id : d.target.type === "formula" ? d.target.id : null;
      if (!hasActive) {
        el.attr("stroke", d.glow || "#475569")
          .attr("stroke-opacity", 0.2)
          .attr("stroke-width", 1.5)
          .style("filter", "none");
        return;
      }
      if (fid && activeFormulas.has(fid)) {
        const f = formulaNodes.find(x => x.id === fid);
        el.attr("stroke", f?.glow || d.glow)
          .attr("stroke-opacity", 0.6)
          .attr("stroke-width", 2.5)
          .style("filter", `url(#glow-${fid})`);
      } else {
        el.attr("stroke", "#1e293b")
          .attr("stroke-opacity", 0.03)
          .attr("stroke-width", 0.5)
          .style("filter", "none");
      }
    });

    // Update nodes
    svg.selectAll(".nodes .node").each(function (d) {
      const el = d3.select(this);
      const glows = nodeGlows.get(d.id);
      const isLit = glows && glows.length > 0;
      const dimmed = hasActive && !isLit;
      const isSel = selectedNode === d.id;

      if (d.type === "constant") {
        el.select("rect")
          .attr("fill", isSel ? "#f8fafc15" : isLit ? glows[0].color + "20" : dimmed ? "#0f172a" : "#1e293b")
          .attr("stroke", isSel ? "#f8fafc" : isLit ? glows[0].color : dimmed ? "#1e293b" : "#475569")
          .attr("stroke-width", isSel ? 3 : 2)
          .style("filter", isSel ? "url(#glow-white)" : isLit ? `url(#glow-${glows[0].fid})` : "none");
        el.selectAll("circle").attr("stroke-opacity", dimmed ? 0.05 : 0.3);
        el.selectAll("text").attr("opacity", dimmed ? 0.1 : 1);
      } else if (d.type === "formula") {
        const isActive = activeFormulas.has(d.id);
        el.select(".formula-body")
          .attr("fill", isActive ? d.glow + "25" : dimmed ? "#0f172a" : d.glow + "15")
          .attr("stroke", isActive ? d.glow : dimmed ? "#1e293b" : d.glow)
          .attr("stroke-width", isActive ? 3 : 2)
          .style("filter", isActive ? `url(#glow-${d.id})` : "none");
        el.select(".formula-label")
          .attr("fill", dimmed ? "#1e293b" : "#f8fafc")
          .attr("opacity", dimmed ? 0.2 : 1);
      } else if (d.type === "variable") {
        const circ = el.select(".var-body");
        if (isSel) {
          circ.attr("fill", "#f8fafc22")
            .attr("stroke", "#f8fafc")
            .attr("stroke-width", 3)
            .style("filter", "url(#glow-white)");
        } else if (isLit) {
          const col = glows.length === 1 ? glows[0].color : "#f8fafc";
          circ.attr("fill", col + "20")
            .attr("stroke", col)
            .attr("stroke-width", 2.5)
            .style("filter", glows.length === 1 ? `url(#glow-${glows[0].fid})` : "none");
        } else {
          circ.attr("fill", dimmed ? "#0f172a" : "#1e293b")
            .attr("stroke", dimmed ? "#1e293b" : "#475569")
            .attr("stroke-width", 1.5)
            .style("filter", "none");
        }
        el.select(".var-label").attr("fill", dimmed ? "#1e293b" : (isLit || isSel) ? "#f8fafc" : "#94a3b8");
        el.select(".var-desc").attr("fill", dimmed ? "#0f172a" : isSel ? "#94a3b8" : isLit ? (glows.length === 1 ? glows[0].color : "#94a3b8") : "#475569");
        el.select(".var-value").attr("opacity", dimmed ? 0.1 : 1);
      }
    });
  }, [activeFormulas, selectedNode]);

  const panelFormula = lastToggled && activeFormulas.has(lastToggled) ? formulaNodes.find(f => f.id === lastToggled) : activeFormulas.size > 0 ? formulaNodes.find(f => activeFormulas.has(f.id)) : null;
  const selDef = selectedNode ? (varDefs[selectedNode] || constDefs[selectedNode]) : null;
  const selIsConst = selectedNode && !!constDefs[selectedNode];

  return (
    <div style={{ background: "#0f172a", width: "100vw", height: "100vh", color: "#e2e8f0", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div ref={containerRef} style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <svg ref={svgRef} width={size.width} height={size.height} style={{ background: "#0f172a", display: "block" }} />

        {/* Legend */}
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: "6px", fontSize: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "5px", background: "#0f172acc", padding: "4px 10px", borderRadius: "16px", border: "1px solid #334155" }}>
            <span style={{ width: 9, height: 9, borderRadius: "2px", background: "#1e293b", border: "1.5px solid #475569" }} /> Constant = 1
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "5px", background: "#0f172acc", padding: "4px 10px", borderRadius: "16px", border: "1px solid #334155" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#1e293b", border: "1.5px solid #475569" }} /> Variable
          </span>
          <button onClick={() => setUserValues(defaultValues())} style={{ background: "#0f172acc", padding: "4px 10px", borderRadius: "16px", border: "1px solid #334155", color: "#475569", cursor: "pointer", fontSize: "10px", fontFamily: "inherit" }}>Reset all to 1</button>
        </div>

        {/* ─── RIGHT PANEL ─────────────────────────────────── */}
        {(selectedNode || panelFormula) && (
          <div style={{
            position: "absolute", top: 12, right: 14, width: "300px", background: "#0f172af0", backdropFilter: "blur(16px)",
            borderRadius: "14px", overflow: "hidden", border: `1px solid ${panelFormula ? panelFormula.glow + "44" : "#475569"}`,
            boxShadow: `0 0 30px ${panelFormula ? panelFormula.glow + "15" : "#0003"}, 0 8px 32px rgba(0,0,0,0.5)`,
          }}>
            {/* Node header */}
            {selectedNode && selDef && (
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e293b" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "9px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>{selIsConst ? "Constant" : "Variable"}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                      <span style={{ fontSize: "24px", fontWeight: 800, color: "#f8fafc" }}>{selDef.label}</span>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>{selDef.desc}</span>
                      {selIsConst ? <span style={{ fontSize: "14px", fontWeight: 700, fontFamily: "monospace", color: "#475569" }}>= 1</span>
                        : <span style={{ fontSize: "14px", fontWeight: 700, fontFamily: "monospace", color: sources[selectedNode] === "user" ? "#f8fafc" : "#22d3ee" }}>= {fmt(allValues[selectedNode])}</span>}
                    </div>
                  </div>
                  <button onClick={clearSelection} style={{ background: "none", border: "1px solid #334155", borderRadius: "5px", color: "#64748b", cursor: "pointer", padding: "1px 7px", fontSize: "12px", fontFamily: "inherit" }}>✕</button>
                </div>
                <div style={{ fontSize: "9px", color: "#475569", marginTop: "6px" }}>In {formulasFor(selectedNode).length} formulas:</div>
              </div>
            )}

            {/* Formula cards with expression trees */}
            <div style={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}>
              {(selectedNode ? formulasFor(selectedNode) : panelFormula ? [panelFormula] : []).map(f => {
                const expanded = lastToggled === f.id || !selectedNode;
                const depth = exprTrees[f.id] ? treeDepth(JSON.parse(JSON.stringify(exprTrees[f.id]))) : 0;
                return (
                  <div key={f.id} onClick={() => setLastToggled(f.id)} style={{
                    padding: "10px 16px", borderBottom: `1px solid ${f.glow}15`, cursor: "pointer",
                    background: expanded ? f.glow + "08" : "transparent",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: f.glow, boxShadow: `0 0 8px ${f.glow}88`, flexShrink: 0 }} />
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc", flex: 1 }}>{f.name}</span>
                      <span style={{ fontSize: "8px", color: "#475569", fontFamily: "monospace" }}>depth {depth}</span>
                    </div>
                    {expanded && (
                      <>
                        {/* Expression tree */}
                        <div style={{ background: "#0f172a", borderRadius: "8px", border: `1px solid ${f.glow}22`, padding: "8px 0", margin: "4px 0 8px", overflow: "auto" }}>
                          <ExprTreeSVG
                            formulaId={f.id} glow={f.glow}
                            values={allValues} sources={sources}
                            selectedNode={selectedNode}
                            onClickVar={(vid) => clickNodeRef.current?.(vid)}
                          />
                        </div>
                        <p style={{ margin: "0 0 6px", fontSize: "10px", lineHeight: 1.5, color: "#64748b" }}>{f.summary}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Variable input bar */}
      {activeVarIds.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 8px", padding: "8px 14px", background: "#0f172a", borderTop: "1px solid #1e293b", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
          {activeVarIds.map(vid => {
            const def = varDefs[vid] || { label: vid };
            const val = allValues[vid];
            const isUser = sources[vid] === "user";
            const isSel = vid === selectedNode;
            const colors = [];
            activeFormulas.forEach(fid => { const f = formulaNodes.find(x => x.id === fid); if (f && f.variables.includes(vid)) colors.push(f.glow); });
            const borderCol = isSel ? "#f8fafc" : colors.length === 1 ? colors[0] : colors.length > 1 ? "#f8fafc" : "#334155";
            return (
              <div key={vid} onClick={() => clickNodeRef.current?.(vid)} style={{
                display: "flex", alignItems: "center", gap: "4px", background: isSel ? "#f8fafc10" : "#1e293b",
                border: `1px solid ${borderCol}${isSel ? "" : "66"}`, borderRadius: "8px", padding: "3px 4px 3px 8px",
                cursor: "pointer", boxShadow: isSel ? `0 0 12px ${borderCol}33` : "none", transition: "all 0.15s",
              }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: isSel ? "#f8fafc" : "#94a3b8", minWidth: "14px" }}>{def.label}</span>
                <input type="number" value={userValues[vid] != null ? userValues[vid] : (val != null ? val : "")}
                  onChange={e => { const raw = e.target.value; if (raw === "" || raw === "-") { setVar(vid, null); return; } const n = parseFloat(raw); if (!isNaN(n)) setVar(vid, n); }}
                  onClick={e => e.stopPropagation()}
                  style={{ background: "#0f172a", border: `1px solid ${isUser ? "#475569" : "#22d3ee33"}`, borderRadius: "5px", padding: "2px 5px", color: isUser ? "#f8fafc" : "#22d3ee", fontSize: "12px", fontFamily: "monospace", fontWeight: 700, width: "68px", outline: "none", textAlign: "right" }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Formula checklist bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 6px", padding: "8px 14px", background: "#0f172a", borderTop: "1px solid #1e293b", justifyContent: "center", flexShrink: 0 }}>
        {formulaNodes.map(f => {
          const active = activeFormulas.has(f.id);
          const depth = exprTrees[f.id] ? treeDepth(JSON.parse(JSON.stringify(exprTrees[f.id]))) : 0;
          return (
            <label key={f.id} onClick={e => { e.preventDefault(); toggleFormulaRef.current?.(f.id) }} style={{
              display: "flex", alignItems: "center", gap: "5px", padding: "3px 8px", borderRadius: "6px", cursor: "pointer", userSelect: "none",
              background: active ? f.glow + "15" : "transparent", border: `1px solid ${active ? f.glow + "66" : "#1e293b"}`, transition: "all 0.15s",
            }}>
              <span style={{ width: 12, height: 12, borderRadius: "3px", flexShrink: 0, border: `1.5px solid ${active ? f.glow : "#334155"}`, background: active ? f.glow : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                {active && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </span>
              <span style={{ fontSize: "10px", color: active ? "#f8fafc" : "#64748b", fontWeight: active ? 600 : 400 }}>{f.name}</span>
              {/* Depth dots */}
              <span style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                {Array.from({ length: depth }, (_, i) => (
                  <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: active ? f.glow : "#334155" }} />
                ))}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}