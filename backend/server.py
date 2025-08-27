# BACKEND
from quantum_engine.bb84_protocol import BB84Protocol
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 

app = FastAPI()

origins = [
    "http://127.0.0.1:5174",
    "http://localhost:5174",
     "http://127.0.0.1:5173",
    "http://localhost:5173",
    "https://bb84-qkd-simulation-blochbusters.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  
)

@app.get('/')
def getResponse(KEY_LENGTH: int, is_eve_active: bool, noise_percent: int):
    obj = BB84Protocol(
        KEY_LENGTH=KEY_LENGTH,
        is_eve_active=is_eve_active,
        noise_percent=noise_percent
    )
    obj.run_simulation() 
    return obj.getResponse()

