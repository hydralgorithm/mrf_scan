import numpy as np

def _entropy(probs, eps=1e-9):
    p = np.clip(np.asarray(probs, dtype=np.float32), eps, 1.0)
    return float(-np.sum(p * np.log(p)))

def compute_severity_1_to_10(probs, pred_idx, force_normal_zero=True):
    """
    Heuristic severity score for demo:
    - Normal => 0 (if force_normal_zero=True)
    - Pneumonia => 1..10

    probs: softmax [p_normal, p_bacterial, p_viral]
    pred_idx: argmax index
    """
    probs = np.asarray(probs, dtype=np.float32)

    # If predicted NORMAL => severity 0 (recommended for demo clarity)
    if force_normal_zero and pred_idx == 0:
        return 0

    # Pneumonia probability (how likely pneumonia overall)
    p_pneu = float(probs[1] + probs[2])  # bacterial + viral

    # Margin: how confident the model is in its top class
    s = np.sort(probs)
    margin = float(s[-1] - s[-2])  # top1 - top2

    # Entropy: uncertainty measure (high entropy = uncertain)
    ent = _entropy(probs)
    ent_norm = ent / np.log(len(probs))  # normalize to ~[0,1]

    # We want "higher severity" when pneumonia prob is high AND model is decisively pneumonia.
    # Penalize uncertainty slightly so borderline cases don't become severity 10.
    raw = (0.75 * p_pneu) + (0.35 * margin) - (0.25 * ent_norm)

    # Clamp to [0,1]
    raw = float(np.clip(raw, 0.0, 1.0))

    # Map to 1..10 with a curve to avoid saturation.
    # sqrt spreads mid-range; prevents always hitting 10.
    sev = int(np.ceil(10 * np.sqrt(raw)))

    # If pneumonia predicted but sev lands 0, bump to 1
    if pred_idx != 0:
        sev = max(sev, 1)

    return int(np.clip(sev, 0, 10))

def compute_combined_severity(
    classification: str,
    curb65_score: int,
    base_severity: int = None
) -> int:
    """
    Compute final severity score combining CURB-65 and model prediction.
    
    Args:
        classification: "NORMAL", "BACTERIAL_PNEUMONIA", or "VIRAL_PNEUMONIA"
        curb65_score: CURB-65 score (0-5)
        base_severity: Optional base severity from model (0-10)
    
    Returns:
        Final severity score (0-10)
    """
    # If NORMAL, return 0
    if classification == "NORMAL":
        return 0
    
    # Map CURB-65 to base severity
    if curb65_score <= 1:
        base_sev = 2
    elif curb65_score == 2:
        base_sev = 5
    else:  # 3-5
        base_sev = 8
    
    # Add +1 for bacterial pneumonia (higher risk)
    if classification == "BACTERIAL_PNEUMONIA":
        base_sev = min(base_sev + 1, 10)
    
    return min(base_sev, 10)
