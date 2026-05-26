from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class IntentRequest(BaseModel):
    prompt: str
    media_context: Optional[str] = None

class ClarificationQuestion(BaseModel):
    id: str
    question: str
    options: Optional[List[str]] = None

class IntentResponse(BaseModel):
    is_clear: bool
    missing_requirements: List[str] = []
    clarification_questions: List[ClarificationQuestion] = []
    extracted_features: List[str] = []

class IntermediateRepresentation(BaseModel):
    project_type: str = Field(description="The main type of the project, e.g., 'crm', 'ecommerce'")
    scalability: str = Field(description="Expected scalability, e.g., 'low', 'medium', 'high'")
    auth: bool = Field(description="Whether authentication is required")
    roles: List[str] = Field(description="User roles in the system", default_factory=list)
    payments: bool = Field(description="Whether payments are required")
    database: str = Field(description="Database type, e.g., 'postgresql', 'mongodb'")
    features: List[str] = Field(description="List of specific features extracted from intent", default_factory=list)
