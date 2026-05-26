import asyncio
import uuid
import time
from orchestrator import orchestrator
from models.ir_models import IntentRequest

# 10 Real World Prompts
REAL_WORLD = [
    "Build a CRM with login, analytics dashboard, premium subscriptions, admin roles, and payment support.",
    "Build an ecommerce platform with a shopping cart, Stripe integration, user reviews, and inventory management.",
    "Build a Learning Management System (LMS) with roles for Teachers, Students, and Admins. Must have video upload capabilities and quiz generation.",
    "Build a Human Resources portal for onboarding new employees, tracking time off, and managing payroll integrations.",
    "Build a SaaS dashboard for social media analytics that pulls data from multiple platforms and has tiered subscription plans.",
    "Create a real estate listing app where agents can post properties, and buyers can schedule viewings. Needs map integration.",
    "Build a project management tool similar to Jira, with customizable workflows, kanban boards, and issue tracking.",
    "Create a telemedicine platform with HIPAA compliant video calls, appointment scheduling, and prescription generation.",
    "Build a fitness tracking app where users can log workouts, connect wearable data, and compete on leaderboards.",
    "Create a restaurant reservation system with table management, online ordering, and integration with POS systems."
]

# 10 Edge Cases
EDGE_CASES = [
    "Build an app.", # Vague requirements
    "Create a system where users have no roles but everyone is an admin except when they are not.", # Conflicting roles
    "I need a dashboard with admin access, but admins shouldn't see any data, and users should see everything.", # Contradictory permissions
    "Build a platform with a login page, but no authentication system is needed.", # Incomplete auth
    "Create an app where users pay for items, but there is no pricing model and items are free but require a credit card.", # Inconsistent business logic
    "Build a CRM.", # Very vague
    "A website that has a database but no backend.", # Impossible architecture constraint
    "An application with 10,000 concurrent users but only uses local SQLite.", # Scalability mismatch
    "Build an app with roles: A, B, C, D, E, F, G, H, I, J, K.", # Too many roles
    "Make something that uses every single AWS service." # Unrealistic scope
]

async def evaluate():
    print("Starting Evaluation Pipeline...")
    total_prompts = len(REAL_WORLD) + len(EDGE_CASES)
    success_count = 0
    failure_count = 0
    
    all_prompts = REAL_WORLD + EDGE_CASES
    start_time = time.time()

    for i, prompt in enumerate(all_prompts):
        request = IntentRequest(prompt=prompt)
        job_id = orchestrator.create_job()
        
        # Run pipeline synchronously for evaluation
        print(f"[{i+1}/{total_prompts}] Testing Prompt: '{prompt[:50]}...'")
        await orchestrator.run_pipeline(job_id, request)
        
        job = orchestrator.get_job(job_id)
        if job["status"] == "completed":
            success_count += 1
            print(f"  -> SUCCESS (Confidence: {job['report']['execution_confidence']})")
        else:
            failure_count += 1
            print(f"  -> FAILED")

    duration = time.time() - start_time
    print("\n--- Evaluation Summary ---")
    print(f"Total Prompts Tested: {total_prompts}")
    print(f"Success Rate: {(success_count / total_prompts) * 100}%")
    print(f"Total Latency: {duration:.2f} seconds")
    print(f"Average Latency per Prompt: {duration/total_prompts:.2f} seconds")
    print("--------------------------")

if __name__ == "__main__":
    asyncio.run(evaluate())
