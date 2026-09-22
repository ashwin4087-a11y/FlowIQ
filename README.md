# FlowIQ 🚦

### Adaptive Urban Traffic Intelligence System

> **PREDICT → ADAPT → ACT**

FlowIQ is an adaptive urban traffic intelligence platform designed to move traffic management from fixed, reactive signal control toward **data-driven, predictive, and adaptive decision-making**.

The project brings together **computer vision, machine learning, reinforcement learning, edge/IoT devices, real-time communication, traffic simulation, and a browser-based 3D digital twin** into a single architecture.

The central idea is simple:

> **Observe traffic → understand the current state → predict what is coming → adapt the response → visualize and communicate the result.**

---

## 🚦 Why FlowIQ?

Urban traffic is dynamic.

Traffic demand changes by time of day, weather, road conditions, events, festivals, and emergencies. A junction that is perfectly balanced at one moment can become heavily congested minutes later.

FlowIQ is being developed around a continuous control loop:

```
        OBSERVE
           ↓
       PREDICT
           ↓
        ADAPT
           ↓
          ACT
           ↓
    Observe Again ↺
```

Rather than treating a traffic signal as an isolated timer, FlowIQ is designed to treat the junction as a **continuously changing system** whose state can be measured, predicted, and responded to.

---

# 🧠 System Architecture

FlowIQ follows a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                         FLOWIQ                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   EYES → MESSENGER → BRAIN → HANDS → VOICE             │
│                                                         │
│   Sensors      ESP32       AI       Signals    App     │
│   Cameras      MQTT        ML       Control    Alerts  │
│   Audio                    RL                            │
│                            Prediction                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 👁️ EYES — Sensing

The sensing layer is intended to collect information from:

- Traffic cameras
- Vehicle detection
- Audio
- IoT sensors
- Edge devices

The objective is to convert the physical environment into a structured **traffic state**.

### 📡 MESSENGER — Edge & Communication

The communication layer is intended to connect sensors and edge devices to the intelligence layer using technologies such as:

- ESP32
- Raspberry Pi
- MQTT
- Real-time APIs / WebSockets

### 🧠 BRAIN — Intelligence

The intelligence layer is the core of FlowIQ.

It is designed to combine:

- Computer vision
- Audio intelligence
- Traffic-state estimation
- Congestion prediction
- Traffic-surge modelling
- Reinforcement learning
- Decision logic

### 🚦 HANDS — Traffic Response

The output of the intelligence layer can be used to represent:

- Adaptive signal timing
- Junction state
- Emergency response
- Coordinated signal behaviour

Physical signal control is **not assumed to be implemented simply because the architecture supports it**. Real-world actuation requires dedicated safety validation and fail-safe mechanisms.

### 📱 VOICE — Commuter & Operator Interface

The application layer is intended to present:

- Traffic conditions
- Predictions
- Alerts
- Emergency events
- Junction status
- Digital-twin visualizations
- System health

---

# 🔮 Core Intelligence

## Computer Vision

FlowIQ uses vehicle detection as the foundation for understanding traffic.

The vision pipeline is intended to extract information such as:

- Vehicle presence
- Vehicle counts
- Vehicle categories
- Lane-level traffic
- Queue formation
- Congestion indicators

YOLO-based detection is being explored as the initial computer-vision approach.

The system will distinguish between:

```
Raw Camera Feed
      ↓
Vehicle Detection
      ↓
Structured Detections
      ↓
Traffic State
      ↓
Decision / Prediction
```

---

# 🔊 Audio Intelligence

FlowIQ includes an audio-intelligence track intended to detect emergency-vehicle sirens.

The initial problem formulation is intentionally conservative:

```
SIREN
  vs
NON-SIREN
```

The model is not assumed to reliably identify a specific emergency-vehicle type from audio alone unless the training data and evaluation demonstrate that capability.

The planned pipeline is:

```
WAV
 ↓
Resampling / Normalization
 ↓
Mono Conversion
 ↓
STFT
 ↓
Log-Mel Spectrogram
 ↓
Lightweight Classifier
 ↓
Siren Probability
 ↓
Temporal Smoothing
 ↓
Emergency Event
```

Audio detection produces an **event for the intelligence layer**. It should not directly actuate a physical traffic signal.

---

# 📈 Predictive Traffic Intelligence

FlowIQ is designed to go beyond measuring the present state.

The predictive layer can incorporate signals such as:

- Current traffic volume
- Lane occupancy
- Queue lengths
- Historical traffic patterns
- Time of day
- Event conditions
- Sudden demand changes
- Emergency events
- Incoming traffic

The intended progression is:

```
What is happening now?
          ↓
What is likely to happen next?
          ↓
What response should be considered?
```

This enables FlowIQ to explore predictive traffic management rather than purely reactive traffic monitoring.

---

# 🤖 Reinforcement Learning

Reinforcement learning is planned as the long-term decision-making approach for adaptive signal control.

SUMO is intended to provide the traffic-simulation environment in which signal-control policies can be developed and evaluated.

Conceptually:

```
Traffic State
      ↓
RL Agent
      ↓
Action
      ↓
Signal Configuration
      ↓
Traffic Simulation
      ↓
New Traffic State
      ↺
```

A conventional heuristic controller may be used as a **baseline** during development.

A heuristic rule is not presented as reinforcement learning.

Likewise, simulated behaviour is not presented as measured real-world performance.

---

# 🚑 Emergency Response

FlowIQ is designed to explore emergency-aware traffic coordination.

An intended workflow is:

```
Emergency Event
      ↓
Detection
      ↓
Validation / Confidence
      ↓
Traffic-State Awareness
      ↓
Route / Junction Decision
      ↓
Signal Coordination
      ↓
Green-Wave Behaviour
```

The digital twin can be used to demonstrate how surrounding traffic could respond to an emergency vehicle and how coordinated signals could be represented.

Any emergency button or demo mode in the prototype should be clearly marked as **simulation/demo behaviour** unless backed by a validated real deployment.

---

# 🎉 Traffic Surge & Festival Mode

Traffic demand can change sharply during:

- Festivals
- Concerts
- Sporting events
- Public gatherings
- School / college events
- Rush hours
- Other temporary demand surges

FlowIQ includes a planned surge-intelligence component to explore how these conditions affect traffic flow.

The intended chain is:

```
Demand Surge
    ↓
Higher Arrivals
    ↓
Queue Growth
    ↓
Junction Pressure
    ↓
Prediction
    ↓
Adaptive Response
```

Manually triggered festival or surge demonstrations will be explicitly identified as **simulated inputs**, not real-world forecasts.

---

# 🌐 3D Traffic Digital Twin

A major component of FlowIQ is a browser-based **3D traffic digital twin**.

This is intended to be more than a dashboard animation.

The digital twin represents a junction as an interactive environment containing:

- Roads
- Multiple lanes
- Lane markings
- Stop lines
- Sidewalks
- Traffic signals
- Vehicles
- Turning movements
- Queues
- Emergency vehicles
- Dynamic signal states

A typical junction model can be represented as:

```
                 NORTH
                   ↑
                   │
            ┌──────┼──────┐
            │      │      │
            │   ↑  │  ↑   │
            │      │      │
WEST  ←─────┼──────┼──────┼─────→  EAST
            │      │      │
            │   ↓  │  ↓   │
            │      │      │
            └──────┼──────┘
                   │
                   ↓
                 SOUTH
```

Vehicles are intended to follow defined lane paths rather than moving randomly.

---

# 🚗 Vehicle Simulation

Vehicles in the digital twin are intended to have explicit states such as:

```
APPROACHING
     ↓
FOLLOWING
     ↓
QUEUED
     ↓
STOPPED
     ↓
ACCELERATING
     ↓
TURNING
     ↓
CROSSING
     ↓
EXITING
```

The simulation is designed to support heterogeneous traffic including:

- Cars
- Motorcycles
- Buses
- Trucks
- Ambulances
- Fire trucks

Vehicles should:

- Respect traffic signals
- Stop at stop lines
- Maintain spacing
- Queue behind traffic
- Accelerate after green
- Decelerate when necessary
- Follow lane paths
- Turn through intersections
- Avoid collisions
- Exit the scene correctly

The goal is to create a useful urban-traffic representation while avoiding the claim that the model perfectly reproduces real-world Indian driving behaviour.

---

# 🛰️ IoT & Edge Computing

FlowIQ is designed to eventually extend into an edge-computing architecture.

### ESP32

Potential responsibilities include:

- Sensor acquisition
- Local telemetry
- Event generation
- MQTT communication

### Raspberry Pi

Potential responsibilities include:

- Edge inference
- Sensor aggregation
- Local traffic processing
- Communication with the central intelligence services

Conceptually:

```
Sensors
   ↓
ESP32
   ↓
MQTT
   ↓
Raspberry Pi / Edge
   ↓
FlowIQ Intelligence
   ↓
Application / Signal Layer
```

Exact production message topics and schemas will be documented when implemented.

---

# 📡 Real-Time State

A central design principle is the use of structured system state.

The frontend and visualization layers should consume state produced by the intelligence/backend layers rather than implementing their own independent traffic-control logic.

Representative state domains include:

- `TrafficState`
- `SignalState`
- `PredictionState`
- `EmergencyState`
- `VehicleState`

This creates a common source of truth for:

```
AI
 ↓
Backend
 ↓
Digital Twin
 ↓
Dashboard
```

---

# 🧪 Simulation: SUMO vs Digital Twin

FlowIQ deliberately separates its traffic simulation and visualization responsibilities.

### SUMO

SUMO is intended for:

- Traffic simulation
- Reinforcement-learning experiments
- Quantitative evaluation
- Policy testing
- Benchmarking

### Browser 3D Digital Twin

The digital twin is intended for:

- Visualization
- Demonstration
- Interactive exploration
- System-state representation
- Human understanding

In other words:

```
SUMO
→ Train / Test / Evaluate

3D Digital Twin
→ Visualize / Demonstrate / Interact
```

The browser digital twin is **not** claimed to be SUMO itself.

---

# 🖥️ Web Application

The FlowIQ application is intended to bring the system together in one interface.

### Traffic Dashboard

Potential views include:

- Junction condition
- Traffic density
- Queue levels
- Signal state
- Traffic trends

### Intelligence

- Predictions
- Congestion indicators
- Surge state
- Decision state

### Emergency

- Emergency events
- Emergency route state
- Coordinated signal behaviour

### Digital Twin

- 3D junction
- Vehicle movement
- Signal visualization
- Density controls
- Emergency demonstrations

### System Health

- Backend status
- AI service status
- Edge connectivity
- Sensor state

---

# 🗂️ Repository Structure

The repository is organized by system responsibility:

```
FlowIQ/
│
├── frontend/                 # React web application
│
├── server/                   # Backend and realtime services
│
├── ml/
│   ├── audio/                # Siren / audio intelligence
│   ├── vision/               # Traffic computer vision
│   └── surge/                # Traffic surge / prediction
│
├── simulation/
│   ├── sumo/                 # Traffic + RL simulation
│   └── digital-twin/         # Browser 3D traffic environment
│
├── hardware/
│   ├── esp32/                # ESP32 firmware / experiments
│   └── raspberry-pi/         # Edge computing
│
├── data/                     # Dataset metadata / processing
├── scripts/                  # Utility and development scripts
│
├── docs/
│   └── FLOWIQ_AI_CONTEXT.md  # Canonical architecture/context
│
├── .gitignore
└── README.md
```

Large datasets, raw audio, generated model weights, secrets, and environment-specific artifacts should remain outside normal source control where appropriate.

---

# 🧰 Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Three.js / React Three Fiber
- Recharts
- Lucide

## Backend

- Node.js
- Express
- Socket.IO
- MongoDB / Mongoose where appropriate

## Machine Learning

- Python
- PyTorch / TensorFlow as appropriate
- NumPy
- Pandas
- Librosa
- OpenCV
- Ultralytics YOLO

## Simulation

- SUMO
- TraCI
- Reinforcement Learning

## Edge / IoT

- ESP32
- Raspberry Pi
- MQTT

---

# 📊 Data & Evaluation

FlowIQ treats data and evaluation as first-class components of the project.

Potential traffic-vision data sources include Indian traffic datasets such as:

- BMD-45
- ITD
- DATS 2022
- IRUVD
- Pune Heterogeneous Traffic Count Dataset

The audio track currently explores:

- ESC-50
- Additional ambulance / firetruck / traffic audio

Dataset provenance, licensing, preprocessing, train/validation/test separation, and leakage prevention should be documented for each model.

### No fabricated metrics

The repository will not claim:

- Accuracy
- Precision
- Recall
- F1
- Latency
- Throughput
- Congestion reduction
- Travel-time improvement

unless those values have been measured and documented.

---

# 🔐 Safety & Engineering Principles

FlowIQ is being developed with a strict distinction between **research software, simulation, and real-world infrastructure**.

### No fake AI

A heuristic controller is not called an RL controller.

### No fake predictions

A manually generated scenario is not presented as a machine-learning forecast.

### No fake deployment

A browser simulation is not presented as physical traffic infrastructure.

### Simulation first

Traffic-control policies should be tested in simulation and controlled environments before any real-world actuation.

### Audio is an event source

A siren detector should produce an event; the decision layer determines how that event is handled.

### Fail-safe operation

Any eventual physical signal-control system would require independent safety mechanisms, validation, and appropriate regulatory/engineering review.

---

# 🚧 Development Status

FlowIQ is an active research and development project.

| Component | Status |
|---|---|
| Core architecture | 🟢 Defined |
| Web dashboard | 🟡 In development |
| Backend API | 🟡 In development |
| Computer vision | 🟡 In development |
| Audio intelligence | 🟡 In development |
| Traffic prediction | 🟡 Planned / developing |
| Surge prediction | 🟡 Planned |
| Reinforcement learning | 🟡 Planned |
| SUMO integration | 🟡 Planned |
| 3D digital twin | 🟡 In development |
| ESP32 integration | 🟡 Planned |
| MQTT communication | 🟡 Planned |
| Raspberry Pi edge layer | 🟡 Planned |
| Physical signal actuation | 🔴 Not implemented |

Statuses should be updated as features become implemented and experimentally validated.

---

# 🗺️ Roadmap

### Phase 1 — Foundation

- Stabilize application architecture
- Define shared state
- Establish backend contracts
- Establish development tooling

### Phase 2 — Traffic Perception

- Vehicle detection
- Traffic-state extraction
- Lane-level representation
- Queue estimation

### Phase 3 — Audio Intelligence

- Dataset manifest
- Preprocessing
- Leakage-safe splitting
- Log-Mel features
- Siren classifier
- Evaluation
- Inference API

### Phase 4 — Prediction

- Historical traffic state
- Congestion forecasting
- Demand prediction
- Surge modelling

### Phase 5 — Reinforcement Learning

- SUMO environment
- State representation
- Action representation
- Reward design
- Training
- Evaluation against baseline control

### Phase 6 — Digital Twin

- 3D junction geometry
- Lane paths
- Vehicle behaviour
- Signal synchronization
- Emergency vehicle behaviour
- Shared live state

### Phase 7 — Edge Integration

- ESP32
- MQTT
- Raspberry Pi
- Sensor integration
- Edge inference

### Phase 8 — Deployment

- Production frontend
- Backend deployment
- ML services
- Environment configuration
- Monitoring
- Documentation

---

# 🎯 Long-Term Vision

FlowIQ aims to explore a transition in urban traffic management:

```
FIXED
  ↓
REACTIVE
  ↓
ADAPTIVE
  ↓
PREDICTIVE
```

The long-term vision is a traffic intelligence system that can continuously:

**Observe → Understand → Predict → Decide → Act → Learn**

while keeping humans, safety mechanisms, and transparent system state at the center of the architecture.

---

# ⚠️ Current Scope

FlowIQ is a research and development prototype.

The project does **not currently claim autonomous control of public-road traffic infrastructure**.

Simulation results, digital-twin behaviour, demo emergency modes, and prototype AI outputs should be interpreted according to their documented implementation status.

Any future public-road deployment would require appropriate:

- Safety engineering
- Hardware validation
- Fail-safe mechanisms
- Regulatory compliance
- Cybersecurity controls
- Real-world testing
- Domain-specific certification / approval where applicable

---

# 📚 Documentation

The canonical architecture and development context are maintained in:

```
docs/FLOWIQ_AI_CONTEXT.md
```

Subsystem-specific documentation should remain close to the corresponding implementation.

---

# 🤝 Development Principles

FlowIQ is designed as a modular system.

Changes should preserve separation between:

- Data acquisition
- AI inference
- Prediction
- Decision-making
- Simulation
- Visualization
- Hardware
- Deployment

Implementation evidence should take precedence over assumptions, placeholders, or visual demonstrations.

---

# 📄 License

License information will be finalized after reviewing the project's source-code, dependency, and dataset licensing requirements.

---

## FlowIQ 🚦

### **PREDICT → ADAPT → ACT**

**Adaptive intelligence for the next generation of urban traffic systems.**
