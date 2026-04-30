"""FastAPI application: quantum circuit simulation API."""

from __future__ import annotations

import re

from fastapi import Body, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from app.circuit_runner import run_circuit
from app.models import RunCircuitRequest, RunCircuitResponse

app = FastAPI(title="Quantum Circuit Simulator API", version="1.0.0")
def _error_payload(detail: str) -> dict[str, object]:
    return {
        "measurement_counts": {},
        "statevector": [],
        "circuit_diagram": "Simulation failed",
        "step_states": [],
        "error": detail,
    }

@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(status_code=exc.status_code, content=_error_payload(detail))


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content=_error_payload(f"Internal server error: {str(exc)}"))



_ALLOWED_TYPES = frozenset({"H", "X", "Y", "Z", "CX", "RX", "RZ"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _coerce_raw_gate(g: dict) -> dict:
    """Reject unknown types and enforce field rules before Pydantic."""
    gtype = g.get("type")
    if gtype not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid gate type: {gtype!r}. Allowed: {', '.join(sorted(_ALLOWED_TYPES))}.",
        )

    keys = set(g.keys())

    if gtype in ("H", "X", "Y", "Z"):
        allowed = {"type", "target"}
        extra = keys - allowed
        if extra:
            raise HTTPException(status_code=400, detail=f"Unexpected fields on {gtype} gate: {sorted(extra)}")
        if "control" in g:
            raise HTTPException(status_code=400, detail=f"{gtype} gate must not include 'control'")
        if "angle" in g:
            raise HTTPException(status_code=400, detail=f"{gtype} gate must not include 'angle'")
        if "target" not in g:
            raise HTTPException(status_code=400, detail=f"{gtype} gate requires 'target'")
    elif gtype == "CX":
        allowed = {"type", "control", "target"}
        extra = keys - allowed
        if extra:
            raise HTTPException(status_code=400, detail=f"Unexpected fields on CX gate: {sorted(extra)}")
        if "angle" in g:
            raise HTTPException(status_code=400, detail="CX gate must not include 'angle'")
        if "control" not in g or "target" not in g:
            raise HTTPException(status_code=400, detail="CX gate requires both 'control' and 'target'")
    else:  # RX, RZ
        allowed = {"type", "target", "angle"}
        extra = keys - allowed
        if extra:
            raise HTTPException(status_code=400, detail=f"Unexpected fields on {gtype} gate: {sorted(extra)}")
        if "control" in g:
            raise HTTPException(status_code=400, detail=f"{gtype} gate must not include 'control'")
        if "target" not in g or "angle" not in g:
            raise HTTPException(status_code=400, detail=f"{gtype} gate requires 'target' and 'angle' (radians)")

    return g


def _parse_run_body(body: dict) -> RunCircuitRequest:
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="JSON object expected")

    raw_gates = body.get("gates", [])
    if not isinstance(raw_gates, list):
        raise HTTPException(status_code=400, detail="'gates' must be a list")

    coerced = []
    for i, item in enumerate(raw_gates):
        if not isinstance(item, dict):
            raise HTTPException(status_code=400, detail=f"Gate {i} must be an object")
        try:
            coerced.append(_coerce_raw_gate(item))
        except HTTPException:
            raise
        except Exception as e:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=f"Gate {i}: {e}") from e

    payload = {
        "num_qubits": body.get("num_qubits"),
        "gates": coerced,
        "shots": body.get("shots", 1000),
        "include_intermediate_states": body.get("include_intermediate_states", False),
    }

    try:
        return RunCircuitRequest.model_validate(payload)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=_format_validation_error(e)) from e


def _format_validation_error(err: ValidationError) -> str:
    parts = []
    for error in err.errors():
        loc = ".".join(str(x) for x in error["loc"])
        parts.append(f"{loc}: {error['msg']}")
    return "; ".join(parts)


def _run_circuit_impl(body: dict) -> RunCircuitResponse | JSONResponse:
    """Always respond with JSON, including unexpected failures."""
    print("API hit: /run-circuit")
    try:
        req = _parse_run_body(body)
        try:
            data = run_circuit(req)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        except Exception as e:  # noqa: BLE001
            msg = str(e)
            if re.search(r"out of range|invalid|dimension", msg, re.I):
                raise HTTPException(status_code=400, detail=msg) from e
            return JSONResponse(status_code=500, content=_error_payload("Simulation failed"))

        try:
            return RunCircuitResponse.model_validate(data)
        except ValidationError as e:
            return JSONResponse(
                status_code=500,
                content=_error_payload("Invalid simulator output: " + _format_validation_error(e)),
            )
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        return JSONResponse(status_code=500, content=_error_payload(f"Simulation failed: {str(e)}"))


@app.post("/run-circuit", response_model=RunCircuitResponse)
@app.post("/api/run-circuit", response_model=RunCircuitResponse)
def run_circuit_endpoint(body: dict = Body(...)) -> RunCircuitResponse | JSONResponse:
    return _run_circuit_impl(body)
