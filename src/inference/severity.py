import numpy as np
from typing import Tuple


def _entropy(probs: np.ndarray, eps: float = 1e-9) -> float:
    """
    Compute Shannon entropy of probability distribution.
    Higher entropy = more uncertainty.
    
    Args:
        probs: probability array
        eps: small epsilon to avoid log(0)
    
    Returns:
        Entropy value
    """
    p = np.clip(np.asarray(probs, dtype=np.float32), eps, 1.0)
    return float(-np.sum(p * np.log(p)))


def compute_severity_1_to_10(
    probs: np.ndarray,
    pred_idx: int,
    force_normal_zero: bool = True,
    heatmap_extent: float = None
) -> int:
    """
    Heuristic severity score for pneumonia severity estimation.
    
    LOGIC:
    - NORMAL prediction => severity 0 (if force_normal_zero=True)
    - PNEUMONIA prediction => severity 1..10 based on:
      * Pneumonia probability (p_bacterial + p_viral)
      * Confidence margin (top1 - top2 probability)
      * Entropy (model's confidence/certainty)
      * Optional heatmap extent (area of abnormality)
    
    INTERPRETATION (for clinical reference):
    1-3:   Low risk, likely mild/localized
    4-6:   Moderate risk, may need monitoring
    7-9:   High risk, immediate assessment recommended
    10:    Critical risk, urgent intervention needed
    
    Args:
        probs: softmax probabilities [p_normal, p_bacterial, p_viral]
        pred_idx: argmax index (0=NORMAL, 1=BACTERIAL, 2=VIRAL)
        force_normal_zero: if True, return 0 for NORMAL predictions
        heatmap_extent: optional normalized extent [0,1] of Grad-CAM heatmap
                        (future enhancement; not yet integrated)
    
    Returns:
        Severity score as integer in [0, 10]
    """
    probs = np.asarray(probs, dtype=np.float32)

    # =========== RULE 1: NORMAL => 0 ===========
    if force_normal_zero and pred_idx == 0:
        return 0

    # =========== PNEUMONIA SEVERITY FACTORS ===========
    
    # Factor 1: Pneumonia Probability
    # Sum of bacterial + viral probabilities indicates how likely pneumonia is
    p_pneu = float(probs[1] + probs[2])  # bacterial + viral
    
    # Factor 2: Confidence Margin
    # Difference between top and second-highest prediction
    # High margin = model is confident in its call
    sorted_probs = np.sort(probs)
    margin = float(sorted_probs[-1] - sorted_probs[-2])
    
    # Factor 3: Entropy (Uncertainty)
    # Low entropy = high confidence; high entropy = uncertain
    ent = _entropy(probs)
    ent_norm = ent / np.log(len(probs))  # normalize to ~[0, 1]
    
    # Factor 4: Pneumonia Type Distinction (optional)
    # Bacterial pneumonia is generally more severe than viral
    if pred_idx == 1:  # Bacterial
        type_multiplier = 1.05  # 5% increase for bacterial
    else:  # Viral (pred_idx == 2)
        type_multiplier = 1.0
    
    # =========== COMBINED SCORE ===========
    # Weighted combination emphasizing:
    #   - High pneumonia probability is the strongest signal
    #   - High confidence margin supports the diagnosis
    #   - Low entropy (high confidence) increases severity
    #   - Slight boost for bacterial vs viral
    
    raw_score = (
        (0.60 * p_pneu) +           # Dominant factor: how likely pneumonia is
        (0.25 * margin) +           # Secondary: how confident in top prediction
        (0.15 * (1.0 - ent_norm))   # Tertiary: penalize uncertainty
    )
    raw_score *= type_multiplier
    
    # Clamp to [0, 1]
    raw_score = float(np.clip(raw_score, 0.0, 1.0))
    
    # =========== MAP TO 1..10 SCALE ===========
    # Use sqrt to spread the range: avoids saturation around 9-10
    # This gives better granularity for 1-7 range (most cases)
    severity_float = 10.0 * np.sqrt(raw_score)
    sev = int(np.ceil(severity_float))
    
    # Ensure pneumonia predictions never drop to 0
    if pred_idx != 0:
        sev = max(sev, 1)
    
    # Final clamp
    return int(np.clip(sev, 0, 10))


def compute_severity_raw_components(
    probs: np.ndarray,
    pred_idx: int
) -> Tuple[float, float, float, float]:
    """
    DEBUG/ANALYSIS: Return individual severity components.
    
    Returns:
        (p_pneu, margin, entropy_normalized, confidence)
    """
    probs = np.asarray(probs, dtype=np.float32)
    
    p_pneu = float(probs[1] + probs[2])
    
    sorted_probs = np.sort(probs)
    margin = float(sorted_probs[-1] - sorted_probs[-2])
    
    ent = _entropy(probs)
    ent_norm = ent / np.log(len(probs))
    
    confidence = float(sorted_probs[-1])  # top probability
    
    return p_pneu, margin, ent_norm, confidence