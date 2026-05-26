from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import os
import zipfile
from fastapi.responses import FileResponse

from orchestrator import orchestrator
from models.ir_models import IntentRequest

app = FastAPI(title="AI Compiler API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ClarifyRequest(BaseModel):
    job_id: str
    answers: dict

@app.post("/api/generate/start")
async def start_generation(request: IntentRequest, background_tasks: BackgroundTasks):
    job_id = orchestrator.create_job()
    background_tasks.add_task(orchestrator.run_pipeline, job_id, request)
    return {"job_id": job_id, "status": "started"}

@app.post("/api/generate/clarify")
async def clarify_generation(request: ClarifyRequest, background_tasks: BackgroundTasks):
    job = orchestrator.get_job(request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    orchestrator.submit_clarifications(request.job_id, request.answers)
    
    # Rerun pipeline with clarifications
    class MockRequest:
        def __init__(self, prompt):
            self.prompt = prompt
            
    background_tasks.add_task(orchestrator.run_pipeline, request.job_id, MockRequest(prompt=job["prompt"]))
    return {"status": "resumed"}

@app.get("/api/generate/status/{job_id}")
async def get_status(job_id: str):
    job = orchestrator.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.get("/api/download/{job_id}")
async def download_project(job_id: str):
    job = orchestrator.get_job(job_id)
    if not job or job["status"] != "completed":
        raise HTTPException(status_code=404, detail="Job not found or not completed")
    
    code_assets = job.get("code_assets", {})
    if not code_assets:
        raise HTTPException(status_code=500, detail="Generated code assets are missing")
        
    import tempfile
    temp_dir = tempfile.gettempdir()
    zip_path = os.path.join(temp_dir, f"{job_id}.zip")
    
    readme_content = f"""# Compiled Application: {job_id}

This application structure was automatically compiled and verified by the AI Compiler with Gemini API support.

## Structure
- `/backend`: FastAPI Server + schemas
- `/frontend`: React/Tailwind Components

## How to Run

### Backend
1. `cd backend`
2. `pip install fastapi uvicorn pydantic`
3. `uvicorn main:app --reload`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run start`
"""

    with zipfile.ZipFile(zip_path, 'w') as zf:
        zf.writestr('README.md', readme_content)
        zf.writestr('backend/main.py', code_assets.get("backend_main_py", ""))
        zf.writestr('backend/models.py', code_assets.get("backend_models_py", ""))
        zf.writestr('backend/requirements.txt', 'fastapi==0.104.1\nuvicorn==0.24.0\npydantic==2.5.2\n')
        zf.writestr('frontend/src/App.jsx', code_assets.get("frontend_app_jsx", ""))
        zf.writestr('frontend/package.json', '{\n  "name": "generated-frontend",\n  "version": "0.1.0",\n  "dependencies": {\n    "react": "^18.0.0",\n    "react-dom": "^18.0.0"\n  }\n}\n')
        
    return FileResponse(zip_path, media_type='application/zip', filename=f'project_{job_id}.zip')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
