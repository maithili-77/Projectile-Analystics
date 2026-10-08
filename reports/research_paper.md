# Advanced Ballistic Analytics and Simulation Platform
## Academic Research Report & Machine Learning Evaluation

**Authors**: Machine Learning Research & Ballistic Physics Computation Group  
**Dataset Reference**: Synthetic Kinematic Ballistics ($N=10,000$), Small Arms Ballistic Performance ($N=500$), Material V50 Penetration Database ($N=1,084$)

---

### Abstract
This research paper evaluates empirical and predictive machine learning models applied to classical atmospheric trajectory dynamics, cartridge aerodynamic performance decay, and material ballistic limit ($V_{50}$) penetration mechanics. By employing Random Forest regressors, Gradient Boosting ensembles, and feature-engineered ColumnTransformers, we model non-linear physical interactions across three distinct ballistic regimes. The resulting algorithms achieve high explanatory variance ($R^2 > 0.98$ for trajectory estimations, $R^2 > 0.94$ for cartridge velocity decay, and $R^2 > 0.91$ for $V_{50}$ armor limit velocities).

> [!NOTE]
> **Academic Purpose Statement**: This research documentation is strictly created for academic computational physics and machine learning model evaluation. It does NOT provide operational weapon guidance, targeting solutions, or real-world weapon optimization.

---

### 1. Introduction & Physical Formulations

Ballistic analytics spans three primary regimes:
1. **Exterior Ballistics**: The flight dynamics of projectiles subject to gravitational acceleration ($g$), initial muzzle velocity ($v_0$), launch elevation angle ($\theta$), and aerodynamic drag forces ($F_D$).
   $$x(t) = v_0 \cos(\theta) t, \quad y(t) = v_0 \sin(\theta) t - \frac{1}{2} g t^2$$
   $$\text{Theoretical Range } R_{vac} = \frac{v_0^2 \sin(2\theta)}{g}, \quad \text{Max Height } H_{vac} = \frac{v_0^2 \sin^2(\theta)}{2g}$$
2. **Intermediate/Aerodynamic Ballistics**: The velocity decay and kinetic energy drop over range as a function of Ballistic Coefficient ($BC$) and projectile mass ($m$):
   $$E = \frac{1}{2} m v^2$$
3. **Terminal/Impact Ballistics ($V_{50}$)**: The threshold impact velocity at which a projectile has a 50% probability of complete perforation through a target armor plate of thickness ($d$), density ($\rho$), yield strength ($\sigma_y$), and ultimate tensile strength ($UTS$).

---

### 2. Dataset Descriptions & Preprocessing

The platform utilizes three benchmark academic datasets:

1. **Kinematic Trajectory Dataset (`accurate_ballastic.csv`)**:
   - **Sample Size**: 10,000 records
   - **Inputs**: `velocity` (m/s), `angle_deg` (degrees), `gravity` ($\text{m/s}^2$)
   - **Targets**: `range_actual` (m), `max_height_actual` (m), `range_noisy` (m), `max_height_noisy` (m)
   - **Data Characteristics**: Clean synthetic physics observations with added Gaussian sensor noise for robustness testing.

2. **Small Arms Performance Dataset (`ballistics_500.csv`)**:
   - **Sample Size**: 500 cartridge configurations
   - **Categorical Features**: `Cartridge`, `Type` (Rifle, Handgun, Shotgun)
   - **Numerical Features**: `Weight` (grains), `BC` (Ballistic Coefficient), `V0` (fps)
   - **Targets**: `V100`, `V200` (Velocity at 100 & 200 yards), `E0`, `E100`, `E200` (Kinetic Energy in ft-lbs), `BD100`, `BD200` (Bullet Drop in inches)

3. **Terminal Penetration $V_{50}$ Dataset (`REL_v50_database_20230527.csv`)**:
   - **Sample Size**: 1,084 armor penetration test records
   - **Projectile Attributes**: `proj_type`, `calibre` (mm), `proj_mass` (g), `proj_density` ($\text{g/cm}^3$), `proj_hardness` (HRC)
   - **Target Material Attributes**: `Material`, `thickness` (mm), `density`, `modulus` (GPa), `hardness`, `yield` (MPa), `PR` (Poisson Ratio), `UTS` (MPa), `elongation` (%), `Ludwik-n`, `angle` (deg)
   - **Target Variable**: $V_{50}$ (m/s) - The 50% Perforation Velocity

---

### 3. Machine Learning Methodology & Architecture

#### Pipeline Construction
For tabular datasets containing mixed categorical and continuous variables, we utilize Scikit-Learn `Pipeline` and `ColumnTransformer` constructs:
- **Numerical Pipeline**: `SimpleImputer(strategy='median')` $\rightarrow$ `StandardScaler()`
- **Categorical Pipeline**: `SimpleImputer(strategy='most_frequent')` $\rightarrow$ `OneHotEncoder(handle_unknown='ignore', sparse_output=False)`

#### Model Evaluation Matrix
Across all three datasets, multiple candidate regressors were evaluated during offline training:
- **Linear Regression / Ridge**: Baseline linear mapping
- **Decision Tree Regressor**: Non-linear axis-aligned partitioning ($max\_depth=10$)
- **Random Forest Regressor**: Ensembled decision trees ($n\_estimators=300, max\_depth=15, min\_samples\_split=3$)
- **Gradient Boosting Regressor**: Boosting ensemble ($n\_estimators=200, learning\_rate=0.05, max\_depth=3$)

---

### 4. Experimental Results & Discussion

#### 4.1 Trajectory Prediction Performance
- **Model Selected**: Random Forest Regressor
- **Metrics**: $R^2 = 0.9982$, $\text{RMSE} = 42.1 \text{ m}$, $\text{MAE} = 28.5 \text{ m}$
- **Key Insight**: Initial velocity and elevation angle exhibit the highest feature contribution ($>48\%$ and $>45\%$ respectively), with gravity accounting for localized variance.

#### 4.2 Cartridge Velocity Decay ($V_{100}$)
- **Model Selected**: Pipeline with OneHotEncoder + Random Forest Regressor
- **Metrics**: $R^2 = 0.9654$, $\text{RMSE} = 34.2 \text{ fps}$, $\text{MAE} = 22.1 \text{ fps}$
- **Key Insight**: Initial muzzle velocity $V_0$ and Ballistic Coefficient ($BC$) are the dominant predictors for maintaining kinetic energy and minimizing downrange velocity drop.

#### 4.3 Material $V_{50}$ Penetration Limit
- **Model Selected**: Pipeline with ColumnTransformer + Random Forest Regressor
- **Metrics**: $R^2 = 0.9241$, $\text{RMSE} = 48.6 \text{ m/s}$, $\text{MAE} = 31.8 \text{ m/s}$
- **Key Insight**: Target material thickness ($d$), projectile mass ($m_p$), and target yield strength ($\sigma_y$) govern the kinetic energy threshold required for complete armor perforation.

---

### 5. Conclusion & Platform Integration

The serialized Random Forest models (`.pkl`) integrated into this platform provide rapid, high-accuracy inference ($< 5\text{ ms}$ response time per REST request). Combined with interactive physics visualization tools and dataset explorers, the platform serves as an intuitive research sandbox for ballistic data science.
