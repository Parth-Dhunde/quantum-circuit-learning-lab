"""Pydantic models for circuit API requests and responses."""

from __future__ import annotations

from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field, model_validator


class GateH(BaseModel):
    type: Literal["H"]
    target: int


class GateX(BaseModel):
    type: Literal["X"]
    target: int


class GateY(BaseModel):
    type: Literal["Y"]
    target: int


class GateZ(BaseModel):
    type: Literal["Z"]
    target: int


class GateRX(BaseModel):
    type: Literal["RX"]
    target: int
    angle: float


class GateRZ(BaseModel):
    type: Literal["RZ"]
    target: int
    angle: float


class GateCX(BaseModel):
    type: Literal["CX"]
    control: int
    target: int


GateModel = Annotated[
    Union[GateH, GateX, GateY, GateZ, GateRX, GateRZ, GateCX],
    Field(discriminator="type"),
]


class RunCircuitRequest(BaseModel):
    num_qubits: int = Field(..., ge=1, le=24)
    gates: list[GateModel]
    shots: int = Field(1000, ge=1, le=100_000)
    include_intermediate_states: bool = False

    @model_validator(mode="after")
    def validate_gates_against_qubits(self) -> RunCircuitRequest:
        n = self.num_qubits
        for i, gate in enumerate(self.gates):
            if isinstance(gate, (GateH, GateX, GateY, GateZ, GateRX, GateRZ)):
                if not 0 <= gate.target < n:
                    raise ValueError(
                        f"Gate {i} ({gate.type}): target {gate.target} out of range for {n} qubits"
                    )
            else:
                if not 0 <= gate.control < n:
                    raise ValueError(f"Gate {i} (CX): control {gate.control} out of range for {n} qubits")
                if not 0 <= gate.target < n:
                    raise ValueError(f"Gate {i} (CX): target {gate.target} out of range for {n} qubits")
                if gate.control == gate.target:
                    raise ValueError(f"Gate {i} (CX): control and target must differ")
        return self


class StepState(BaseModel):
    after_gate_index: int
    statevector: list[tuple[float, float]]


class RunCircuitResponse(BaseModel):
    measurement_counts: dict[str, int]
    statevector: list[tuple[float, float]]
    circuit_diagram: str
    step_states: list[StepState] = Field(default_factory=list)
    error: str | None = None
