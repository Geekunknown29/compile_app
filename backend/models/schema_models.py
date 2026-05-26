from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class DBModelField(BaseModel):
    name: str
    type: str
    required: bool = True
    relation: Optional[str] = None

class DBModel(BaseModel):
    name: str
    fields: List[DBModelField]

class APIEndpoint(BaseModel):
    path: str
    method: str
    description: str
    auth_required: bool
    roles_allowed: List[str] = []

class UIComponent(BaseModel):
    name: str
    description: str
    props: Dict[str, str] = {}

class ArchitecturePlan(BaseModel):
    db_models: List[DBModel] = []
    api_endpoints: List[APIEndpoint] = []
    ui_components: List[UIComponent] = []

class SchemaGenerationResult(BaseModel):
    ui_schema: Dict[str, Any]
    api_schema: Dict[str, Any]
    db_schema: Dict[str, Any]
    auth_rules: Dict[str, Any]

class ValidationError(BaseModel):
    module: str
    issue: str

class ValidationReport(BaseModel):
    passed: bool
    errors: List[ValidationError] = []

class CodeGenerationResult(BaseModel):
    frontend_files: Dict[str, str]
    backend_files: Dict[str, str]

class RuntimeRisk(BaseModel):
    severity: str
    description: str

class RuntimeVerificationReport(BaseModel):
    status: str
    possible_failures: List[str] = []
    risks: List[RuntimeRisk] = []

class ReliabilityReport(BaseModel):
    job_id: str
    validation_results: ValidationReport
    repair_history: List[str] = []
    runtime_risks: RuntimeVerificationReport
    architecture_summary: ArchitecturePlan
    execution_confidence: float
    scalability_notes: str
