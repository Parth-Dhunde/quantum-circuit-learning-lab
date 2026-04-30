import type { Gate } from "../types";

export type DemoCircuit = {
  numQubits: number;
  gates: Array<Omit<Gate, "id">>;
};

export type LearningModule = {
  id: string;
  title: string;
  description: string;
  content: string[];
  keyInsight: string;
  stepHints: string[];
  practice: string[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  demoCircuit: DemoCircuit;
};

export const LEARNING_MODULES: LearningModule[] = [
  {
    id: "qubit-basics",
    title: "Qubit Basics",
    description: "What a qubit represents and why amplitudes matter",
    content: [
      "A qubit is described by amplitudes in front of basis states, often written as α|0⟩ + β|1⟩.",
      "Amplitudes can be real or complex, but measurement probabilities are always |amplitude|².",
      "The simulator starts in |0⟩, so the first frame is your anchor for all later transformations.",
    ],
    keyInsight: "Quantum state is about amplitudes first; probabilities are derived from them.",
    stepHints: [
      "Initial state: |0⟩.",
      "With no gates, the initial state remains unchanged. Use this as your baseline.",
    ],
    practice: [
      "Add an X gate and run again. How does the dominant basis state change?",
      "Set qubits to 2 and run with no gates. What initial basis state appears?",
    ],
    quiz: {
      question: "If a qubit is exactly in |0⟩, what is the probability of measuring |1⟩?",
      options: ["0%", "50%", "100%"],
      correctIndex: 0,
      explanation: "Correct: |0⟩ means all amplitude is on |0⟩, so |1⟩ has zero probability.",
    },
    demoCircuit: {
      numQubits: 1,
      gates: [],
    },
  },
  {
    id: "basis-states",
    title: "Basis States",
    description: "Computational basis for one and two qubits",
    content: [
      "For one qubit, the computational basis states are |0⟩ and |1⟩.",
      "For two qubits, basis states are |00⟩, |01⟩, |10⟩, and |11⟩.",
      "Gate operations move amplitude across this basis, which you can track in the state preview.",
    ],
    keyInsight: "Statevector rows correspond directly to basis states, so index ordering matters.",
    stepHints: [
      "Initial state: |00⟩.",
      "After X on qubit 1, amplitude moves to |01⟩ in little-endian ordering.",
    ],
    practice: [
      "Move X from qubit 1 to qubit 0. Which basis state is now dominant?",
      "Add another X on qubit 0. What final basis state do you get?",
    ],
    quiz: {
      question: "Starting from |00⟩, what state do you get after X on qubit 1?",
      options: ["|10⟩", "|01⟩", "|11⟩"],
      correctIndex: 1,
      explanation: "Correct: flipping qubit 1 transforms |00⟩ into |01⟩.",
    },
    demoCircuit: {
      numQubits: 2,
      gates: [{ type: "X", target: 1 }],
    },
  },
  {
    id: "superposition",
    title: "Superposition",
    description: "Using the Hadamard (H) gate to create equal superposition",
    content: [
      "Superposition means the qubit can have non-zero amplitude for multiple basis states at once.",
      "Applying H to |0⟩ produces (|0⟩ + |1⟩)/√2, so measurement is ~50/50 over many shots.",
      "Step through the circuit to see the statevector change after each gate.",
    ],
    keyInsight: "After H on |0⟩, the qubit becomes equally likely to be measured as 0 or 1.",
    stepHints: [
      "Initial state: |0⟩.",
      "After H gate: superposition is created, splitting amplitude across |0⟩ and |1⟩.",
    ],
    practice: [
      "Add another H gate. Does the state return to |0⟩?",
      "Remove H and compare measurement counts.",
    ],
    quiz: {
      question: "What is P(|1⟩) after applying H to |0⟩?",
      options: ["0%", "50%", "100%"],
      correctIndex: 1,
      explanation: "Correct: H creates equal amplitudes for |0⟩ and |1⟩, so each has 50% probability.",
    },
    demoCircuit: {
      numQubits: 1,
      gates: [{ type: "H", target: 0 }],
    },
  },
  {
    id: "measurement-basics",
    title: "Measurement Basics",
    description: "Probabilities, shots, and collapse intuition",
    content: [
      "Measurement returns classical outcomes sampled from quantum probabilities.",
      "When a qubit is in equal superposition, repeated shots produce roughly equal 0/1 counts.",
      "Measurement collapses to a basis outcome for that run; many runs reveal the distribution.",
    ],
    keyInsight: "Single measurements are random; many measurements reveal stable probabilities.",
    stepHints: [
      "Initial state: |0⟩.",
      "After H: amplitudes are balanced, so measurement outcomes should trend toward 50/50.",
    ],
    practice: [
      "Increase shots and observe how counts stabilize around expected probabilities.",
      "Replace H with X and compare how deterministic outcomes look.",
    ],
    quiz: {
      question: "After applying H to |0⟩, what distribution should many shots approach?",
      options: ["About 50% |0⟩ and 50% |1⟩", "Always |0⟩", "Always |1⟩"],
      correctIndex: 0,
      explanation: "Correct: equal amplitudes from H produce equal measurement probabilities.",
    },
    demoCircuit: {
      numQubits: 1,
      gates: [{ type: "H", target: 0 }],
    },
  },
  {
    id: "multiple-qubits",
    title: "Multiple Qubits",
    description: "Independent qubits and joint outcomes",
    content: [
      "With multiple qubits, the full state is a joint state over all basis bitstrings.",
      "Applying H to two qubits creates four basis outcomes with equal probability when independent.",
      "This module builds intuition before introducing entanglement.",
    ],
    keyInsight: "Multi-qubit states track joint outcomes, not separate single-qubit tables.",
    stepHints: [
      "Initial state: |00⟩.",
      "After H on q0: two outcomes share amplitude.",
      "After H on q1: four outcomes now share amplitude.",
    ],
    practice: [
      "Remove one H gate. How many basis states now carry most amplitude?",
      "Insert X before the H gates and compare final distribution.",
    ],
    quiz: {
      question: "After H on both qubits from |00⟩, how many basis states carry amplitude?",
      options: ["1", "2", "4"],
      correctIndex: 2,
      explanation: "Correct: |00⟩, |01⟩, |10⟩, and |11⟩ all participate.",
    },
    demoCircuit: {
      numQubits: 2,
      gates: [
        { type: "H", target: 0 },
        { type: "H", target: 1 },
      ],
    },
  },
  {
    id: "entanglement",
    title: "Entanglement (Controlled Gates)",
    description: "Bell state creation with deeper CX intuition",
    content: [
      "CX applies X to target only when control is |1⟩, making it a conditional operation.",
      "Combined with H on the control qubit, CX can create entanglement (Bell states).",
      "Entangled outcomes are correlated beyond what independent random bits can describe.",
    ],
    keyInsight: "Bell-state entanglement links outcomes: you mostly get 00 or 11 together.",
    stepHints: [
      "Initial state: |00⟩.",
      "After H on q0: control qubit enters superposition.",
      "After CX(0→1): qubits become entangled; amplitudes align on |00⟩ and |11⟩.",
    ],
    practice: [
      "Swap control and target of CX. How do correlations change?",
      "Insert X on target before CX and inspect the new paired outcomes.",
    ],
    quiz: {
      question: "For an ideal Bell pair from H then CX, which outcomes dominate?",
      options: ["|01⟩ and |10⟩", "|00⟩ and |11⟩", "Only |00⟩"],
      correctIndex: 1,
      explanation: "Correct: the Bell state has support on |00⟩ and |11⟩ with strong correlation.",
    },
    demoCircuit: {
      numQubits: 2,
      gates: [
        { type: "H", target: 0 },
        { type: "CX", control: 0, target: 1 },
      ],
    },
  },
  {
    id: "circuits-overview",
    title: "Quantum Circuits Overview",
    description: "Reading gate sequences from left to right",
    content: [
      "A quantum circuit is a time-ordered sequence of gates applied to qubit wires.",
      "Each gate updates the state; playback lets you inspect those updates one step at a time.",
      "Thinking in stages helps debug and design circuits before running large experiments.",
    ],
    keyInsight: "Circuits are state transformations over time, and each gate contributes a distinct step.",
    stepHints: [
      "Initial state: |0⟩.",
      "After H: state spreads across basis states.",
      "After Z: relative phase changes.",
      "After H: final interference pattern appears.",
    ],
    practice: [
      "Reorder the last two gates and compare final probabilities.",
      "Pause at each step and match circuit position to statevector change.",
    ],
    quiz: {
      question: "In circuit diagrams, gates are applied in which direction?",
      options: ["Right to left", "Left to right", "Top to bottom only"],
      correctIndex: 1,
      explanation: "Correct: time flows from left to right in standard circuit notation.",
    },
    demoCircuit: {
      numQubits: 1,
      gates: [
        { type: "H", target: 0 },
        { type: "Z", target: 0 },
        { type: "H", target: 0 },
      ],
    },
  },
  {
    id: "interference",
    title: "Interference",
    description: "How amplitudes add and cancel (H → H returns to |0⟩)",
    content: [
      "Quantum probabilities come from amplitudes, not direct probabilities. Amplitudes can add or cancel.",
      "Two Hadamards in a row act like the identity: H(H(|0⟩)) = |0⟩.",
      "Watch how the state returns to the start even though there were intermediate superpositions.",
    ],
    keyInsight: "Interference can undo earlier changes: H followed by H returns the qubit to |0⟩.",
    stepHints: [
      "Initial state: |0⟩.",
      "After first H: the qubit is in superposition.",
      "After second H: amplitudes interfere and reconstruct |0⟩.",
    ],
    practice: [
      "Replace the second H with Z. What no longer gets canceled?",
      "Add a third H and observe the new endpoint.",
    ],
    quiz: {
      question: "What is the final state of |0⟩ after H then H?",
      options: ["|1⟩", "Equal superposition", "|0⟩"],
      correctIndex: 2,
      explanation: "Correct: H² is identity, so the state returns to |0⟩.",
    },
    demoCircuit: {
      numQubits: 1,
      gates: [
        { type: "H", target: 0 },
        { type: "H", target: 0 },
      ],
    },
  },
  {
    id: "phase",
    title: "Phase",
    description: "Relative phase and real vs imaginary amplitudes",
    content: [
      "The Z gate flips the phase of the |1⟩ component: α|0⟩ + β|1⟩ → α|0⟩ − β|1⟩.",
      "Amplitudes have real and imaginary parts; phase is encoded in their relative angle.",
      "A pure phase change may not alter immediate basis probabilities, but it changes later interference.",
    ],
    keyInsight: "Phase lives in complex amplitudes and only becomes visible through later operations.",
    stepHints: [
      "Initial state: |0⟩.",
      "After H: equal real amplitudes.",
      "After Z: sign/phase of the |1⟩ branch changes.",
      "Phase itself is subtle now, but it matters for subsequent gates.",
    ],
    practice: [
      "Append an H after Z and compare outcomes before/after adding it.",
      "Try X instead of Z to contrast phase change vs bit flip.",
    ],
    quiz: {
      question: "What does a Z gate primarily change?",
      options: ["Bit value directly", "Relative phase", "Number of qubits"],
      correctIndex: 1,
      explanation: "Correct: Z changes phase of the |1⟩ component.",
    },
    demoCircuit: {
      numQubits: 1,
      gates: [
        { type: "H", target: 0 },
        { type: "Z", target: 0 },
      ],
    },
  },
  {
    id: "rotation-gates",
    title: "Rotation Gates",
    description: "Continuous transforms with RX and RZ",
    content: [
      "RX(θ) and RZ(θ) rotate state around Bloch-sphere axes by angle θ.",
      "Unlike H/X/Z, rotations are continuous, so small angle changes produce smooth state changes.",
      "Rotation gates are essential building blocks in variational and hardware-native circuits.",
    ],
    keyInsight: "Rotation gates let you tune amplitudes and phase continuously, not just flip discrete states.",
    stepHints: [
      "Initial state: |0⟩.",
      "After RX(π/2): population begins moving from |0⟩ toward |1⟩.",
      "After RZ(π/2): phase adjusts without a direct bit flip.",
      "After final H: phase and population interact in the output.",
    ],
    practice: [
      "Change RX angle from π/2 to π/4 and compare measurement probabilities.",
      "Set RZ angle to π and observe how final interference changes.",
    ],
    quiz: {
      question: "What is the main difference between RX/RZ and gates like X/Z?",
      options: [
        "RX/RZ are continuous angle-based operations",
        "RX/RZ only work on classical bits",
        "RX/RZ always create entanglement",
      ],
      correctIndex: 0,
      explanation: "Correct: RX/RZ depend on a continuous angle parameter.",
    },
    demoCircuit: {
      numQubits: 1,
      gates: [
        { type: "RX", target: 0, angle: Math.PI / 2 },
        { type: "RZ", target: 0, angle: Math.PI / 2 },
        { type: "H", target: 0 },
      ],
    },
  },
  {
    id: "measurement-collapse",
    title: "Measurement Collapse",
    description: "How measurement selects a basis outcome",
    content: [
      "Before measurement, amplitudes encode possibilities; after measurement, one basis state is observed.",
      "That observed outcome becomes the post-measurement classical record for that shot.",
      "Collapse explains why repeated runs are needed to estimate probabilities.",
    ],
    keyInsight: "Measurement turns amplitude information into one sampled classical bitstring.",
    stepHints: ["Prepare superposition with H.", "Measure repeatedly and compare shot distributions."],
    practice: ["Try low shots versus high shots and compare stability.", "Apply X then H and inspect changed distribution."],
    quiz: {
      question: "What does collapse produce in one run?",
      options: ["A full probability table", "One sampled basis outcome", "A new qubit"],
      correctIndex: 1,
      explanation: "A single run returns one basis outcome sampled from the underlying probabilities.",
    },
    demoCircuit: { numQubits: 1, gates: [{ type: "H", target: 0 }] },
  },
  {
    id: "bloch-sphere-intuition",
    title: "Bloch Sphere Intuition",
    description: "Visualizing one-qubit states as rotations",
    content: [
      "Single-qubit pure states can be viewed as points on the Bloch sphere.",
      "X/Y/Z-like operations rotate state around different axes.",
      "This picture helps explain why rotation angles matter continuously.",
    ],
    keyInsight: "Many one-qubit circuits are geometric rotations in disguise.",
    stepHints: ["RX tilts population.", "RZ shifts phase direction."],
    practice: ["Change RX angle from pi/4 to pi/2.", "Insert Z and compare final interference."],
    quiz: {
      question: "Bloch sphere intuition is most useful for:",
      options: ["Three-qubit entanglement only", "Single-qubit rotations", "Classical sorting"],
      correctIndex: 1,
      explanation: "It is primarily a geometric model for one-qubit pure states and rotations.",
    },
    demoCircuit: { numQubits: 1, gates: [{ type: "RX", target: 0, angle: Math.PI / 4 }, { type: "RZ", target: 0, angle: Math.PI / 3 }] },
  },
  {
    id: "phase-vs-amplitude",
    title: "Phase vs Amplitude",
    description: "Distinguishing probability weight from phase information",
    content: [
      "Amplitude magnitude controls measurement probability; phase controls interference behavior.",
      "Two states can have equal probabilities but different phases.",
      "Later gates convert hidden phase differences into visible output differences.",
    ],
    keyInsight: "Same probabilities now does not mean same state later.",
    stepHints: ["Use H to expose phase differences.", "Compare with and without Z."],
    practice: ["Run H-Z-H and compare to identity.", "Swap Z for X and inspect what changes immediately."],
    quiz: {
      question: "What determines immediate measurement probability?",
      options: ["Amplitude magnitude squared", "Circuit color", "Control wire order only"],
      correctIndex: 0,
      explanation: "Probabilities come from squared magnitude of amplitudes, while phase affects interference.",
    },
    demoCircuit: { numQubits: 1, gates: [{ type: "H", target: 0 }, { type: "Z", target: 0 }, { type: "H", target: 0 }] },
  },
  {
    id: "interference-deep-dive",
    title: "Quantum Interference Deep Dive",
    description: "Constructive and destructive amplitude combination",
    content: [
      "Interference is the mechanism behind many quantum speedups and algorithmic tricks.",
      "Constructive interference amplifies desired outcomes; destructive suppresses unwanted ones.",
      "Gate order and phase settings decide which pattern appears.",
    ],
    keyInsight: "Interference is programmable through phase and gate sequencing.",
    stepHints: ["Track state after each H/Z step.", "Notice which branches cancel at the end."],
    practice: ["Add an extra Z before final H.", "Replace final H with RX(pi/2) and inspect counts."],
    quiz: {
      question: "Destructive interference primarily does what?",
      options: ["Increases all outcomes equally", "Cancels amplitude on some outcomes", "Adds qubits"],
      correctIndex: 1,
      explanation: "Destructive interference reduces or cancels amplitude for selected branches.",
    },
    demoCircuit: { numQubits: 1, gates: [{ type: "H", target: 0 }, { type: "Z", target: 0 }, { type: "H", target: 0 }, { type: "Z", target: 0 }] },
  },
  {
    id: "controlled-operations",
    title: "Controlled Operations",
    description: "Conditional logic with control/target roles",
    content: [
      "Controlled gates apply an operation only when the control condition is met.",
      "They are central to entanglement, arithmetic, and algorithm structure.",
      "Understanding control-target direction is critical for debugging circuits.",
    ],
    keyInsight: "Controlled gates encode quantum if-logic without measuring mid-circuit.",
    stepHints: ["Put control in superposition first.", "Then apply CX and inspect correlations."],
    practice: ["Flip control with X before CX.", "Swap control and target to compare behavior."],
    quiz: {
      question: "In CX, when does target flip?",
      options: ["Always", "Only if control is |1>", "Only if target is |1>"],
      correctIndex: 1,
      explanation: "CX is conditional: target flips when control is measured as 1 in the computational basis.",
    },
    demoCircuit: { numQubits: 2, gates: [{ type: "H", target: 0 }, { type: "CX", control: 0, target: 1 }] },
  },
  {
    id: "real-vs-imaginary",
    title: "Real vs Imaginary Components",
    description: "Complex amplitudes and why imaginary parts matter",
    content: [
      "Quantum amplitudes are complex numbers with real and imaginary components.",
      "Imaginary terms influence phase, even when probabilities look unchanged.",
      "Interference can reveal differences hidden in component representation.",
    ],
    keyInsight: "Imaginary components are physically meaningful through phase effects.",
    stepHints: ["Use sequences including RZ to create phase shifts.", "Apply H to convert phase into measurable change."],
    practice: ["Compare H-RZ(pi/2)-H with H-Z-H.", "Vary RZ angle and watch output probabilities."],
    quiz: {
      question: "Why keep imaginary components in statevectors?",
      options: ["They are formatting only", "They encode phase behavior", "They reduce qubit count"],
      correctIndex: 1,
      explanation: "Imaginary parts are essential to phase, which drives interference and circuit outcomes.",
    },
    demoCircuit: { numQubits: 1, gates: [{ type: "H", target: 0 }, { type: "RZ", target: 0, angle: Math.PI / 2 }, { type: "H", target: 0 }] },
  },
  {
    id: "noise-and-errors",
    title: "Noise and Errors (Basic)",
    description: "Why ideal simulations differ from hardware results",
    content: [
      "Real hardware has decoherence, gate imperfections, and readout errors.",
      "Ideal simulators are useful for intuition but can overestimate performance.",
      "Error-aware thinking is required when moving from simulation to deployment.",
    ],
    keyInsight: "Hardware noise changes measured distributions and reliability.",
    stepHints: ["Use simulator as baseline.", "Predict how small disturbances alter target outcomes."],
    practice: ["Increase circuit depth and reason about accumulated error risk.", "Identify which gates are most sensitive to noise."],
    quiz: {
      question: "Why do hardware and ideal simulator outputs differ?",
      options: ["Different programming languages", "Noise and device imperfections", "Qubits stop being binary"],
      correctIndex: 1,
      explanation: "Hardware introduces physical noise sources absent in ideal statevector simulation.",
    },
    demoCircuit: { numQubits: 2, gates: [{ type: "H", target: 0 }, { type: "CX", control: 0, target: 1 }, { type: "H", target: 1 }] },
  },
  {
    id: "applications-overview",
    title: "Applications Overview",
    description: "Where quantum computing can provide value",
    content: [
      "Applications include optimization, chemistry simulation, cryptography research, and machine learning experiments.",
      "Near-term utility depends on algorithm quality and noise handling.",
      "Good engineering combines quantum intuition with classical orchestration.",
    ],
    keyInsight: "Practical value comes from workflow integration, not quantum circuits alone.",
    stepHints: ["Map circuit behavior to task goals.", "Think in hybrid quantum-classical loops."],
    practice: ["Describe one optimization workflow using this simulator.", "Identify what extra tooling is needed for production."],
    quiz: {
      question: "A realistic near-term quantum workflow is usually:",
      options: ["Quantum-only", "Hybrid quantum + classical", "Completely manual"],
      correctIndex: 1,
      explanation: "Most practical pipelines are hybrid, using both quantum and classical compute.",
    },
    demoCircuit: { numQubits: 2, gates: [{ type: "H", target: 0 }, { type: "RZ", target: 0, angle: Math.PI / 3 }, { type: "CX", control: 0, target: 1 }] },
  },
];

