"""Build Qiskit circuits, simulate with Aer, and format outputs."""

from __future__ import annotations

from io import StringIO

from qiskit import QuantumCircuit, transpile
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator

from app.models import (
    GateCX,
    GateH,
    GateRX,
    GateRZ,
    GateX,
    GateY,
    GateZ,
    RunCircuitRequest,
    StepState,
)


def apply_gate(qc: QuantumCircuit, gate: object) -> None:
    """Append a single gate to the circuit (shared by full build and stepping)."""
    if isinstance(gate, GateH):
        qc.h(gate.target)
    elif isinstance(gate, GateX):
        qc.x(gate.target)
    elif isinstance(gate, GateY):
        qc.y(gate.target)
    elif isinstance(gate, GateZ):
        qc.z(gate.target)
    elif isinstance(gate, GateRX):
        qc.rx(gate.angle, gate.target)
    elif isinstance(gate, GateRZ):
        qc.rz(gate.angle, gate.target)
    elif isinstance(gate, GateCX):
        qc.cx(gate.control, gate.target)
    else:
        raise ValueError(f"Unsupported gate: {gate!r}")


def build_circuit(num_qubits: int, gates: list[object]) -> QuantumCircuit:
    qc = QuantumCircuit(num_qubits)
    for g in gates:
        apply_gate(qc, g)
    return qc


def circuit_text_diagram(qc: QuantumCircuit) -> str:
    try:
        drawing = qc.draw(output="text", fold=120)
        return str(drawing)
    except Exception:  # noqa: BLE001
        buf = StringIO()
        qc.draw(output="text", filename=buf, fold=120)
        return buf.getvalue()


def statevector_to_amps(sv: Statevector) -> list[tuple[float, float]]:
    data = sv.data
    return [(float(z.real), float(z.imag)) for z in data]


def run_circuit(req: RunCircuitRequest) -> dict[str, object]:
    gates = req.gates
    qc_unitary = build_circuit(req.num_qubits, gates)
    sv = Statevector.from_instruction(qc_unitary)

    qc_meas = qc_unitary.copy()
    qc_meas.measure_all()
    simulator = AerSimulator()
    compiled = transpile(qc_meas, simulator)
    job = simulator.run(compiled, shots=req.shots)
    counts_raw = job.result().get_counts()
    counts = {str(k): int(v) for k, v in counts_raw.items()}

    diagram = circuit_text_diagram(qc_unitary)

    step_states: list[StepState] = []
    if req.include_intermediate_states:
        partial = QuantumCircuit(req.num_qubits)
        for idx, g in enumerate(gates):
            apply_gate(partial, g)
            sv_step = Statevector.from_instruction(partial)
            step_states.append(
                StepState(after_gate_index=idx, statevector=statevector_to_amps(sv_step))
            )

    return {
        "measurement_counts": counts,
        "statevector": statevector_to_amps(sv),
        "circuit_diagram": diagram,
        "step_states": step_states,
    }
