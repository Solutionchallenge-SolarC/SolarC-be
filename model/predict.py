import os
import numpy as np
import tensorflow as tf
import cv2

from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model

# Constants
IMG_SIZE = (224, 224)
NUM_CLASSES = 7
MODEL_PATH = 'checkpoints/best_model.h5'

# Class labels
CLASS_LABELS = {
    "bkl": "Benign Keratosis",
    "nv": "Melanocytic Nevus",
    "mel": "Melanoma",
    "df": "Dermatofibroma",
    "vasc": "Vascular Lesion",
    "akiec": "Actinic Keratosis",
    "bcc": "Basal Cell Carcinoma"
}

# Lazy-loaded global model
model = None

def build_model(num_classes=NUM_CLASSES):
    base_model = EfficientNetB0(include_top=False, input_shape=(224, 224, 3))
    base_model.trainable = False

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    output = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=output)
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    return model

from tensorflow.keras.models import load_model  # 전체 모델 로드용

def load_model_weights(model_path=MODEL_PATH):
    global model
    if model is not None:
        return model

    model = build_model()  # ✅ 모델 구조 새로 생성
    if os.path.exists(model_path):
        try:
            model.load_weights(model_path)  # ✅ weight만 로드
            print(f"✅ Weights loaded from {model_path}")
        except Exception as e:
            print(f"❌ Error loading weights: {e}")
            model = None
    else:
        print(f"❌ Model file not found at {model_path}")
    return model



def preprocess_image(image_path):
    try:
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Image not found at {image_path}")

        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, IMG_SIZE)
        img = img / 255.0
        img = np.expand_dims(img, axis=0)
        return img
    except Exception as e:
        print(f"❌ Error in image preprocessing: {e}")
        return None

def predict_with_threshold(model, image_path, threshold=0.5):
    img = preprocess_image(image_path)
    if img is None:
        return {"error": "Invalid image input"}

    preds = model.predict(img)[0]

    high_confidence = {
        CLASS_LABELS[label]: float(preds[i])
        for i, label in enumerate(CLASS_LABELS.keys())
        if preds[i] >= threshold
    }

    high_confidence = dict(sorted(high_confidence.items(), key=lambda item: item[1], reverse=True))
    return high_confidence
