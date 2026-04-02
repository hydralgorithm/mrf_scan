import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

def evaluate_multiclass(model, dataset, class_names):
    y_true = []
    y_pred = []

    for x, y in dataset:
        probs = model.predict(x, verbose=0)
        preds = np.argmax(probs, axis=1)
        y_true.extend(y.numpy().tolist())
        y_pred.extend(preds.tolist())

    cm = confusion_matrix(y_true, y_pred)
    report = classification_report(y_true, y_pred, target_names=class_names, digits=4, output_dict=True)

    # macro recall = average of per-class recalls
    macro_recall = report["macro avg"]["recall"]

    return cm, report, macro_recall
