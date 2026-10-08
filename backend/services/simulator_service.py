"""
Simulator Service
Provides numerical trajectory integration incorporating gravity, mass, and aerodynamic drag coefficient.
"""

import math
from typing import List
from backend.schemas.trajectory import SimulationRequest, SimulationResponse, TrajectoryPoint

def run_simulation(req: SimulationRequest) -> SimulationResponse:
    v0 = req.velocity
    angle_rad = math.radians(req.angle_deg)
    g = req.gravity
    m = req.mass_kg
    Cd = req.drag_coeff
    
    # Standard atmospheric density (kg/m^3)
    rho = 1.225
    # Reference area estimation based on mass (spherical cross-section approximation)
    radius = (3.0 * m / (4.0 * math.pi * 7850.0)) ** (1.0 / 3.0)
    area = math.pi * (radius ** 2)
    
    dt = 0.05
    t = 0.0
    x = 0.0
    y = 0.0
    vx = v0 * math.cos(angle_rad)
    vy = v0 * math.sin(angle_rad)
    
    points: List[TrajectoryPoint] = []
    max_height = 0.0
    apex_time = 0.0
    
    while y >= 0.0 and len(points) < req.num_points * 5:
        speed = math.sqrt(vx**2 + vy**2)
        points.append(TrajectoryPoint(
            t=round(t, 3),
            x=round(x, 2),
            y=round(y, 2),
            vx=round(vx, 2),
            vy=round(vy, 2),
            v=round(speed, 2)
        ))
        
        if y > max_height:
            max_height = y
            apex_time = t
            
        # Aerodynamic drag forces
        Fd = 0.5 * rho * (speed ** 2) * Cd * area
        ax = -(Fd / m) * (vx / speed) if speed > 0 else 0
        ay = -g - ((Fd / m) * (vy / speed)) if speed > 0 else -g
        
        # Euler numerical integration step
        x += vx * dt + 0.5 * ax * (dt ** 2)
        y += vy * dt + 0.5 * ay * (dt ** 2)
        vx += ax * dt
        vy += ay * dt
        t += dt
        
    # Interpolate down to specified num_points for clean rendering
    step_size = max(1, len(points) // req.num_points)
    sampled_points = points[::step_size]
    if points and sampled_points[-1] != points[-1]:
        sampled_points.append(points[-1])
        
    max_range = points[-1].x if points else 0.0
    total_time = points[-1].t if points else 0.0
    
    return SimulationResponse(
        points=sampled_points,
        max_range=round(max_range, 2),
        max_height=round(max_height, 2),
        total_flight_time=round(total_time, 2),
        apex_time=round(apex_time, 2),
        input_params=req
    )
