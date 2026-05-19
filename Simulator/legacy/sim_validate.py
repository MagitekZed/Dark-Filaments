"""
Python validation simulator — mirrors the Excel formulas to verify T1 and T2
timings without needing LibreOffice. Used for tuning loops and CI-style checks.

This is intentionally faithful to the spreadsheet logic:
  - Aggregate formulas: (sum of self_contrib × incoming_synergy) × global × carry_all + carry_floor
  - VPC: marginal income gain per level / next purchase cost
  - Save mode: next-OS-VPC > save_vpc_threshold × max_affordable_VPC
  - Post-cohesion focus: when cohesion met but completionists not maxed,
    non-completionist stackables are gated off

Outputs the same headline numbers we care about for calibration.
"""

import sys

# ---------- Parameters ----------
PARAMS = {
    "base_click_value": 1.0,
    "active_clicks_per_min": 100,
    "active_play_fraction": 1.00,
    "save_vpc_threshold": 1.5,
    "cohesion_T1_to_T2": 1.0,
    "cohesion_growth": 2.50,
}

# T2 carryover defaults (from sim's Parameters sheet)
CARRY_COMPLETION = {
    "mass": 315.0,
    "mps": 10.75,
    "mpc": 4.98,
    "aps": 0.0,
    "all_mps": 1.25,
    "all_mpc": 1.20,
    "all_aps": 1.0,
}
CARRY_THRESHOLD = {
    "mass": 80.0,
    "mps": 5.75,
    "mpc": 4.15,
    "aps": 0.0,
    "all_mps": 1.25,
    "all_mpc": 1.00,
    "all_aps": 1.0,
}


# ---------- T1 Upgrades ----------
T1_UPGRADES = {
    "Solar Wind":        dict(init=7,    growth=1.15, max=99, coh=0.0,
                               base_mps=0, add_mps=0.080, self_mps=1.0,
                               base_mpc=0, add_mpc=0,     self_mpc=1.0,
                               base_aps=0, add_aps=0,     self_aps=1.0,
                               all_mps=1.0, all_mpc=1.0, all_aps=1.0,
                               completionist=0, syn_target="", syn_mult=1.0),
    "Asteroid Belt":     dict(init=20,   growth=1.15, max=99, coh=0.0,
                               base_mps=0, add_mps=0.200, self_mps=1.0,
                               base_mpc=0, add_mpc=0,     self_mpc=1.0,
                               base_aps=0, add_aps=0,     self_aps=1.0,
                               all_mps=1.0, all_mpc=1.0, all_aps=1.0,
                               completionist=0, syn_target="", syn_mult=1.0),
    "Stellar Coupling":  dict(init=22,   growth=1.40, max=99, coh=0.0,
                               base_mps=0, add_mps=0,     self_mps=1.0,
                               base_mpc=0, add_mpc=0.350, self_mpc=1.0,
                               base_aps=0, add_aps=0,     self_aps=1.0,
                               all_mps=1.0, all_mpc=1.0, all_aps=1.0,
                               completionist=0, syn_target="", syn_mult=1.0),
    "Magnetosphere":     dict(init=80,   growth=2.00, max=5,  coh=0.0,
                               base_mps=0, add_mps=1.000, self_mps=1.0,
                               base_mpc=0, add_mpc=0,     self_mpc=1.0,
                               base_aps=0, add_aps=0,     self_aps=1.0,
                               all_mps=1.0, all_mpc=1.0, all_aps=1.0,
                               completionist=1, syn_target="", syn_mult=1.0),
    "Orbital Resonance": dict(init=240,  growth=1.0,  max=1,  coh=0.4,
                               base_mps=0, add_mps=0,     self_mps=1.0,
                               base_mpc=0, add_mpc=0,     self_mpc=1.0,
                               base_aps=0, add_aps=0,     self_aps=1.0,
                               all_mps=1.25, all_mpc=1.0, all_aps=1.0,
                               completionist=0, syn_target="", syn_mult=1.0),
    "Heliopause":        dict(init=575,  growth=1.0,  max=1,  coh=0.6,
                               base_mps=0, add_mps=0,     self_mps=1.0,
                               base_mpc=0, add_mpc=0,     self_mpc=1.0,
                               base_aps=0, add_aps=0,     self_aps=1.0,
                               all_mps=1.0, all_mpc=1.0, all_aps=1.0,
                               completionist=0, syn_target="Stellar Coupling", syn_mult=1.5),
    "First Photons":     dict(init=850,  growth=1.0,  max=1,  coh=0.0,
                               base_mps=1.0, add_mps=0,   self_mps=1.0,
                               base_mpc=0,   add_mpc=0,   self_mpc=1.0,
                               base_aps=0,   add_aps=0,   self_aps=1.0,
                               all_mps=1.0,  all_mpc=1.20, all_aps=1.0,
                               completionist=1, syn_target="", syn_mult=1.0),
}

T1_NAMES = ["Solar Wind", "Asteroid Belt", "Stellar Coupling", "Magnetosphere",
            "Orbital Resonance", "Heliopause", "First Photons"]
T1_STACKABLES = ["Solar Wind", "Asteroid Belt", "Stellar Coupling", "Magnetosphere"]
T1_ONESHOTS = ["Orbital Resonance", "Heliopause", "First Photons"]
T1_COMPLETIONIST = ["Magnetosphere", "First Photons"]
T1_SHORT = {"Solar Wind": "SW", "Asteroid Belt": "AB", "Stellar Coupling": "SC",
            "Magnetosphere": "Mag", "Orbital Resonance": "OR", "Heliopause": "HP",
            "First Photons": "FP"}


# ---------- T2 Upgrades ----------
T2_UPGRADES = {
    "Stellar Kinematics":   dict(init=60,    growth=1.15, max=99, coh=0.0,
                                  base_mps=0, add_mps=0.65,  self_mps=1.0,
                                  base_mpc=0, add_mpc=0,     self_mpc=1.0,
                                  base_aps=0, add_aps=0,     self_aps=1.0,
                                  all_mps=1.0, all_mpc=1.0, all_aps=1.0,
                                  completionist=0, syn_target="", syn_mult=1.0),
    "Local Bubble":         dict(init=180,   growth=1.15, max=99, coh=0.0,
                                  base_mps=0, add_mps=1.80,  self_mps=1.0,
                                  base_mpc=0, add_mpc=0,     self_mpc=1.0,
                                  base_aps=0, add_aps=0,     self_aps=1.0,
                                  all_mps=1.0, all_mpc=1.0, all_aps=1.0,
                                  completionist=0, syn_target="", syn_mult=1.0),
    "Microlensing":         dict(init=200,   growth=1.40, max=99, coh=0.0,
                                  base_mps=0, add_mps=0,     self_mps=1.0,
                                  base_mpc=0, add_mpc=2.80,  self_mpc=1.0,
                                  base_aps=0, add_aps=0,     self_aps=1.0,
                                  all_mps=1.0, all_mpc=1.0, all_aps=1.0,
                                  completionist=0, syn_target="", syn_mult=1.0),
    "Roche Lobe Overflow":  dict(init=350,   growth=1.50, max=99, coh=0.0,
                                  base_mps=0, add_mps=0,     self_mps=1.0,
                                  base_mpc=0, add_mpc=0,     self_mpc=1.0,
                                  base_aps=0, add_aps=0.10,  self_aps=1.0,
                                  all_mps=1.0, all_mpc=1.0, all_aps=1.0,
                                  completionist=0, syn_target="Local Bubble", syn_mult=1.05),
    "Brown Dwarf":          dict(init=2000,  growth=2.00, max=5,  coh=0.0,
                                  base_mps=0, add_mps=4.00,  self_mps=1.0,
                                  base_mpc=0, add_mpc=0,     self_mpc=1.0,
                                  base_aps=0, add_aps=0,     self_aps=1.0,
                                  all_mps=1.0, all_mpc=1.0, all_aps=1.0,
                                  completionist=1, syn_target="Roche Lobe Overflow", syn_mult=1.10),
    "Binary Partner":       dict(init=1400,  growth=1.0,  max=1,  coh=0.6,
                                  base_mps=0, add_mps=0,     self_mps=1.0,
                                  base_mpc=0, add_mpc=0,     self_mpc=1.0,
                                  base_aps=0, add_aps=0,     self_aps=1.0,
                                  all_mps=1.0, all_mpc=1.0, all_aps=1.0,
                                  completionist=0, syn_target="Microlensing", syn_mult=1.5),
    "Peculiar Velocity":    dict(init=2200,  growth=1.0,  max=1,  coh=0.9,
                                  base_mps=0, add_mps=0,     self_mps=1.0,
                                  base_mpc=0, add_mpc=0,     self_mpc=1.0,
                                  base_aps=0, add_aps=0,     self_aps=1.0,
                                  all_mps=1.30, all_mpc=1.0, all_aps=1.0,
                                  completionist=0, syn_target="", syn_mult=1.0),
    "Open Cluster":         dict(init=3400,  growth=1.0,  max=1,  coh=1.0,
                                  base_mps=0, add_mps=0,     self_mps=1.0,
                                  base_mpc=0, add_mpc=0,     self_mpc=1.0,
                                  base_aps=0, add_aps=0,     self_aps=1.0,
                                  all_mps=1.0, all_mpc=1.0, all_aps=1.0,
                                  completionist=0, syn_target="", syn_mult=1.0),
    "Moving Group":         dict(init=14000, growth=1.0,  max=1,  coh=0.0,
                                  base_mps=6.0, add_mps=0,   self_mps=1.0,
                                  base_mpc=0,   add_mpc=0,   self_mpc=1.0,
                                  base_aps=0,   add_aps=0,   self_aps=1.0,
                                  all_mps=1.0,  all_mpc=1.20, all_aps=1.0,
                                  completionist=1, syn_target="", syn_mult=1.0),
}

T2_NAMES = ["Stellar Kinematics", "Local Bubble", "Microlensing",
            "Roche Lobe Overflow", "Brown Dwarf",
            "Binary Partner", "Peculiar Velocity", "Open Cluster", "Moving Group"]
T2_STACKABLES = ["Stellar Kinematics", "Local Bubble", "Microlensing",
                 "Roche Lobe Overflow", "Brown Dwarf"]
T2_ONESHOTS = ["Binary Partner", "Peculiar Velocity", "Open Cluster", "Moving Group"]
T2_COMPLETIONIST = ["Brown Dwarf", "Moving Group"]
T2_SHORT = {"Stellar Kinematics": "SK", "Local Bubble": "LB", "Microlensing": "ML",
            "Roche Lobe Overflow": "RLO", "Brown Dwarf": "BD",
            "Binary Partner": "BiP", "Peculiar Velocity": "PV",
            "Open Cluster": "OC", "Moving Group": "MG"}


# ---------- Aggregation logic (mirrors Excel formulas) ----------
def self_contrib(upgrades, name, stat, levels):
    u = upgrades[name]
    lvl = levels[name]
    if lvl == 0:
        return 0.0
    base = u[f"base_{stat}"]
    add = u[f"add_{stat}"]
    selfm = u[f"self_{stat}"]
    return (base + lvl * add) * (selfm ** lvl)


def synergy_mult(upgrades, names, target_name, levels):
    """Product of incoming synergy multipliers from any provider in `names` targeting `target_name`."""
    m = 1.0
    for provider in names:
        if provider == target_name:
            continue
        u = upgrades[provider]
        if u["syn_target"] == target_name:
            m *= (u["syn_mult"] ** levels[provider])
    return m


def global_mult(upgrades, names, stat, levels):
    m = 1.0
    for n in names:
        m *= (upgrades[n][f"all_{stat}"] ** levels[n])
    return m


def aggregate(upgrades, names, stat, levels, base_value=0.0,
              carry_all=1.0, carry_floor=0.0):
    """(base_value + sum(self_contrib × synergy)) × global × carry_all + carry_floor."""
    s = base_value
    for n in names:
        s += self_contrib(upgrades, n, stat, levels) * synergy_mult(upgrades, names, n, levels)
    return s * global_mult(upgrades, names, stat, levels) * carry_all + carry_floor


def cost_of(upgrades, name, levels):
    u = upgrades[name]
    lvl = levels[name]
    if lvl >= u["max"]:
        return None
    return u["init"] * (u["growth"] ** lvl)


# ---------- T1 simulation ----------
def sim_t1(cpm=100, active_frac=1.0, max_ticks=400, verbose=False):
    levels = {n: 0 for n in T1_NAMES}
    mass = 0.0
    cohesion = 0.0
    transitioned = False
    threshold_tick = None  # first tick where could-trans = 1
    transition_tick = None
    cum_purchases = 0

    # For each tick (10 sec each)
    for tick in range(0, max_ticks + 1):
        # Compute MPC, MPS, APS
        mpc = aggregate(T1_UPGRADES, T1_NAMES, "mpc", levels,
                        base_value=PARAMS["base_click_value"])
        mps = aggregate(T1_UPGRADES, T1_NAMES, "mps", levels)
        aps = aggregate(T1_UPGRADES, T1_NAMES, "aps", levels)

        # Income for this tick (10s)
        if not transitioned and tick > 0:
            click_inc = mpc * cpm / 60 * active_frac * 10
            auto_inc = aps * mpc * 10
            pass_inc = mps * 10
            mass += click_inc + auto_inc + pass_inc

        # Track threshold tick
        could_trans = (cohesion >= PARAMS["cohesion_T1_to_T2"]) and not transitioned
        if could_trans and threshold_tick is None:
            threshold_tick = tick

        # Decide action (only at tick > 0, or actually at any tick when affordable)
        if transitioned:
            if verbose and transition_tick == tick:
                pass
            continue

        # Costs and VPCs
        costs = {n: cost_of(T1_UPGRADES, n, levels) for n in T1_NAMES}

        # Trans? — cohesion met AND all completionists maxed
        all_completionist_owned = all(levels[n] >= T1_UPGRADES[n]["max"] for n in T1_COMPLETIONIST)
        if cohesion >= PARAMS["cohesion_T1_to_T2"] and all_completionist_owned:
            transitioned = True
            transition_tick = tick
            cohesion -= PARAMS["cohesion_T1_to_T2"]
            continue

        # Compute VPCs for stackables
        post_coh_focus = could_trans and not all_completionist_owned

        global_mps_now = global_mult(T1_UPGRADES, T1_NAMES, "mps", levels)
        global_mpc_now = global_mult(T1_UPGRADES, T1_NAMES, "mpc", levels)

        vpcs = {}
        for name in T1_STACKABLES:
            u = T1_UPGRADES[name]
            cost = costs[name]
            if cost is None:
                vpcs[name] = 0
                continue
            if name == "Stellar Coupling":
                # click-based
                delta = u["add_mpc"] * global_mpc_now * synergy_mult(T1_UPGRADES, T1_NAMES, name, levels) * cpm * active_frac / 60
            else:
                delta = u["add_mps"] * global_mps_now * synergy_mult(T1_UPGRADES, T1_NAMES, name, levels)
            vpcs[name] = delta / cost if cost > 0 else 0

        # Affordable stackables (with post-cohesion gating)
        non_compl = ["Solar Wind", "Asteroid Belt", "Stellar Coupling"]
        compl_stack = ["Magnetosphere"]
        aff_vpcs = {}
        for name in T1_STACKABLES:
            cost = costs[name]
            if cost is None or cost > mass:
                aff_vpcs[name] = 0
                continue
            if post_coh_focus and name in non_compl:
                aff_vpcs[name] = 0
                continue
            aff_vpcs[name] = vpcs[name]

        max_aff_vpc = max(aff_vpcs.values()) if aff_vpcs else 0

        # One-shot save VPCs
        # OR: 0.25 × current MPS (excluding any base contribution from FP)
        or_vpc = 0
        if levels["Orbital Resonance"] == 0:
            or_vpc = 0.25 * mps / T1_UPGRADES["Orbital Resonance"]["init"]
        # HP: 0.5 × SC's M/sec contribution
        hp_vpc = 0
        if levels["Heliopause"] == 0:
            sc_mpc = self_contrib(T1_UPGRADES, "Stellar Coupling", "mpc", levels)
            sc_syn = synergy_mult(T1_UPGRADES, T1_NAMES, "Stellar Coupling", levels)
            sc_per_sec = sc_mpc * sc_syn * global_mpc_now * cpm * active_frac / 60
            hp_vpc = 0.5 * sc_per_sec / T1_UPGRADES["Heliopause"]["init"]
        # FP: 1.0 × global_mps + 0.20 × current click M/sec
        fp_vpc = 0
        if levels["First Photons"] == 0:
            fp_passive = 1.0 * global_mps_now
            fp_click = 0.20 * mpc * cpm * active_frac / 60
            fp_vpc = (fp_passive + fp_click) / T1_UPGRADES["First Photons"]["init"]

        # Stackable save VPCs (when unaffordable)
        sw_save = vpcs["Solar Wind"] if (costs["Solar Wind"] is not None and costs["Solar Wind"] > mass) else 0
        ab_save = vpcs["Asteroid Belt"] if (costs["Asteroid Belt"] is not None and costs["Asteroid Belt"] > mass) else 0
        sc_save = vpcs["Stellar Coupling"] if (costs["Stellar Coupling"] is not None and costs["Stellar Coupling"] > mass) else 0
        mag_save = vpcs["Magnetosphere"] if (costs["Magnetosphere"] is not None and costs["Magnetosphere"] > mass) else 0
        next_os_vpc = max(or_vpc, hp_vpc, fp_vpc, sw_save, ab_save, sc_save, mag_save)

        # Save mode
        save_mode = next_os_vpc > PARAMS["save_vpc_threshold"] * max_aff_vpc

        # Action priority:
        # 1. cheapest affordable one-shot
        # 2. if save mode, do nothing
        # 3. else buy stackable with max VPC
        affordable_oneshots = []
        for name in T1_ONESHOTS:
            if levels[name] == 0 and costs[name] is not None and costs[name] <= mass:
                affordable_oneshots.append((costs[name], name))
        action = None
        if affordable_oneshots:
            affordable_oneshots.sort()
            action = affordable_oneshots[0][1]
        elif save_mode:
            action = None
        elif max_aff_vpc > 0:
            # pick stackable with max VPC
            best = max(aff_vpcs.items(), key=lambda kv: kv[1])
            if best[1] > 0:
                action = best[0]

        # Apply action
        if action is not None:
            cost = costs[action]
            mass -= cost
            levels[action] += 1
            cohesion += T1_UPGRADES[action]["coh"]
            cum_purchases += 1
            if verbose:
                t_min = tick * 10 / 60
                print(f"  T1 t={tick:3d} ({t_min:5.2f}m) bought {T1_SHORT[action]:4s} cost={cost:8.1f} mass_after={mass:8.1f} mps={mps:.2f}")

    # End of sim — gather state
    return {
        "transitioned": transitioned,
        "transition_tick": transition_tick,
        "transition_min": transition_tick * 10 / 60 if transition_tick else None,
        "threshold_tick": threshold_tick,
        "threshold_min": threshold_tick * 10 / 60 if threshold_tick else None,
        "final_levels": dict(levels),
        "final_mass": mass,
        "final_mpc": aggregate(T1_UPGRADES, T1_NAMES, "mpc", levels, base_value=PARAMS["base_click_value"]),
        "final_mps": aggregate(T1_UPGRADES, T1_NAMES, "mps", levels),
        "final_aps": aggregate(T1_UPGRADES, T1_NAMES, "aps", levels),
        "purchases": cum_purchases,
    }


# ---------- T2 simulation (similar logic with carryover) ----------
def sim_t2(carry, cpm=100, active_frac=1.0, max_ticks=400, verbose=False):
    levels = {n: 0 for n in T2_NAMES}
    mass = carry["mass"]
    cohesion = 0.0
    transitioned = False
    threshold_tick = None
    transition_tick = None
    cum_purchases = 0
    t2_to_t3_cohesion = PARAMS["cohesion_T1_to_T2"] * PARAMS["cohesion_growth"]  # 2.5
    # Track save-mode duration
    in_save = False
    save_start_tick = None
    save_durations = []

    for tick in range(0, max_ticks + 1):
        mpc = aggregate(T2_UPGRADES, T2_NAMES, "mpc", levels,
                        base_value=PARAMS["base_click_value"],
                        carry_all=carry["all_mpc"], carry_floor=carry["mpc"])
        mps = aggregate(T2_UPGRADES, T2_NAMES, "mps", levels,
                        carry_all=carry["all_mps"], carry_floor=carry["mps"])
        aps = aggregate(T2_UPGRADES, T2_NAMES, "aps", levels,
                        carry_all=carry["all_aps"], carry_floor=carry["aps"])

        if not transitioned and tick > 0:
            click_inc = mpc * cpm / 60 * active_frac * 10
            auto_inc = aps * mpc * 10
            pass_inc = mps * 10
            mass += click_inc + auto_inc + pass_inc

        could_trans = (cohesion >= t2_to_t3_cohesion) and not transitioned
        if could_trans and threshold_tick is None:
            threshold_tick = tick

        if transitioned:
            continue

        costs = {n: cost_of(T2_UPGRADES, n, levels) for n in T2_NAMES}
        all_compl_owned = all(levels[n] >= T2_UPGRADES[n]["max"] for n in T2_COMPLETIONIST)
        if cohesion >= t2_to_t3_cohesion and all_compl_owned:
            transitioned = True
            transition_tick = tick
            cohesion -= t2_to_t3_cohesion
            continue

        post_coh_focus = could_trans and not all_compl_owned

        global_mps_now = global_mult(T2_UPGRADES, T2_NAMES, "mps", levels)
        global_mpc_now = global_mult(T2_UPGRADES, T2_NAMES, "mpc", levels)
        global_aps_now = global_mult(T2_UPGRADES, T2_NAMES, "aps", levels)

        # Stackable VPCs
        vpcs = {}
        for name in T2_STACKABLES:
            u = T2_UPGRADES[name]
            cost = costs[name]
            if cost is None:
                vpcs[name] = 0
                continue
            if name == "Microlensing":
                delta = (u["add_mpc"] * global_mpc_now
                         * synergy_mult(T2_UPGRADES, T2_NAMES, name, levels)
                         * carry["all_mpc"]
                         * (cpm/60 * active_frac + aps))
            elif name == "Roche Lobe Overflow":
                # APS marginal × MPC + synergy gift to LB (5% of LB current contribution)
                self_delta = (u["add_aps"] * global_aps_now
                              * synergy_mult(T2_UPGRADES, T2_NAMES, name, levels)
                              * carry["all_aps"] * mpc)
                lb_current_mps = (self_contrib(T2_UPGRADES, "Local Bubble", "mps", levels)
                                  * synergy_mult(T2_UPGRADES, T2_NAMES, "Local Bubble", levels)
                                  * global_mps_now * carry["all_mps"])
                synergy_gift = lb_current_mps * 0.05
                delta = self_delta + synergy_gift
            elif name == "Brown Dwarf":
                self_delta = (u["add_mps"] * global_mps_now
                              * synergy_mult(T2_UPGRADES, T2_NAMES, name, levels)
                              * carry["all_mps"])
                rlo_current_aps = (self_contrib(T2_UPGRADES, "Roche Lobe Overflow", "aps", levels)
                                   * synergy_mult(T2_UPGRADES, T2_NAMES, "Roche Lobe Overflow", levels)
                                   * global_aps_now * carry["all_aps"])
                rlo_per_sec = rlo_current_aps * mpc
                synergy_gift = rlo_per_sec * 0.10
                delta = self_delta + synergy_gift
            else:
                # SK, LB: passive M/sec stackable
                delta = (u["add_mps"] * global_mps_now
                         * synergy_mult(T2_UPGRADES, T2_NAMES, name, levels)
                         * carry["all_mps"])
            vpcs[name] = delta / cost if cost > 0 else 0

        non_compl_stack = ["Stellar Kinematics", "Local Bubble", "Microlensing", "Roche Lobe Overflow"]
        aff_vpcs = {}
        for name in T2_STACKABLES:
            cost = costs[name]
            if cost is None or cost > mass:
                aff_vpcs[name] = 0
                continue
            if post_coh_focus and name in non_compl_stack:
                aff_vpcs[name] = 0
                continue
            aff_vpcs[name] = vpcs[name]
        max_aff_vpc = max(aff_vpcs.values()) if aff_vpcs else 0

        # One-shot save VPCs
        bip_vpc = 0
        if levels["Binary Partner"] == 0:
            ml_mpc = self_contrib(T2_UPGRADES, "Microlensing", "mpc", levels)
            ml_syn = synergy_mult(T2_UPGRADES, T2_NAMES, "Microlensing", levels)
            ml_per_sec = ml_mpc * ml_syn * global_mpc_now * carry["all_mpc"] * (cpm/60 * active_frac + aps)
            bip_vpc = 0.5 * ml_per_sec / T2_UPGRADES["Binary Partner"]["init"]
        pv_vpc = 0
        if levels["Peculiar Velocity"] == 0:
            pv_vpc = 0.30 * mps / T2_UPGRADES["Peculiar Velocity"]["init"]
        oc_vpc = 0
        if levels["Open Cluster"] == 0:
            oc_vpc = 0.0001 / T2_UPGRADES["Open Cluster"]["init"]
        mg_vpc = 0
        if levels["Moving Group"] == 0:
            mg_passive = 6.0 * global_mps_now * carry["all_mps"]
            mg_click = 0.20 * mpc * (cpm/60 * active_frac + aps)
            mg_vpc = (mg_passive + mg_click) / T2_UPGRADES["Moving Group"]["init"]

        # Stackable save (when unaffordable)
        sk_save = vpcs["Stellar Kinematics"] if (costs["Stellar Kinematics"] is not None and costs["Stellar Kinematics"] > mass) else 0
        lb_save = vpcs["Local Bubble"] if (costs["Local Bubble"] is not None and costs["Local Bubble"] > mass) else 0
        ml_save = vpcs["Microlensing"] if (costs["Microlensing"] is not None and costs["Microlensing"] > mass) else 0
        rlo_save = vpcs["Roche Lobe Overflow"] if (costs["Roche Lobe Overflow"] is not None and costs["Roche Lobe Overflow"] > mass) else 0
        bd_save = vpcs["Brown Dwarf"] if (costs["Brown Dwarf"] is not None and costs["Brown Dwarf"] > mass) else 0
        next_os_vpc = max(bip_vpc, pv_vpc, oc_vpc, mg_vpc, sk_save, lb_save, ml_save, rlo_save, bd_save)

        save_mode = next_os_vpc > PARAMS["save_vpc_threshold"] * max_aff_vpc

        # Track save mode start/stop
        if save_mode and not in_save:
            in_save = True
            save_start_tick = tick
        elif not save_mode and in_save:
            save_durations.append(tick - save_start_tick)
            in_save = False

        affordable_oneshots = []
        for name in T2_ONESHOTS:
            if levels[name] == 0 and costs[name] is not None and costs[name] <= mass:
                affordable_oneshots.append((costs[name], name))
        action = None
        if affordable_oneshots:
            affordable_oneshots.sort()
            action = affordable_oneshots[0][1]
        elif save_mode:
            action = None
        elif max_aff_vpc > 0:
            best = max(aff_vpcs.items(), key=lambda kv: kv[1])
            if best[1] > 0:
                action = best[0]

        if action is not None:
            cost = costs[action]
            mass -= cost
            levels[action] += 1
            cohesion += T2_UPGRADES[action]["coh"]
            cum_purchases += 1
            if verbose:
                t_min = tick * 10 / 60
                print(f"  T2 t={tick:3d} ({t_min:5.2f}m) bought {T2_SHORT[action]:4s} cost={cost:8.1f} mass_after={mass:8.1f} mps={mps:.2f} aps={aps:.3f} mpc={mpc:.2f}")

    return {
        "transitioned": transitioned,
        "transition_tick": transition_tick,
        "transition_min": transition_tick * 10 / 60 if transition_tick else None,
        "threshold_tick": threshold_tick,
        "threshold_min": threshold_tick * 10 / 60 if threshold_tick else None,
        "final_levels": dict(levels),
        "final_mass": mass,
        "purchases": cum_purchases,
        "save_durations_ticks": save_durations,
    }


def main():
    print("=" * 60)
    print("T1 baseline regression check (should match v1.2.1)")
    print("=" * 60)
    for cpm in [60, 100, 150]:
        r = sim_t1(cpm=cpm)
        thr = f"{r['threshold_min']:.2f}" if r['threshold_min'] is not None else "—"
        com = f"{r['transition_min']:.2f}" if r['transition_min'] is not None else "—"
        print(f"  cpm={cpm}: threshold={thr}m  completion={com}m  "
              f"levels SW={r['final_levels']['Solar Wind']} "
              f"AB={r['final_levels']['Asteroid Belt']} "
              f"SC={r['final_levels']['Stellar Coupling']} "
              f"Mag={r['final_levels']['Magnetosphere']}")

    # T1 100cpm full final state
    r1 = sim_t1(cpm=100)
    print(f"\n  T1@100cpm completion mass={r1['final_mass']:.1f} "
          f"MPC={r1['final_mpc']:.2f} MPS={r1['final_mps']:.2f}")

    print("\n" + "=" * 60)
    print("T2 — Completion-exit handoff")
    print("=" * 60)
    for cpm in [60, 100, 150]:
        r = sim_t2(CARRY_COMPLETION, cpm=cpm)
        thr = f"{r['threshold_min']:.2f}" if r['threshold_min'] is not None else "—"
        com = f"{r['transition_min']:.2f}" if r['transition_min'] is not None else "—"
        l = r['final_levels']
        print(f"  cpm={cpm}: threshold={thr}m  completion={com}m  purchases={r['purchases']}")
        print(f"    SK={l['Stellar Kinematics']} LB={l['Local Bubble']} ML={l['Microlensing']} "
              f"RLO={l['Roche Lobe Overflow']} BD={l['Brown Dwarf']} | "
              f"BiP={l['Binary Partner']} PV={l['Peculiar Velocity']} OC={l['Open Cluster']} MG={l['Moving Group']}")
        if r['save_durations_ticks']:
            longest = max(r['save_durations_ticks']) * 10
            total_save = sum(r['save_durations_ticks']) * 10
            print(f"    save stretches: longest={longest}s  total={total_save}s "
                  f"({len(r['save_durations_ticks'])} stretches)")

    print("\n" + "=" * 60)
    print("T2 — Threshold-exit handoff")
    print("=" * 60)
    for cpm in [60, 100, 150]:
        r = sim_t2(CARRY_THRESHOLD, cpm=cpm)
        thr = f"{r['threshold_min']:.2f}" if r['threshold_min'] is not None else "—"
        com = f"{r['transition_min']:.2f}" if r['transition_min'] is not None else "—"
        l = r['final_levels']
        print(f"  cpm={cpm}: threshold={thr}m  completion={com}m  purchases={r['purchases']}")
        print(f"    SK={l['Stellar Kinematics']} LB={l['Local Bubble']} ML={l['Microlensing']} "
              f"RLO={l['Roche Lobe Overflow']} BD={l['Brown Dwarf']} | "
              f"BiP={l['Binary Partner']} PV={l['Peculiar Velocity']} OC={l['Open Cluster']} MG={l['Moving Group']}")

    if "-v" in sys.argv:
        print("\n" + "=" * 60)
        print("Verbose T2@100cpm Completion-exit purchase log")
        print("=" * 60)
        sim_t2(CARRY_COMPLETION, cpm=100, verbose=True)


if __name__ == "__main__":
    main()
