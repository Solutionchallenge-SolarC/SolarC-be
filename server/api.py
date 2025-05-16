from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import shutil
import os
from predict import predict_with_threshold, load_model_weights
from main import train_model  # ← main.py도 함수화되어 있어야 함

app = FastAPI()

@app.post("/train")
def train():
    try:
        result = train_model()  # main.py에서 함수로 빼서 사용해야 함
        return {"message": result}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# 파일 상단에 전역 모델 로드
model = load_model_weights("checkpoints/best_model.h5")

@app.post("/predict")
async def predict(file: UploadFile = File(...), threshold: float = Form(0.5)):
    print("✅ 요청 들어옴!")  # ✅ 여기에 로그 넣기

    try:
        os.makedirs("temp", exist_ok=True)
        file_path = os.path.join("temp", file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        if model is None:
            raise RuntimeError("❌ 모델이 로드되지 않았습니다.")  # 꼭 넣어!

        predictions = predict_with_threshold(model, file_path, threshold)

        os.remove(file_path)
        return {"predictions": predictions}
    except Exception as e:
        print(f"❌ 예측 중 오류 발생: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})