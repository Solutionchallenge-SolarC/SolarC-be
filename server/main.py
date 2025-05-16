# main.py
import os
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint

def train_model():
    IMG_SIZE = (224, 224)
    BATCH_SIZE = 32
    EPOCHS = 20

    ROUND_FILE_PATH = 'checkpoints/training_round.txt'
    CHECKPOINT_DIR = 'checkpoints'
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)

    if os.path.exists(ROUND_FILE_PATH):
        with open(ROUND_FILE_PATH, 'r') as f:
            TRAINING_ROUND = int(f.read().strip()) + 1
    else:
        TRAINING_ROUND = 1

    with open(ROUND_FILE_PATH, 'w') as f:
        f.write(str(TRAINING_ROUND))

    CHECKPOINT_PATH = os.path.join(CHECKPOINT_DIR, f'best_model_round_{TRAINING_ROUND}.h5')

    BASE_DIR = './'
    IMAGE_DIR_1 = os.path.join(BASE_DIR, 'HAM10000_images_part_1')
    IMAGE_DIR_2 = os.path.join(BASE_DIR, 'HAM10000_images_part_2')
    METADATA_PATH = os.path.join(BASE_DIR, 'HAM10000_metadata.csv')

    metadata = pd.read_csv(METADATA_PATH)
    metadata['image_path'] = metadata['image_id'].apply(
        lambda x: os.path.join(IMAGE_DIR_1, x + '.jpg') if os.path.exists(os.path.join(IMAGE_DIR_1, x + '.jpg'))
        else os.path.join(IMAGE_DIR_2, x + '.jpg')
    )

    train_metadata = metadata.sample(frac=0.8, random_state=42)
    temp_metadata = metadata.drop(train_metadata.index)
    valid_metadata = temp_metadata.sample(frac=0.5, random_state=42)
    test_metadata = temp_metadata.drop(valid_metadata.index)

    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        zoom_range=0.2,
        horizontal_flip=True
    )

    train_generator = train_datagen.flow_from_dataframe(
        train_metadata,
        x_col='image_path',
        y_col='dx',
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=True
    )

    base_model = EfficientNetB0(include_top=False, input_shape=(224, 224, 3))
    base_model.trainable = False

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    num_classes = len(train_generator.class_indices)
    output = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=output)
    model.compile(optimizer=Adam(), loss='categorical_crossentropy', metrics=['accuracy'])

    checkpoint_callback = ModelCheckpoint(
        filepath=CHECKPOINT_PATH,
        monitor='loss',
        save_best_only=True,
        save_weights_only=True,
        verbose=1
    )

    history = model.fit(
        train_generator,
        epochs=EPOCHS,
        callbacks=[checkpoint_callback]
    )

    return f"✅ Training complete for Round {TRAINING_ROUND}. Model saved at {CHECKPOINT_PATH}"
